const { pool } = require('../config/db');
const { parsePagination } = require('../utils/validation');

/**
 * Fetch paginated reports with patient, doctor, pathologist, and test findings.
 */
async function getReports(query = {}) {
  const { page, pageSize, offset } = parsePagination(query);
  const whereClauses = [];
  const params = [];

  if (query.patientId) {
    whereClauses.push('o.Patient_ID = ?');
    params.push(query.patientId);
  }

  if (query.pathologistId) {
    whereClauses.push('r.Pathologist_ID = ?');
    params.push(query.pathologistId);
  }

  if (query.q) {
    whereClauses.push(`(
      r.Report_ID LIKE ? OR
      r.Order_ID LIKE ? OR
      o.Patient_ID LIKE ? OR
      (p.First_Name || ' ' || p.Last_Name) LIKE ?
    )`);
    const like = `%${query.q.trim()}%`;
    params.push(like, like, like, like);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count total matching
  const [countResult] = await pool.query(
    `SELECT COUNT(DISTINCT r.Report_ID) AS "total"
     FROM Report r
     JOIN TestOrder o ON r.Order_ID = o.Order_ID
     JOIN Patient p ON o.Patient_ID = p.Patient_ID
     ${whereSql}`,
    params
  );
  const total = countResult[0] ? Number(countResult[0].total) : 0;

  const sql = `
    SELECT 
      r.Report_ID AS "Report_ID",
      r.Order_ID AS "Order_ID",
      TO_CHAR(r.Report_Date, 'YYYY-MM-DD"T"HH24:MI:SS') AS "Report_Date",
      o.Patient_ID AS "Patient_ID",
      p.First_Name AS "First_Name",
      p.Last_Name AS "Last_Name",
      TO_CHAR(p.DOB, 'YYYY-MM-DD') AS "DOB",
      p.Gender AS "Gender",
      o.Doctor_ID AS "Doctor_ID",
      d.Name AS "Doctor_Name",
      d.Specialization AS "Specialization",
      r.Pathologist_ID AS "Pathologist_ID",
      COALESCE(st.Name, 'Pending Authorisation') AS "Pathologist_Name",
      COALESCE(path.Qualification, '') AS "Qualification",
      COALESCE(path.License_No, '') AS "License_No",
      TO_CHAR(o.Order_Date, 'YYYY-MM-DD') AS "Order_Date"
    FROM Report r
    JOIN TestOrder o ON r.Order_ID = o.Order_ID
    JOIN Patient p ON o.Patient_ID = p.Patient_ID
    LEFT JOIN Doctor d ON o.Doctor_ID = d.Doctor_ID
    LEFT JOIN LabStaff st ON r.Pathologist_ID = st.Staff_ID
    LEFT JOIN Pathologist path ON r.Pathologist_ID = path.Staff_ID
    ${whereSql}
    ORDER BY r.Report_Date DESC NULLS LAST
    OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
  `;

  const [reports] = await pool.query(sql, [...params, offset, pageSize]);

  if (reports.length === 0) {
    return { data: [], total, page, pageSize };
  }

  // Fetch Findings (HasResult) for each report
  const enriched = await Promise.all(
    reports.map(async (r) => {
      const [results] = await pool.query(
        `SELECT 
          hr.Report_ID AS "Report_ID",
          hr.Test_ID AS "Test_ID",
          t.Test_Name AS "Test_Name",
          t.Category AS "Test_Category",
          hr.Observed_Value AS "Observed_Value",
          hr.Unit AS "Unit",
          hr.Remark AS "Remark"
         FROM HasResult hr
         JOIN Test t ON hr.Test_ID = t.Test_ID
         WHERE hr.Report_ID = ?`,
        [r.Report_ID]
      );

      return {
        ...r,
        Patient_Name: `${r.First_Name} ${r.Last_Name}`,
        Results: results || [],
      };
    })
  );

  return { data: enriched, total, page, pageSize };
}

/**
 * Fetch a single report by ID with all findings.
 */
async function getReportById(reportId) {
  const sql = `
    SELECT 
      r.Report_ID AS "Report_ID",
      r.Order_ID AS "Order_ID",
      TO_CHAR(r.Report_Date, 'YYYY-MM-DD"T"HH24:MI:SS') AS "Report_Date",
      o.Patient_ID AS "Patient_ID",
      p.First_Name AS "First_Name",
      p.Last_Name AS "Last_Name",
      TO_CHAR(p.DOB, 'YYYY-MM-DD') AS "DOB",
      p.Gender AS "Gender",
      o.Doctor_ID AS "Doctor_ID",
      d.Name AS "Doctor_Name",
      d.Specialization AS "Specialization",
      r.Pathologist_ID AS "Pathologist_ID",
      COALESCE(st.Name, 'Pending Authorisation') AS "Pathologist_Name",
      COALESCE(path.Qualification, '') AS "Qualification",
      COALESCE(path.License_No, '') AS "License_No",
      TO_CHAR(o.Order_Date, 'YYYY-MM-DD') AS "Order_Date"
    FROM Report r
    JOIN TestOrder o ON r.Order_ID = o.Order_ID
    JOIN Patient p ON o.Patient_ID = p.Patient_ID
    LEFT JOIN Doctor d ON o.Doctor_ID = d.Doctor_ID
    LEFT JOIN LabStaff st ON r.Pathologist_ID = st.Staff_ID
    LEFT JOIN Pathologist path ON r.Pathologist_ID = path.Staff_ID
    WHERE r.Report_ID = ?
  `;

  const [reports] = await pool.query(sql, [reportId]);
  if (reports.length > 0) {
    const report = reports[0];
    const [results] = await pool.query(
      `SELECT 
        hr.Report_ID AS "Report_ID",
        hr.Test_ID AS "Test_ID",
        t.Test_Name AS "Test_Name",
        t.Category AS "Test_Category",
        hr.Observed_Value AS "Observed_Value",
        hr.Unit AS "Unit",
        hr.Remark AS "Remark"
       FROM HasResult hr
       JOIN Test t ON hr.Test_ID = t.Test_ID
       WHERE hr.Report_ID = ?`,
      [reportId]
    );

    report.Patient_Name = `${report.First_Name} ${report.Last_Name}`;
    report.Results = results || [];
    return report;
  }

  // Fallback: If no record in Report table, check if this is a pending order
  let orderId = reportId;
  if (reportId.startsWith('R')) {
    orderId = 'O' + reportId.slice(1);
  }

  // Check if an existing report exists under this order ID
  const [existingReportRows] = await pool.query(
    'SELECT Report_ID AS "Report_ID" FROM Report WHERE Order_ID = ?',
    [orderId]
  );
  if (existingReportRows && existingReportRows.length > 0) {
    return getReportById(existingReportRows[0].Report_ID);
  }

  // Fetch draft order metadata for pending result entry
  const draftSql = `
    SELECT 
      ? AS "Report_ID",
      o.Order_ID AS "Order_ID",
      NULL AS "Report_Date",
      o.Patient_ID AS "Patient_ID",
      p.First_Name AS "First_Name",
      p.Last_Name AS "Last_Name",
      TO_CHAR(p.DOB, 'YYYY-MM-DD') AS "DOB",
      p.Gender AS "Gender",
      o.Doctor_ID AS "Doctor_ID",
      d.Name AS "Doctor_Name",
      d.Specialization AS "Specialization",
      (SELECT Staff_ID FROM Pathologist ORDER BY Staff_ID ASC FETCH FIRST 1 ROWS ONLY) AS "Pathologist_ID",
      (SELECT st.Name FROM LabStaff st JOIN Pathologist path ON st.Staff_ID = path.Staff_ID ORDER BY st.Staff_ID ASC FETCH FIRST 1 ROWS ONLY) AS "Pathologist_Name",
      (SELECT Qualification FROM Pathologist ORDER BY Staff_ID ASC FETCH FIRST 1 ROWS ONLY) AS "Qualification",
      (SELECT License_No FROM Pathologist ORDER BY Staff_ID ASC FETCH FIRST 1 ROWS ONLY) AS "License_No",
      TO_CHAR(o.Order_Date, 'YYYY-MM-DD') AS "Order_Date"
    FROM TestOrder o
    JOIN Patient p ON o.Patient_ID = p.Patient_ID
    LEFT JOIN Doctor d ON o.Doctor_ID = d.Doctor_ID
    WHERE o.Order_ID = ? OR o.Order_ID = ?
  `;

  const [drafts] = await pool.query(draftSql, [reportId, orderId, reportId]);
  if (drafts.length === 0) return null;

  const draft = drafts[0];
  draft.Patient_Name = `${draft.First_Name} ${draft.Last_Name}`;
  draft.Results = [];
  return draft;
}

/**
 * Fetch the pathologist's pending worklist:
 * Orders with collected samples that are currently Processing or Pending results.
 */
async function getPendingResults() {
  const sql = `
    SELECT 
      COALESCE(r.Report_ID, 'R' || SUBSTR(o.Order_ID, 2)) AS "Report_ID",
      o.Order_ID AS "Order_ID",
      TO_CHAR(o.Order_Date, 'YYYY-MM-DD') AS "Order_Date",
      o.Patient_ID AS "Patient_ID",
      (p.First_Name || ' ' || p.Last_Name) AS "Patient_Name",
      (SELECT COUNT(*) FROM OrderIncludesTest oit WHERE oit.Order_ID = o.Order_ID) AS "Test_Count",
      (SELECT COUNT(*) FROM Sample s WHERE s.Order_ID = o.Order_ID) AS "Sample_Count",
      (
        SELECT TO_CHAR(MAX(s.Collection_Date), 'YYYY-MM-DD"T"HH24:MI:SS')
        FROM Sample s WHERE s.Order_ID = o.Order_ID
      ) AS "Last_Collection_DateTime"
    FROM TestOrder o
    JOIN Patient p ON o.Patient_ID = p.Patient_ID
    LEFT JOIN Report r ON o.Order_ID = r.Order_ID
    WHERE (r.Report_Date IS NULL OR r.Report_ID IS NULL)
      AND o.Status = 'Processing'
      AND EXISTS (SELECT 1 FROM Sample s WHERE s.Order_ID = o.Order_ID)
    ORDER BY o.Order_Date ASC
  `;

  const [rows] = await pool.query(sql);
  return rows.map((r) => ({
    ...r,
    Test_Count: Number(r.Test_Count) || 0,
    Sample_Count: Number(r.Sample_Count) || 0,
  }));
}

/**
 * Authorize and issue a report:
 * 1. Inserts or updates HasResult rows with observed values, units, and remarks.
 * 2. Sets Report_Date = SYSDATE and stamps Pathologist_ID.
 * 3. Transitions related TestOrder status to 'Completed'.
 */
async function saveReportResults(reportId, data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Verify Report exists
    let [reportRows] = await conn.query(
      'SELECT Report_ID AS "Report_ID", Order_ID AS "Order_ID" FROM Report WHERE Report_ID = ?',
      [reportId]
    );

    // If report shell doesn't exist yet, look up by Order_ID or create it
    if (reportRows.length === 0) {
      let orderId = reportId;
      if (reportId.startsWith('R')) {
        orderId = 'O' + reportId.slice(1);
      }
      const [orderRows] = await conn.query('SELECT Order_ID AS "Order_ID" FROM TestOrder WHERE Order_ID = ?', [orderId]);
      if (orderRows.length > 0) {
        const repId = reportId.startsWith('R') ? reportId : ('R' + orderId.replace(/\D/g, '').padStart(4, '0'));
        const [existingPath] = await conn.query('SELECT Staff_ID AS "Staff_ID" FROM Pathologist ORDER BY Staff_ID ASC');
        const defaultPath = existingPath[0]?.Staff_ID || 'ST009';
        await conn.query(
          `INSERT INTO Report (Report_ID, Order_ID, Report_Date, Pathologist_ID) VALUES (?, ?, SYSDATE, ?)`,
          [repId, orderId, defaultPath]
        );
        reportRows = [{ Report_ID: repId, Order_ID: orderId }];
      } else {
        const error = new Error('Report not found');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }
    }

    const report = reportRows[0];
    const orderId = report.Order_ID;

    // 2. Validate pathologist
    let pathologistId = data.Pathologist_ID;
    if (!pathologistId) {
      const [paths] = await conn.query('SELECT Staff_ID AS "Staff_ID" FROM Pathologist ORDER BY Staff_ID ASC');
      pathologistId = paths[0]?.Staff_ID || 'ST009';
    }

    // 3. Upsert results into HasResult
    const results = Array.isArray(data.Results) ? data.Results : [];
    for (const res of results) {
      if (!res.Test_ID) continue;

      await conn.query('DELETE FROM HasResult WHERE Report_ID = ? AND Test_ID = ?', [
        report.Report_ID,
        res.Test_ID,
      ]);

      await conn.query(
        `INSERT INTO HasResult (Report_ID, Test_ID, Observed_Value, Unit, Remark)
         VALUES (?, ?, ?, ?, ?)`,
        [
          report.Report_ID,
          res.Test_ID,
          String(res.Observed_Value || '').trim().slice(0, 50),
          res.Unit ? String(res.Unit).trim().slice(0, 20) : null,
          res.Remark || 'Normal',
        ]
      );
    }

    // 4. Update Report with authorization timestamp
    await conn.query(
      `UPDATE Report SET Report_Date = SYSDATE, Pathologist_ID = ? WHERE Report_ID = ?`,
      [pathologistId, report.Report_ID]
    );

    // 5. Transition related order status to Completed
    await conn.query(
      `UPDATE TestOrder SET Status = 'Completed' WHERE Order_ID = ?`,
      [orderId]
    );

    await conn.commit();
    return getReportById(report.Report_ID);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = {
  getReports,
  getReportById,
  getPendingResults,
  saveReportResults,
};
