# Meridian Diagnostics LIS/LIMS — Backend REST API Server

Production-ready Node.js & Express REST API server providing relational database integration for the Meridian Diagnostics Laboratory Information Management System (LIMS).

---

## 1. Requirements

- **Node.js**: `v18.0.0` or higher (Recommended: Node 20.x or 22.x LTS)
- **MySQL**: MySQL Server 8.0+ or MariaDB 10.5+
- **Package Manager**: `npm` (v9+)

---

## 2. Quickstart & Installation

### Step 1: Navigate to the backend directory
```bash
cd c:\dbms-diagnostic-lab-frontend\backend
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Configure environment variables
Copy the sample environment file and set your database connection parameters:
```bash
cp .env.example .env
```
Edit `.env` with your actual MySQL credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=meridian_diagnostics_db
PORT=8080
SYSTEM_NAME=Meridian Diagnostics LIS/LIMS
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Step 4: Import Database Schema and Seed Data
Using MySQL CLI or MySQL Workbench:
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE meridian_diagnostics_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema
mysql -u root -p meridian_diagnostics_db < sql/schema.sql

# Import initial seed data (Optional for testing)
mysql -u root -p meridian_diagnostics_db < sql/seed.sql
```

### Step 5: Start the backend server
```bash
# Production mode:
npm start

# Development mode (with live reload):
npm run dev
```

The server starts on port `8080`:
```
================================================================
  Meridian Diagnostics LIS/LIMS - Backend REST API Server
================================================================
  Status      : Online
  Port        : 8080
  Environment : development
  Health Check: http://localhost:8080/api/health
================================================================
  [DATABASE] Connected to MySQL successfully.
================================================================
```

---

## 3. Verifying Health Check

Test the database health-check endpoint using curl or your browser:
```bash
curl http://localhost:8080/api/health
```

**Success Response (HTTP 200):**
```json
{
  "success": true,
  "message": "Backend and database are connected",
  "system": "Meridian Diagnostics LIS/LIMS",
  "timestamp": "2026-09-17T14:15:00.000Z"
}
```

**Database Disconnected Response (HTTP 503):**
```json
{
  "success": false,
  "message": "Database connection failed",
  "system": "Meridian Diagnostics LIS/LIMS",
  "error": "connect ECONNREFUSED 127.0.0.1:3306",
  "timestamp": "2026-09-17T14:15:00.000Z"
}
```

---

## 4. Connecting the Frontend in Live Mode

The React frontend has a built-in architectural seam (`src/services/http.ts`) that switches between mock mode and the live backend with a single setting.

1. Open the frontend `.env` file in the root directory:
   `c:\dbms-diagnostic-lab-frontend\.env`
2. Change `VITE_API_MODE=mock` to `live`:
   ```env
   VITE_API_MODE=live
   VITE_API_BASE_URL=http://localhost:8080/api
   ```
3. Restart or reload the Vite development server (`npm run dev`).
4. Every page will now issue live HTTP requests directly against this Express/MySQL backend.

---

## 5. Testing APIs with Postman / Thunder Client

A Postman or Thunder Client collection can be configured with base URL `http://localhost:8080/api`:

### Key Requests:

| Action | Method | Path | Sample Body |
|---|---|---|---|
| **Health Check** | `GET` | `/api/health` | — |
| **Get Patients** | `GET` | `/api/patients?page=1&pageSize=10` | — |
| **Register Patient** | `POST` | `/api/patients` | `{"First_Name": "Rohan", "Last_Name": "Iyer", "DOB": "1994-06-15", "Gender": "M", "Contacts": [{"Contact_No": "9845012345"}]}` |
| **Get Tests** | `GET` | `/api/tests?category=Pathology` | — |
| **Book Order** | `POST` | `/api/orders` | `{"Patient_ID": "P0001", "Doctor_ID": "D001", "Test_IDs": ["T001", "T002"]}` |
| **Sample Intake** | `POST` | `/api/samples` | `{"Order_ID": "ORD-0001", "Sample_Type": "Whole Blood", "Lab_ID": "LAB01", "Tech_ID": "ST001"}` |
| **Pending Queue** | `GET` | `/api/pending-results` | — |
| **Authorize Report** | `PUT` | `/api/reports/R0001/results` | `{"Results": [{"Test_ID": "T001", "Observed_Value": "14.2", "Unit": "g/dL", "Remark": "Normal"}]}` |
| **Analytics Summary**| `GET` | `/api/analytics/summary` | — |

---

## 6. Comprehensive Integration Test Checklist

- [ ] **Database Connection**: `/api/health` returns `200 OK` with `"connected": true`.
- [ ] **Patient Creation**: `POST /api/patients` creates patient and auto-generates ID.
- [ ] **Multiple Contacts**: `Patient_Contact` stores 2+ phone numbers for one patient.
- [ ] **Doctor Retrieval**: `GET /api/doctors` returns referring doctors list.
- [ ] **Test Retrieval**: `GET /api/tests` includes `Specimen_Type` or `Imaging_Modality`.
- [ ] **Order Creation**: `POST /api/orders` links multiple tests in `OrderIncludesTest`.
- [ ] **Server-Side Pricing**: Total price is computed strictly from database `Test.Price`.
- [ ] **Sample Accessioning**: `POST /api/samples` auto-assigns `S1`, `S2` and transitions order status to `Processing`.
- [ ] **Result Authorization**: `PUT /api/reports/:id/results` stamps date, pathologist ID, and marks order `Completed`.
- [ ] **Analytics Summary**: `GET /api/analytics/summary` computes live metrics matching records.
- [ ] **Invalid Foreign Keys**: Inserting sample with non-existent `Order_ID` returns `400 VALIDATION_FAILED`.
- [ ] **Duplicate Record Safety**: Duplicate phone/compound keys handled cleanly.
- [ ] **Delete Conflict Handling**: Deleting patient with active orders returns `409 CONFLICT`.
- [ ] **Transaction Rollback**: Failures during multi-table inserts leave database clean.

---

## 7. Common Errors and Solutions

| Symptom | Cause | Solution |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:3306` | MySQL server is stopped or port is wrong | Verify MySQL service is running (`systemctl status mysql` or Windows Services). Verify `DB_PORT` in `.env`. |
| `ER_ACCESS_DENIED_ERROR` | Incorrect `DB_USER` or `DB_PASSWORD` | Verify database username and password in `.env`. Test with command line `mysql -u <user> -p`. |
| `ER_BAD_DB_ERROR` | Database does not exist | Run `CREATE DATABASE meridian_diagnostics_db;` and import `sql/schema.sql`. |
| `CORS Error in Browser` | Frontend port mismatch | Update `CORS_ORIGIN` in `.env` to match frontend URL (default `http://localhost:5173`). |
| `409 CONFLICT on Delete` | Referential integrity constraint triggered | Expected clinical behavior: Patients with orders, tests on orders, or staff on reports cannot be deleted. |

