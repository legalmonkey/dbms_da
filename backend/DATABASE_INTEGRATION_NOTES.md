# Database Integration Notes — Meridian Diagnostics LIS/LIMS

**Attention: Database Administrator / Database Teammate**

This document details the configuration parameters, table relationships, and field alignments required to connect your MySQL database to the Meridian Diagnostics REST API backend.

---

## 1. Credentials and Connection Parameters to Replace

The backend code contains **zero hardcoded credentials**. All parameters are read strictly from environment variables.

Copy `backend/.env.example` to `backend/.env` and replace the following placeholder values:

| Environment Variable | Placeholder in `.env.example` | Description |
|---|---|---|
| `DB_HOST` | `localhost` | Hostname or IP address of the MySQL server (e.g. `127.0.0.1` or AWS RDS endpoint) |
| `DB_PORT` | `3306` | Port on which MySQL is listening |
| `DB_USER` | `YOUR_DATABASE_USER` | MySQL database user (e.g. `admin` or `root`) |
| `DB_PASSWORD` | `YOUR_DATABASE_PASSWORD` | MySQL password for the specified user |
| `DB_NAME` | `YOUR_DATABASE_NAME` | Target database schema name (e.g. `meridian_diagnostics_db`) |
| `SYSTEM_NAME` | `YOUR_SYSTEM_NAME` | Name displayed in health-check responses (e.g. `Meridian Diagnostics LIS/LIMS`) |
| `PORT` | `8080` | Port for this Express API server |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed origin for frontend SPA requests |

---

## 2. Table Name Mapping & Customization

The backend defines table names in a centralized configuration file:
**[`backend/src/config/dbMapping.js`](src/config/dbMapping.js)**

If your final database uses different table names (e.g., lower snake_case `patient_contacts` or `test_orders`), update the mapping object in that file:

```javascript
// backend/src/config/dbMapping.js
module.exports = {
  tables: {
    patient: 'Patient',                    // e.g. change to 'patients'
    patientContact: 'Patient_Contact',     // e.g. change to 'patient_contacts'
    doctor: 'Doctor',                      // e.g. change to 'doctors'
    test: 'Test',                          // e.g. change to 'tests'
    pathologyTest: 'PathologyTest',
    radiologyTest: 'RadiologyTest',
    testOrder: 'TestOrder',
    orderIncludesTest: 'OrderIncludesTest',
    laboratory: 'Laboratory',
    labStaff: 'LabStaff',
    labTechnician: 'LabTechnician',
    pathologist: 'Pathologist',
    sample: 'Sample',
    report: 'Report',
    hasResult: 'HasResult',
  }
};
```

---

## 3. Detailed Entity Column Alignment

Below is the column mapping implemented across SQL tables and frontend TypeScript models:

### 1. `Patient` & `Patient_Contact`
* **Table:** `Patient`
  * `Patient_ID` (VARCHAR(20), PK) — e.g. `P0001`
  * `First_Name` (VARCHAR(60), NOT NULL)
  * `Last_Name` (VARCHAR(60), NOT NULL)
  * `DOB` (DATE, NOT NULL) — Formatted as `YYYY-MM-DD`
  * `Gender` (ENUM('M', 'F', 'O'), NOT NULL)
* **Table:** `Patient_Contact`
  * `Patient_ID` (VARCHAR(20), FK to `Patient(Patient_ID)`)
  * `Contact_No` (VARCHAR(20), NOT NULL) — 10-digit Indian mobile number
  * Composite PK: `(Patient_ID, Contact_No)`

### 2. `Doctor`
* **Table:** `Doctor`
  * `Doctor_ID` (VARCHAR(20), PK) — e.g. `D001`
  * `Doctor_Name` (VARCHAR(100), NOT NULL)
  * `Specialization` (VARCHAR(100), NOT NULL)

### 3. `Test`, `PathologyTest`, and `RadiologyTest`
* **Table:** `Test`
  * `Test_ID` (VARCHAR(20), PK) — e.g. `T001`
  * `Test_Name` (VARCHAR(100), NOT NULL)
  * `Test_Category` (ENUM('Pathology', 'Radiology'), NOT NULL)
  * `Price` (INT UNSIGNED, NOT NULL) — Whole Indian Rupees (INR)
  * `Unit` (VARCHAR(20), NULL) — Optional canonical unit e.g. `mg/dL`
* **Table:** `PathologyTest` (Specialization)
  * `Test_ID` (VARCHAR(20), PK & FK to `Test(Test_ID)`)
  * `Specimen_Type` (ENUM('Blood', 'Serum', 'Urine', 'Tissue', 'Stool', 'Swab'))
* **Table:** `RadiologyTest` (Specialization)
  * `Test_ID` (VARCHAR(20), PK & FK to `Test(Test_ID)`)
  * `Imaging_Modality` (ENUM('X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Mammography'))

### 4. `Laboratory`
* **Table:** `Laboratory`
  * `Lab_ID` (VARCHAR(20), PK) — e.g. `LAB01`
  * `Lab_Name` (VARCHAR(100), NOT NULL)
  * `Location` (VARCHAR(100), NOT NULL)
  * `Contact_No` (VARCHAR(20), NOT NULL)

