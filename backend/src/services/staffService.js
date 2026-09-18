const { pool } = require('../config/db');
const { generateNextId } = require('../utils/validation');

/**
 * Fetch all lab staff members with their Technician or Pathologist specialization.
 */
async function getStaff(query = {}) {
  const whereClauses = [];
  const params = [];

  if (query.role === 'Technician') {
    whereClauses.push('t.Staff_ID IS NOT NULL');
  } else if (query.role === 'Pathologist') {
    whereClauses.push('p.Staff_ID IS NOT NULL');
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT 
      s.Staff_ID AS "Staff_ID",
      s.Name AS "Staff_Name",
      s.Shift AS "Shift",
      CASE 
        WHEN p.Staff_ID IS NOT NULL THEN 'Pathologist'
        WHEN t.Staff_ID IS NOT NULL THEN 'Technician'
        ELSE 'Staff'
      END AS "Staff_Role",
      t.Staff_ID AS "Tech_ID",
      t.Certification AS "Certification",
      p.Staff_ID AS "Pathologist_ID",
      p.License_No AS "License_No",
      p.Qualification AS "Qualification"
    FROM LabStaff s
    LEFT JOIN LabTechnician t ON s.Staff_ID = t.Staff_ID
    LEFT JOIN Pathologist p ON s.Staff_ID = p.Staff_ID
    ${whereSql}
    ORDER BY s.Name ASC
  `;

  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Fetch single staff member by ID with subtype details.
 */
async function getStaffById(staffId) {
  const sql = `
    SELECT 
      s.Staff_ID AS "Staff_ID",
      s.Name AS "Staff_Name",
      s.Shift AS "Shift",
      CASE 
        WHEN p.Staff_ID IS NOT NULL THEN 'Pathologist'
        WHEN t.Staff_ID IS NOT NULL THEN 'Technician'
        ELSE 'Staff'
      END AS "Staff_Role",
      t.Staff_ID AS "Tech_ID",
      t.Certification AS "Certification",
      p.Staff_ID AS "Pathologist_ID",
      p.License_No AS "License_No",
      p.Qualification AS "Qualification"
    FROM LabStaff s
    LEFT JOIN LabTechnician t ON s.Staff_ID = t.Staff_ID
    LEFT JOIN Pathologist p ON s.Staff_ID = p.Staff_ID
    WHERE s.Staff_ID = ?
  `;

  const [rows] = await pool.query(sql, [staffId]);
  return rows[0] || null;
}

/**
 * Create a new staff member with Technician or Pathologist subtype in a transaction.
 */
async function createStaff(data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let staffId = data.Staff_ID;
    if (!staffId) {
      const [existing] = await conn.query('SELECT Staff_ID AS "Staff_ID" FROM LabStaff');
      const existingIds = existing.map((r) => r.Staff_ID);
      staffId = generateNextId(existingIds, 'ST', 3);
    }

    const name = (data.Staff_Name || data.Name || '').trim();
    const shift = data.Shift || 'General';
    const role = data.Staff_Role || 'Technician';

    // 1. Insert LabStaff
    await conn.query(
      `INSERT INTO LabStaff (Staff_ID, Name, Shift)
       VALUES (?, ?, ?)`,
      [staffId, name, shift]
    );

    // 2. Insert Subtype
    if (role === 'Technician') {
      const certification = (data.Certification || 'Certified Medical Technician').trim();
      await conn.query(
        `INSERT INTO LabTechnician (Staff_ID, Certification) VALUES (?, ?)`,
        [staffId, certification]
      );
    } else if (role === 'Pathologist') {
      const licenseNo = (data.License_No || 'KMC-00000').trim();
      const qualification = (data.Qualification || 'MD Pathology').trim();
      await conn.query(
        `INSERT INTO Pathologist (Staff_ID, License_No, Qualification) VALUES (?, ?, ?)`,
        [staffId, licenseNo, qualification]
      );
    }

    await conn.commit();
    return getStaffById(staffId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Update staff details and subtype properties in a transaction.
 */
async function updateStaff(staffId, data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT Staff_ID AS "Staff_ID" FROM LabStaff WHERE Staff_ID = ?', [staffId]);
    if (existing.length === 0) {
      await conn.rollback();
      return null;
    }

    const updates = [];
    const params = [];

    const name = data.Staff_Name || data.Name;
    if (name !== undefined) {
      updates.push('Name = ?');
      params.push(name.trim());
    }
    if (data.Shift !== undefined) {
      updates.push('Shift = ?');
      params.push(data.Shift);
    }

    if (updates.length > 0) {
      params.push(staffId);
      await conn.query(`UPDATE LabStaff SET ${updates.join(', ')} WHERE Staff_ID = ?`, params);
    }

    // Subtype updates
    if (data.Certification) {
      await conn.query(`UPDATE LabTechnician SET Certification = ? WHERE Staff_ID = ?`, [
        data.Certification.trim(),
        staffId,
      ]);
    }
    if (data.License_No || data.Qualification) {
      const pathUpdates = [];
      const pathParams = [];
      if (data.License_No) {
        pathUpdates.push('License_No = ?');
        pathParams.push(data.License_No.trim());
      }
      if (data.Qualification) {
        pathUpdates.push('Qualification = ?');
        pathParams.push(data.Qualification.trim());
      }
      if (pathUpdates.length > 0) {
        pathParams.push(staffId);
        await conn.query(
          `UPDATE Pathologist SET ${pathUpdates.join(', ')} WHERE Staff_ID = ?`,
          pathParams
        );
      }
    }

    await conn.commit();
    return getStaffById(staffId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Delete a staff member only if they have not collected samples or authorized reports.
 */
async function deleteStaff(staffId) {
  const [samples] = await pool.query(
    `SELECT COUNT(*) AS "count" FROM Sample WHERE Tech_ID = ?`,
    [staffId]
  );
  if (samples[0] && Number(samples[0].count) > 0) {
    const error = new Error('Staff cannot be deleted because they have logged sample intake records');
    error.statusCode = 409;
    error.code = 'CONFLICT';
    throw error;
  }

  const [reports] = await pool.query(
    `SELECT COUNT(*) AS "count" FROM Report WHERE Pathologist_ID = ?`,
    [staffId]
  );
  if (reports[0] && Number(reports[0].count) > 0) {
    const error = new Error('Staff cannot be deleted because they have authorized clinical reports');
    error.statusCode = 409;
    error.code = 'CONFLICT';
    throw error;
  }

  const [, result] = await pool.query(`DELETE FROM LabStaff WHERE Staff_ID = ?`, [staffId]);
  return (result?.rowsAffected || 0) > 0;
}

module.exports = {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
};
