const { pool } = require('../config/db');
const { generateNextId, parsePagination } = require('../utils/validation');

/**
 * Fetch a paginated list of patients with search, filters, sorting,
 * and aggregated Order_Count + Last_Order_Date.
 */
async function getPatients(query) {
  const { page, pageSize, offset } = parsePagination(query);
  const search = (query.q || '').trim();
  const gender = query.gender;
  const sort = query.sort || 'Patient_ID';
  const order = (query.order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const whereClauses = [];
  const params = [];

  if (search) {
    whereClauses.push(`(
      p.Patient_ID LIKE ? OR
      p.First_Name LIKE ? OR
      p.Last_Name LIKE ? OR
      (p.First_Name || ' ' || p.Last_Name) LIKE ? OR
      EXISTS (
        SELECT 1 FROM Patient_Contact pc
        WHERE pc.Patient_ID = p.Patient_ID AND pc.Contact_No LIKE ?
      )
    )`);
    const likePattern = `%${search}%`;
    params.push(likePattern, likePattern, likePattern, likePattern, likePattern);
  }

  if (gender) {
    whereClauses.push('p.Gender = ?');
    params.push(gender);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count total matching patients
  const [countResult] = await pool.query(
    `SELECT COUNT(DISTINCT p.Patient_ID) AS "total" FROM Patient p ${whereSql}`,
    params
  );
  const total = countResult[0] ? Number(countResult[0].total) : 0;

  // Validate allowed sort fields
  const allowedSorts = {
    Patient_ID: 'p.Patient_ID',
    First_Name: 'p.First_Name',
    Last_Order_Date: 'MAX(o.Order_Date)',
    Order_Count: 'COUNT(DISTINCT o.Order_ID)',
  };
  const sortColumn = allowedSorts[sort] || 'p.Patient_ID';

  // Fetch paginated patient rows with aggregated order stats using Oracle SQL
  const selectQuery = `
    SELECT 
      p.Patient_ID AS "Patient_ID",
      p.First_Name AS "First_Name",
      p.Last_Name AS "Last_Name",
      TO_CHAR(p.DOB, 'YYYY-MM-DD') AS "DOB",
      p.Gender AS "Gender",
      COUNT(DISTINCT o.Order_ID) AS "Order_Count",
      TO_CHAR(MAX(o.Order_Date), 'YYYY-MM-DD') AS "Last_Order_Date"
    FROM Patient p
    LEFT JOIN TestOrder o ON p.Patient_ID = o.Patient_ID
    ${whereSql}
    GROUP BY p.Patient_ID, p.First_Name, p.Last_Name, p.DOB, p.Gender
    ORDER BY ${sortColumn} ${order}
    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
  `;

  const [patients] = await pool.query(selectQuery, [...params, offset, pageSize]);

  if (patients.length === 0) {
    return { data: [], total, page, pageSize };
  }

  // Fetch contacts for these patients
  const enriched = await Promise.all(
    patients.map(async (p) => {
      const [contacts] = await pool.query(
        `SELECT Patient_ID AS "Patient_ID", Contact_No AS "Contact_No" FROM Patient_Contact WHERE Patient_ID = ?`,
        [p.Patient_ID]
      );
      return {
        ...p,
        Order_Count: Number(p.Order_Count) || 0,
        Contacts: contacts || [],
      };
    })
  );

  return { data: enriched, total, page, pageSize };
}

/**
 * Fetch a single patient by ID along with their contacts.
 */
async function getPatientById(patientId) {
  const [rows] = await pool.query(
    `SELECT Patient_ID AS "Patient_ID", First_Name AS "First_Name", Last_Name AS "Last_Name", TO_CHAR(DOB, 'YYYY-MM-DD') AS "DOB", Gender AS "Gender"
     FROM Patient WHERE Patient_ID = ?`,
    [patientId]
  );

  if (rows.length === 0) {
    return null;
  }

  const patient = rows[0];

  const [contacts] = await pool.query(
    `SELECT Patient_ID AS "Patient_ID", Contact_No AS "Contact_No" FROM Patient_Contact WHERE Patient_ID = ?`,
    [patientId]
  );

  patient.Contacts = contacts.map((c) => ({
    Patient_ID: c.Patient_ID,
    Contact_No: c.Contact_No,
  }));

  return patient;
}

/**
 * Create a new patient and insert multiple contact numbers in a transaction.
 */
async function createPatient(data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let patientId = data.Patient_ID;
    if (!patientId) {
      const [existing] = await conn.query('SELECT Patient_ID AS "Patient_ID" FROM Patient');
      const existingIds = existing.map((r) => r.Patient_ID);
      patientId = generateNextId(existingIds, 'P', 4);
    }

    const dobString = data.DOB ? data.DOB.slice(0, 10) : '1990-01-01';

    // Insert Patient
    await conn.query(
      `INSERT INTO Patient (Patient_ID, First_Name, Last_Name, DOB, Gender)
       VALUES (?, ?, ?, TO_DATE(?, 'YYYY-MM-DD'), ?)`,
      [patientId, data.First_Name.trim(), data.Last_Name.trim(), dobString, data.Gender]
    );

    // Insert Contacts
    const contacts = Array.isArray(data.Contacts) ? data.Contacts : [];
    const insertedContacts = [];

    for (const c of contacts) {
      const num = typeof c === 'string' ? c.trim() : (c.Contact_No || '').trim();
      if (num) {
        await conn.query(
          `INSERT INTO Patient_Contact (Patient_ID, Contact_No) VALUES (?, ?)`,
          [patientId, num]
        );
        insertedContacts.push({ Patient_ID: patientId, Contact_No: num });
      }
    }

    await conn.commit();

    return {
      Patient_ID: patientId,
      First_Name: data.First_Name.trim(),
      Last_Name: data.Last_Name.trim(),
      DOB: dobString,
      Gender: data.Gender,
      Contacts: insertedContacts,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Update an existing patient and replace contact numbers in a transaction.
 */
async function updatePatient(patientId, data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      `SELECT Patient_ID AS "Patient_ID" FROM Patient WHERE Patient_ID = ?`,
      [patientId]
    );
    if (existing.length === 0) {
      await conn.rollback();
      return null;
    }

    // Update patient details
    const updates = [];
    const params = [];

    if (data.First_Name !== undefined) {
      updates.push('First_Name = ?');
      params.push(data.First_Name.trim());
    }
    if (data.Last_Name !== undefined) {
      updates.push('Last_Name = ?');
      params.push(data.Last_Name.trim());
    }
    if (data.DOB !== undefined) {
      updates.push("DOB = TO_DATE(?, 'YYYY-MM-DD')");
      params.push(data.DOB.slice(0, 10));
    }
    if (data.Gender !== undefined) {
      updates.push('Gender = ?');
      params.push(data.Gender);
    }

    if (updates.length > 0) {
      params.push(patientId);
      await conn.query(
        `UPDATE Patient SET ${updates.join(', ')} WHERE Patient_ID = ?`,
        params
      );
    }

    // Replace contacts if provided
    if (data.Contacts !== undefined && Array.isArray(data.Contacts)) {
      await conn.query(`DELETE FROM Patient_Contact WHERE Patient_ID = ?`, [patientId]);

      for (const c of data.Contacts) {
        const num = typeof c === 'string' ? c.trim() : (c.Contact_No || '').trim();
        if (num) {
          await conn.query(
            `INSERT INTO Patient_Contact (Patient_ID, Contact_No) VALUES (?, ?)`,
            [patientId, num]
          );
        }
      }
    }

    await conn.commit();
    return getPatientById(patientId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Delete a patient only if no active orders exist.
 */
async function deletePatient(patientId) {
  // Check for orders
  const [orders] = await pool.query(
    `SELECT COUNT(*) AS "orderCount" FROM TestOrder WHERE Patient_ID = ?`,
    [patientId]
  );

  if (orders[0] && Number(orders[0].orderCount) > 0) {
    const error = new Error('Patient cannot be deleted because active orders exist');
    error.statusCode = 409;
    error.code = 'CONFLICT';
    throw error;
  }

  const [, result] = await pool.query(`DELETE FROM Patient WHERE Patient_ID = ?`, [patientId]);
  return (result?.rowsAffected || 0) > 0;
}

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};
