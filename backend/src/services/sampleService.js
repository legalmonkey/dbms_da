const { pool } = require('../config/db');
const { parsePagination } = require('../utils/validation');

/**
 * Fetch paginated samples with joined patient, lab, and technician names.
 */
async function getSamples(query = {}) {
  const { page, pageSize, offset } = parsePagination(query);
  const whereClauses = [];
  const params = [];

  if (query.orderId) {
    whereClauses.push('s.Order_ID = ?');
    params.push(query.orderId);
  }

  if (query.labId) {
    whereClauses.push('s.Lab_ID = ?');
    params.push(query.labId);
  }

  if (query.techId) {
    whereClauses.push('s.Tech_ID = ?');
    params.push(query.techId);
  }

  if (query.q) {
    whereClauses.push(`(
      s.Order_ID LIKE ? OR
      s.Sample_No LIKE ? OR
      o.Patient_ID LIKE ? OR
      (p.First_Name || ' ' || p.Last_Name) LIKE ?
    )`);
    const like = `%${query.q.trim()}%`;
    params.push(like, like, like, like);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count total matching
  const [countResult] = await pool.query(
    `SELECT COUNT(*) AS "total"
     FROM Sample s
     JOIN TestOrder o ON s.Order_ID = o.Order_ID
     JOIN Patient p ON o.Patient_ID = p.Patient_ID
     ${whereSql}`,
    params
  );
  const total = countResult[0] ? Number(countResult[0].total) : 0;

  const sql = `
    SELECT 
      s.Sample_No AS "Sample_No",
      s.Order_ID AS "Order_ID",
      o.Patient_ID AS "Patient_ID",
      (p.First_Name || ' ' || p.Last_Name) AS "Patient_Name",
      s.Sample_Type AS "Sample_Type",
      TO_CHAR(s.Collection_Date, 'YYYY-MM-DD"T"HH24:MI:SS') AS "Collection_DateTime",
      s.Lab_ID AS "Lab_ID",
      l.Lab_Name AS "Lab_Name",
      s.Tech_ID AS "Tech_ID",
      st.Name AS "Tech_Name",
      'Collected' AS "Status"
    FROM Sample s
    JOIN TestOrder o ON s.Order_ID = o.Order_ID
    JOIN Patient p ON o.Patient_ID = p.Patient_ID
    JOIN Laboratory l ON s.Lab_ID = l.Lab_ID
    JOIN LabStaff st ON s.Tech_ID = st.Staff_ID
    ${whereSql}
    ORDER BY s.Collection_Date DESC
    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
  `;

  const [rows] = await pool.query(sql, [...params, offset, pageSize]);
  return { data: rows, total, page, pageSize };
}

/**
 * Fetch a single sample by its compound key (Order_ID + Sample_No) or Sample_No.
 */
async function getSampleById(sampleNo, orderId = null) {
  let sql = `
    SELECT 
      s.Sample_No AS "Sample_No",
      s.Order_ID AS "Order_ID",
      o.Patient_ID AS "Patient_ID",
      (p.First_Name || ' ' || p.Last_Name) AS "Patient_Name",
      s.Sample_Type AS "Sample_Type",
      TO_CHAR(s.Collection_Date, 'YYYY-MM-DD"T"HH24:MI:SS') AS "Collection_DateTime",
      s.Lab_ID AS "Lab_ID",
      l.Lab_Name AS "Lab_Name",
      s.Tech_ID AS "Tech_ID",
      st.Name AS "Tech_Name",
      'Collected' AS "Status"
    FROM Sample s
    JOIN TestOrder o ON s.Order_ID = o.Order_ID
    JOIN Patient p ON o.Patient_ID = p.Patient_ID
    JOIN Laboratory l ON s.Lab_ID = l.Lab_ID
    JOIN LabStaff st ON s.Tech_ID = st.Staff_ID
    WHERE s.Sample_No = ?
  `;
  const params = [sampleNo];

  if (orderId) {
    sql += ' AND s.Order_ID = ?';
    params.push(orderId);
  }

  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
}

/**
 * Create a new sample, safely computing Sample_No (S1, S2...) per order,
 * and transitioning TestOrder from Pending to Processing in a transaction.
 */
async function createSample(data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Verify Order exists
    const [orderRows] = await conn.query(
      'SELECT Order_ID AS "Order_ID", Status AS "Status" FROM TestOrder WHERE Order_ID = ?',
      [data.Order_ID]
    );
    if (orderRows.length === 0) {
      const error = new Error('Selected order does not exist');
      error.statusCode = 400;
      error.code = 'VALIDATION_FAILED';
      throw error;
    }
    const order = orderRows[0];

    // 2. Verify Laboratory exists
    let labId = data.Lab_ID;
    const [labRows] = await conn.query(
      'SELECT Lab_ID AS "Lab_ID" FROM Laboratory WHERE Lab_ID = ?',
      [labId]
    );
    if (labRows.length === 0) {
      const [allLabs] = await conn.query('SELECT Lab_ID AS "Lab_ID" FROM Laboratory ORDER BY Lab_ID ASC');
      labId = allLabs[0]?.Lab_ID || 'L01';
    }

    // 3. Verify Technician exists
    let techId = data.Tech_ID;
    const [techRows] = await conn.query(
      'SELECT Staff_ID AS "Staff_ID" FROM LabTechnician WHERE Staff_ID = ?',
      [techId]
    );
    if (techRows.length === 0) {
      const [allTechs] = await conn.query('SELECT Staff_ID AS "Staff_ID" FROM LabTechnician ORDER BY Staff_ID ASC');
      techId = allTechs[0]?.Staff_ID || 'ST001';
    }

    // 4. Determine sequential Sample_No (S1, S2...)
    let sampleNo = data.Sample_No;
    if (!sampleNo) {
      const [existingSamples] = await conn.query(
        'SELECT Sample_No AS "Sample_No" FROM Sample WHERE Order_ID = ?',
        [data.Order_ID]
      );
      const count = existingSamples.length + 1;
      sampleNo = `S${count}`;
    }

    const sampleType = data.Sample_Type || 'Blood';
    const collectionDate = data.Collection_DateTime ? data.Collection_DateTime.slice(0, 10) : new Date().toISOString().slice(0, 10);

    // 5. Insert Sample
    await conn.query(
      `INSERT INTO Sample (Order_ID, Sample_No, Collection_Date, Sample_Type, Lab_ID, Tech_ID)
       VALUES (?, ?, TO_DATE(?, 'YYYY-MM-DD'), ?, ?, ?)`,
      [data.Order_ID, sampleNo, collectionDate, sampleType, labId, techId]
    );

    // 6. Transition Order status to Processing
    if (order.Status === 'Pending') {
      await conn.query(
        `UPDATE TestOrder SET Status = 'Processing' WHERE Order_ID = ?`,
        [data.Order_ID]
      );
    }

    await conn.commit();
    return getSampleById(sampleNo, data.Order_ID);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Update sample details.
 */
async function updateSample(sampleNo, orderId, data) {
  const updates = [];
  const params = [];

  if (data.Sample_Type) {
    updates.push('Sample_Type = ?');
    params.push(data.Sample_Type);
  }
  if (data.Lab_ID) {
    updates.push('Lab_ID = ?');
    params.push(data.Lab_ID);
  }
  if (data.Tech_ID) {
    updates.push('Tech_ID = ?');
    params.push(data.Tech_ID);
  }

  if (updates.length === 0) {
    return getSampleById(sampleNo, orderId);
  }

  params.push(sampleNo);
  let where = 'WHERE Sample_No = ?';
  if (orderId) {
    where += ' AND Order_ID = ?';
    params.push(orderId);
  }

  await pool.query(`UPDATE Sample SET ${updates.join(', ')} ${where}`, params);
  return getSampleById(sampleNo, orderId);
}

/**
 * Delete a sample record.
 */
async function deleteSample(sampleNo, orderId) {
  let sql = 'DELETE FROM Sample WHERE Sample_No = ?';
  const params = [sampleNo];

  if (orderId) {
    sql += ' AND Order_ID = ?';
    params.push(orderId);
  }

  const [, result] = await pool.query(sql, params);
  return (result?.rowsAffected || 0) > 0;
}

module.exports = {
  getSamples,
  getSampleById,
  createSample,
  updateSample,
  deleteSample,
};
