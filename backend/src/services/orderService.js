const { pool } = require('../config/db');
const { generateNextId, parsePagination } = require('../utils/validation');

/**
 * Fetch paginated orders with patient, doctor, and test line items.
 */
async function getOrders(query = {}) {
  const { page, pageSize, offset } = parsePagination(query);
  const whereClauses = [];
  const params = [];

  if (query.status && query.status !== 'All') {
    whereClauses.push('o.Status = ?');
    params.push(query.status);
  }

  if (query.patientId) {
    whereClauses.push('o.Patient_ID = ?');
    params.push(query.patientId);
  }

  if (query.q) {
    whereClauses.push(`(
      o.Order_ID LIKE ? OR
      p.Patient_ID LIKE ? OR
      (p.First_Name || ' ' || p.Last_Name) LIKE ?
    )`);
    const like = `%${query.q.trim()}%`;
    params.push(like, like, like);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count total matching orders
  const [countResult] = await pool.query(
    `SELECT COUNT(DISTINCT o.Order_ID) AS "total"
     FROM TestOrder o
     JOIN Patient p ON o.Patient_ID = p.Patient_ID
     ${whereSql}`,
    params
  );
  const total = countResult[0] ? Number(countResult[0].total) : 0;

  // Sorting
  const allowedSorts = {
    Order_ID: 'o.Order_ID',
    Order_Date: 'o.Order_Date',
    Status: 'o.Status',
  };
  const sortColumn = allowedSorts[query.sort] || 'o.Order_Date';
  const order = (query.order || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const sql = `
    SELECT 
      o.Order_ID AS "Order_ID",
      TO_CHAR(o.Order_Date, 'YYYY-MM-DD') AS "Order_Date",
      o.Patient_ID AS "Patient_ID",
      (p.First_Name || ' ' || p.Last_Name) AS "Patient_Name",
      o.Doctor_ID AS "Doctor_ID",
      d.Name AS "Doctor_Name",
      d.Specialization AS "Specialization",
      o.Status AS "Status",
      (
        SELECT COALESCE(SUM(t.Price), 0)
        FROM OrderIncludesTest oit
        JOIN Test t ON oit.Test_ID = t.Test_ID
        WHERE oit.Order_ID = o.Order_ID
      ) AS "Total_Price"
    FROM TestOrder o
    JOIN Patient p ON o.Patient_ID = p.Patient_ID
    LEFT JOIN Doctor d ON o.Doctor_ID = d.Doctor_ID
    ${whereSql}
    ORDER BY ${sortColumn} ${order}
    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
  `;

  const [orders] = await pool.query(sql, [...params, offset, pageSize]);

  if (orders.length === 0) {
    return { data: [], total, page, pageSize };
  }

  // Fetch test lines for these orders
  const enriched = await Promise.all(
    orders.map(async (o) => {
      const [testLines] = await pool.query(
        `SELECT 
          oit.Order_ID AS "Order_ID",
          t.Test_ID AS "Test_ID",
          t.Test_Name AS "Test_Name",
          t.Category AS "Test_Category",
          t.Price AS "Price",
          pt.Specimen_Type AS "Specimen_Type",
          rt.Imaging_Modality AS "Imaging_Modality"
         FROM OrderIncludesTest oit
         JOIN Test t ON oit.Test_ID = t.Test_ID
         LEFT JOIN PathologyTest pt ON t.Test_ID = pt.Test_ID
         LEFT JOIN RadiologyTest rt ON t.Test_ID = rt.Test_ID
         WHERE oit.Order_ID = ?`,
        [o.Order_ID]
      );

      return {
        ...o,
        Total_Price: Number(o.Total_Price) || 0,
        Tests: (testLines || []).map((t) => ({ ...t, Price: Number(t.Price) })),
      };
    })
  );

  return { data: enriched, total, page, pageSize };
}

/**
 * Fetch a single order by ID with its test lines.
 */
async function getOrderById(orderId) {
  const sql = `
    SELECT 
      o.Order_ID AS "Order_ID",
      TO_CHAR(o.Order_Date, 'YYYY-MM-DD') AS "Order_Date",
      o.Patient_ID AS "Patient_ID",
      (p.First_Name || ' ' || p.Last_Name) AS "Patient_Name",
      o.Doctor_ID AS "Doctor_ID",
      d.Name AS "Doctor_Name",
      d.Specialization AS "Specialization",
      o.Status AS "Status",
      (
        SELECT COALESCE(SUM(t.Price), 0)
        FROM OrderIncludesTest oit
        JOIN Test t ON oit.Test_ID = t.Test_ID
        WHERE oit.Order_ID = o.Order_ID
      ) AS "Total_Price"
    FROM TestOrder o
    JOIN Patient p ON o.Patient_ID = p.Patient_ID
    LEFT JOIN Doctor d ON o.Doctor_ID = d.Doctor_ID
    WHERE o.Order_ID = ?
  `;

  const [orders] = await pool.query(sql, [orderId]);
  if (orders.length === 0) return null;

  const order = orders[0];

  const [testLines] = await pool.query(
    `SELECT 
      oit.Order_ID AS "Order_ID",
      t.Test_ID AS "Test_ID",
      t.Test_Name AS "Test_Name",
      t.Category AS "Test_Category",
      t.Price AS "Price",
      pt.Specimen_Type AS "Specimen_Type",
      rt.Imaging_Modality AS "Imaging_Modality"
     FROM OrderIncludesTest oit
     JOIN Test t ON oit.Test_ID = t.Test_ID
     LEFT JOIN PathologyTest pt ON t.Test_ID = pt.Test_ID
     LEFT JOIN RadiologyTest rt ON t.Test_ID = rt.Test_ID
     WHERE oit.Order_ID = ?`,
    [orderId]
  );

  order.Total_Price = Number(order.Total_Price) || 0;
  order.Tests = (testLines || []).map((l) => ({
    ...l,
    Price: Number(l.Price),
  }));

  return order;
}

/**
 * Create a new test order in a transaction.
 */
async function createOrder(data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Verify patient exists
    const [patientRows] = await conn.query(
      'SELECT Patient_ID AS "Patient_ID" FROM Patient WHERE Patient_ID = ?',
      [data.Patient_ID]
    );
    if (patientRows.length === 0) {
      const error = new Error('Selected patient does not exist');
      error.statusCode = 400;
      error.code = 'VALIDATION_FAILED';
      throw error;
    }

    // 2. Verify doctor if provided
    let doctorId = data.Doctor_ID || null;
    if (doctorId) {
      const [doctorRows] = await conn.query(
        'SELECT Doctor_ID AS "Doctor_ID" FROM Doctor WHERE Doctor_ID = ?',
        [doctorId]
      );
      if (doctorRows.length === 0) {
        doctorId = null;
      }
    }
    // If no doctor, assign default doctor
    if (!doctorId) {
      const [docs] = await conn.query('SELECT Doctor_ID AS "Doctor_ID" FROM Doctor ORDER BY Doctor_ID ASC');
      if (docs.length > 0) doctorId = docs[0].Doctor_ID;
    }

    // 3. Verify tests
    const testIds = Array.isArray(data.Test_IDs) ? data.Test_IDs : [];
    if (testIds.length === 0) {
      const error = new Error('Select at least one test for the order');
      error.statusCode = 400;
      error.code = 'VALIDATION_FAILED';
      throw error;
    }

    // 4. Generate Order_ID
    const [existingOrders] = await conn.query('SELECT Order_ID AS "Order_ID" FROM TestOrder');
    const existingIds = existingOrders.map((o) => o.Order_ID);
    const orderId = generateNextId(existingIds, 'O', 4);

    const orderDate = data.Order_Date ? data.Order_Date.slice(0, 10) : new Date().toISOString().slice(0, 10);

    // 5. Insert TestOrder
    await conn.query(
      `INSERT INTO TestOrder (Order_ID, Patient_ID, Doctor_ID, Order_Date, Status)
       VALUES (?, ?, ?, TO_DATE(?, 'YYYY-MM-DD'), 'Pending')`,
      [orderId, data.Patient_ID, doctorId, orderDate]
    );

    // 6. Insert OrderIncludesTest lines
    for (const tid of testIds) {
      await conn.query(
        `INSERT INTO OrderIncludesTest (Order_ID, Test_ID) VALUES (?, ?)`,
        [orderId, tid]
      );
    }

    await conn.commit();
    return getOrderById(orderId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Cancel an order.
 */
async function cancelOrder(orderId) {
  await pool.query(
    `UPDATE TestOrder SET Status = 'Cancelled' WHERE Order_ID = ?`,
    [orderId]
  );
  return getOrderById(orderId);
}

/**
 * Delete an order only if a report has not been issued yet.
 */
async function deleteOrder(orderId) {
  const [reports] = await pool.query(
    `SELECT Report_ID AS "Report_ID" FROM Report WHERE Order_ID = ? AND Report_Date IS NOT NULL`,
    [orderId]
  );

  if (reports.length > 0) {
    const error = new Error('Cannot delete an order once a report has been issued; cancel instead');
    error.statusCode = 409;
    error.code = 'CONFLICT';
    throw error;
  }

  const [, result] = await pool.query(`DELETE FROM TestOrder WHERE Order_ID = ?`, [orderId]);
  return (result?.rowsAffected || 0) > 0;
}

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  deleteOrder,
};
