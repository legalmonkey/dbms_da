const { pool } = require('../config/db');

/**
 * Fetch lab-wide operational KPI counts powering the role workspaces.
 * Computes strictly from live database records in Oracle SQL*Plus.
 */
async function getWorkspaceSummary() {
  // 1. Patient count
  const [patientRows] = await pool.query('SELECT COUNT(*) AS "patientCount" FROM Patient');
  const patientCount = patientRows[0]?.patientCount || 0;

  // 2. Orders by status
  const [orderStatusRows] = await pool.query(
    'SELECT Status AS "Status", COUNT(*) AS "count" FROM TestOrder GROUP BY Status'
  );
  const ordersByStatus = { Pending: 0, Processing: 0, Completed: 0, Cancelled: 0 };
  for (const row of orderStatusRows) {
    if (ordersByStatus[row.Status] !== undefined) {
      ordersByStatus[row.Status] = Number(row.count);
    }
  }

  // 3. Orders in the last 7 days
  const [orders7Rows] = await pool.query(
    'SELECT COUNT(*) AS "ordersLast7Days" FROM TestOrder WHERE Order_Date >= SYSDATE - 7'
  );
  const ordersLast7Days = orders7Rows[0]?.ordersLast7Days || 0;

  // 4. Booked revenue (sum of test prices for non-cancelled orders)
  const [revRows] = await pool.query(
    `SELECT COALESCE(SUM(t.Price), 0) AS "revenueBooked"
     FROM OrderIncludesTest oit
     JOIN Test t ON oit.Test_ID = t.Test_ID
     JOIN TestOrder o ON oit.Order_ID = o.Order_ID
     WHERE o.Status != 'Cancelled'`
  );
  const revenueBooked = revRows[0]?.revenueBooked || 0;

  // 5. Samples by status
  const [sampleRows] = await pool.query('SELECT COUNT(*) AS "total" FROM Sample');
  const sampleCount = Number(sampleRows[0]?.total) || 0;
  const samplesByStatus = { Collected: sampleCount, 'In Transit': 0, Received: 0, Rejected: 0 };

  // 6. Samples in the last 7 days
  const [samples7Rows] = await pool.query(
    'SELECT COUNT(*) AS "samplesLast7Days" FROM Sample WHERE Collection_Date >= SYSDATE - 7'
  );
  const samplesLast7Days = samples7Rows[0]?.samplesLast7Days || 0;

  // 7. Pending results (orders with samples but report not yet completed)
  const [pendingRows] = await pool.query(
    `SELECT COUNT(*) AS "pendingResults"
     FROM TestOrder o
     WHERE o.Status = 'Processing'
        OR (EXISTS (SELECT 1 FROM Sample s WHERE s.Order_ID = o.Order_ID)
            AND NOT EXISTS (SELECT 1 FROM Report r WHERE r.Order_ID = o.Order_ID AND r.Report_Date IS NOT NULL))`
  );
  const pendingResults = pendingRows[0]?.pendingResults || 0;

  // 8. Reports issued
  const [reportRows] = await pool.query(
    'SELECT COUNT(*) AS "reportsIssued" FROM Report WHERE Report_Date IS NOT NULL'
  );
  const reportsIssued = reportRows[0]?.reportsIssued || 0;

  // 9. Findings by remark
  const [remarkRows] = await pool.query(
    'SELECT Remark AS "Remark", COUNT(*) AS "count" FROM HasResult GROUP BY Remark'
  );
  const findingsByRemark = { Normal: 0, Elevated: 0, Critical: 0 };
  for (const row of remarkRows) {
    if (findingsByRemark[row.Remark] !== undefined) {
      findingsByRemark[row.Remark] = Number(row.count);
    }
  }

  // 10. Catalogue, staff, and facility totals
  const [testCountRows] = await pool.query('SELECT COUNT(*) AS "testCount" FROM Test');
  const [staffCountRows] = await pool.query('SELECT COUNT(*) AS "staffCount" FROM LabStaff');
  const [labCountRows] = await pool.query('SELECT COUNT(*) AS "labCount" FROM Laboratory');

  return {
    Patient_Count: Number(patientCount) || 0,
    Orders_By_Status: ordersByStatus,
    Orders_Last_7_Days: Number(ordersLast7Days) || 0,
    Revenue_Booked: Number(revenueBooked) || 0,
    Samples_By_Status: samplesByStatus,
    Samples_Last_7_Days: Number(samplesLast7Days) || 0,
    Pending_Results: Number(pendingResults) || 0,
    Reports_Issued: Number(reportsIssued) || 0,
    Findings_By_Remark: findingsByRemark,
    Test_Count: Number(testCountRows[0]?.testCount) || 0,
    Staff_Count: Number(staffCountRows[0]?.staffCount) || 0,
    Laboratory_Count: Number(labCountRows[0]?.labCount) || 0,
  };
}

module.exports = {
  getWorkspaceSummary,
};
