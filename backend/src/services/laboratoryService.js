const { pool } = require('../config/db');
const { generateNextId } = require('../utils/validation');

/**
 * Fetch all laboratories.
 */
async function getLaboratories() {
  const [rows] = await pool.query(
    `SELECT Lab_ID AS "Lab_ID", Lab_Name AS "Lab_Name", Location AS "Location", Contact_No AS "Contact_No" FROM Laboratory ORDER BY Lab_Name ASC`
  );
  return rows;
}

/**
 * Fetch a single laboratory by ID.
 */
async function getLaboratoryById(labId) {
  const [rows] = await pool.query(
    `SELECT Lab_ID AS "Lab_ID", Lab_Name AS "Lab_Name", Location AS "Location", Contact_No AS "Contact_No" FROM Laboratory WHERE Lab_ID = ?`,
    [labId]
  );
  return rows[0] || null;
}

/**
 * Create a new laboratory facility.
 */
async function createLaboratory(data) {
  let labId = data.Lab_ID;
  if (!labId) {
    const [existing] = await pool.query('SELECT Lab_ID AS "Lab_ID" FROM Laboratory');
    const existingIds = existing.map((r) => r.Lab_ID);
    labId = generateNextId(existingIds, 'L', 2);
  }

  await pool.query(
    `INSERT INTO Laboratory (Lab_ID, Lab_Name, Location, Contact_No) VALUES (?, ?, ?, ?)`,
    [labId, data.Lab_Name.trim(), data.Location.trim(), data.Contact_No.trim()]
  );

  return {
    Lab_ID: labId,
    Lab_Name: data.Lab_Name.trim(),
    Location: data.Location.trim(),
    Contact_No: data.Contact_No.trim(),
  };
}

/**
 * Update laboratory details.
 */
async function updateLaboratory(labId, data) {
  const updates = [];
  const params = [];

  if (data.Lab_Name) {
    updates.push('Lab_Name = ?');
    params.push(data.Lab_Name.trim());
  }
  if (data.Location) {
    updates.push('Location = ?');
    params.push(data.Location.trim());
  }
  if (data.Contact_No) {
    updates.push('Contact_No = ?');
    params.push(data.Contact_No.trim());
  }

  if (updates.length === 0) {
    return getLaboratoryById(labId);
  }

  params.push(labId);
  await pool.query(
    `UPDATE Laboratory SET ${updates.join(', ')} WHERE Lab_ID = ?`,
    params
  );

  return getLaboratoryById(labId);
}

/**
 * Delete a laboratory if no samples are currently processed at it.
 */
async function deleteLaboratory(labId) {
  const [samples] = await pool.query(
    `SELECT COUNT(*) AS "count" FROM Sample WHERE Lab_ID = ?`,
    [labId]
  );

  if (samples[0] && Number(samples[0].count) > 0) {
    const error = new Error('Laboratory cannot be deleted because samples are assigned to it');
    error.statusCode = 409;
    error.code = 'CONFLICT';
    throw error;
  }

  const [, result] = await pool.query(`DELETE FROM Laboratory WHERE Lab_ID = ?`, [labId]);
  return (result?.rowsAffected || 0) > 0;
}

module.exports = {
  getLaboratories,
  getLaboratoryById,
  createLaboratory,
  updateLaboratory,
  deleteLaboratory,
};