### 5. `LabStaff`, `LabTechnician`, and `Pathologist` (ISA Hierarchy)
* **Table:** `LabStaff` (Base)
  * `Staff_ID` (VARCHAR(20), PK) — e.g. `ST001`
  * `Staff_Name` (VARCHAR(100), NOT NULL)
  * `Shift` (ENUM('Morning', 'Evening', 'Night', 'General'), NOT NULL)
  * `Staff_Role` (ENUM('Technician', 'Pathologist'), NOT NULL)
* **Table:** `LabTechnician` (Subtype)
  * `Tech_ID` (VARCHAR(20), PK & FK to `LabStaff(Staff_ID)`)
  * `Certification` (VARCHAR(100), NOT NULL) — e.g. `DMLT`, `BSc MLT`
* **Table:** `Pathologist` (Subtype)
  * `Pathologist_ID` (VARCHAR(20), PK & FK to `LabStaff(Staff_ID)`)
  * `License_No` (VARCHAR(50), NOT NULL) — Medical council license
  * `Qualification` (VARCHAR(100), NOT NULL) — e.g. `MD Pathology`

### 6. `TestOrder` & `OrderIncludesTest`
* **Table:** `TestOrder`
  * `Order_ID` (VARCHAR(20), PK) — e.g. `ORD-0001`
  * `Order_Date` (DATE, NOT NULL)
  * `Patient_ID` (VARCHAR(20), FK to `Patient(Patient_ID)`)
  * `Doctor_ID` (VARCHAR(20), NULL, FK to `Doctor(Doctor_ID)`)
  * `Status` (ENUM('Pending', 'Processing', 'Completed', 'Cancelled'), NOT NULL)
  * `Total_Price` (INT UNSIGNED, NOT NULL) — Computed server-side from `Test.Price`
* **Table:** `OrderIncludesTest` (Junction Table)
  * `Order_ID` (VARCHAR(20), FK to `TestOrder(Order_ID)`)
  * `Test_ID` (VARCHAR(20), FK to `Test(Test_ID)`)
  * Composite PK: `(Order_ID, Test_ID)`

### 7. `Sample`
* **Table:** `Sample`
  * `Order_ID` (VARCHAR(20), FK to `TestOrder(Order_ID)`)
  * `Sample_No` (VARCHAR(20), NOT NULL) — Sequential per order (`S1`, `S2`...)
  * `Patient_ID` (VARCHAR(20), FK to `Patient(Patient_ID)`)
  * `Sample_Type` (ENUM('Whole Blood', 'Serum', 'Plasma', 'Urine', 'Stool', 'Tissue', 'Swab'))
  * `Collection_DateTime` (DATETIME, NOT NULL)
  * `Lab_ID` (VARCHAR(20), FK to `Laboratory(Lab_ID)`)
  * `Tech_ID` (VARCHAR(20), FK to `LabStaff(Staff_ID)`)
  * `Status` (ENUM('Collected', 'In Transit', 'Received', 'Rejected'), NOT NULL)
  * Composite PK: `(Order_ID, Sample_No)`

### 8. `Report` & `HasResult`
* **Table:** `Report`
  * `Report_ID` (VARCHAR(20), PK) — e.g. `R0001`
  * `Order_ID` (VARCHAR(20), FK to `TestOrder(Order_ID)`)
  * `Report_Date` (DATETIME, NULL) — NULL while in draft, stamped upon authorization
  * `Patient_ID` (VARCHAR(20), FK to `Patient(Patient_ID)`)
  * `Doctor_ID` (VARCHAR(20), NULL, FK to `Doctor(Doctor_ID)`)
  * `Pathologist_ID` (VARCHAR(20), NULL, FK to `LabStaff(Staff_ID)`)
* **Table:** `HasResult`
  * `Report_ID` (VARCHAR(20), FK to `Report(Report_ID)`)
  * `Test_ID` (VARCHAR(20), FK to `Test(Test_ID)`)
  * `Observed_Value` (VARCHAR(50), NOT NULL) — Preserves boundary strings e.g. `<0.01`
  * `Unit` (VARCHAR(20), NULL)
  * `Remark` (ENUM('Normal', 'Elevated', 'Critical'), NOT NULL)
  * Composite PK: `(Report_ID, Test_ID)`

---

## 4. Provided SQL Files

The backend repository includes ready-to-run reference SQL files:

1. **Schema DDL:** [`backend/sql/schema.sql`](sql/schema.sql)
   * Contains all 15 tables with complete foreign keys, composite primary keys, check constraints, and performance indexes.
2. **Seed Data:** [`backend/sql/seed.sql`](sql/seed.sql)
   * Populates test patients, doctors, tests, facilities, staff members, sample orders, and findings for immediate verification.

---

## 5. Important Backend Business Rules Enforced

1. **Server-Side Price Calculation:**
   * When an order is placed (`POST /api/orders`), the backend looks up each `Test_ID` in the `Test` table and calculates `Total_Price`. Any price sent from the frontend is discarded.
2. **Sequential Sample Numbers:**
   * Samples within an order receive sequential IDs (`S1`, `S2`, `S3`).
3. **Automatic Order State Transitions:**
   * When the first sample for an order is created, `TestOrder.Status` transitions from `'Pending'` to `'Processing'`.
   * When a pathologist authorizes report findings via `PUT /api/reports/:id/results`, `TestOrder.Status` transitions to `'Completed'`.
4. **Delete Safety (HTTP 409):**
   * Patients with orders cannot be deleted.
   * Tests appearing on existing orders cannot be deleted.
   * Laboratories with assigned samples cannot be deleted.
   * Staff members who have collected samples or authorized reports cannot be deleted.

