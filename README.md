# Meridian Diagnostics — Clinical Laboratory Information System (LIS/LIMS)

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/Database-Oracle_XE_/_21c-F80000?style=flat-square&logo=oracle&logoColor=white)](https://www.oracle.com/database/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

> **One-Liner:** A full-stack clinical Laboratory Information Management System (LIS/LIMS) featuring dynamic test-specific parameter entry, specimen chain-of-custody tracking, multi-profile clinical authorization, and NABL-accredited diagnostic report generation backed by an enterprise Oracle relational database engine.

---

## Overview

Meridian Diagnostics LIS is designed to digitize end-to-end diagnostic clinical workflows across pathology laboratories and radiology imaging centers. Built with strict adherence to clinical data governance and transactional integrity, the system coordinates patients, referring physicians, phlebotomists, medical laboratory technicians, and consultant pathologists.

### Core Architectural Modules

1. **Patient Registration & Self-Service Portal**: Instant patient sign-up and sign-in, real-time diagnostic test catalogue exploration with transparent pricing, and online test order placement.
2. **Order Management & Clinical Referrals**: Tracks orders across `Pending`, `Processing`, `Completed`, and `Cancelled` states, linking tests to registered referring physicians.
3. **Phlebotomy & Sample Intake**: Multi-specimen chain of custody logging (`Blood`, `Serum`, `Urine`, `Swab`) with automated accession sequencing (`S1`, `S2`, ...), technician stamping, and laboratory destination assignment.
4. **Dynamic Result Entry Workspace**: Diagnostic parameters adapt dynamically per test:
   - **Quantitative Pathology**: Pre-filled biological units (`g/dL`, `mg/dL`, `10^3/µL`, `µIU/mL`), real-time reference range evaluations (`Normal`, `Elevated`, `Critical`), and rapid-entry clinical chips.
   - **Qualitative Pathology**: Microbial and urinalysis observation templates with locked unit constraints.
   - **Radiology**: Modality-specific impression textareas (`X-Ray`, `MRI`, `CT Scan`, `Ultrasound`) with character budget telemetry.
5. **Clinical Report Issuance & Verification**: Consultant pathologist authorization timestamping (`SYSDATE`), finding persistence in `HasResult`, and print-ready A4 medical reports with NABL compliance metadata.
6. **Laboratory & Staff Administration**: Comprehensive directory for managing laboratory branches, technicians (with shifts and certifications), and pathologists (with qualifications and medical council licenses).

---

## Relational Database Schema (Oracle SQL)

The backend runs on Oracle Database, structured with strict referential integrity, check constraints, foreign keys with cascade rules, and ISA specialization hierarchies.

```
                          +-------------------+
                          |      Patient      |
                          +-------------------+
                                    | 1
                                    | N
                          +-------------------+
                          |  Patient_Contact  |
                          +-------------------+

+------------+             +-------------------+             +------------+
|   Doctor   | 1 ------- N |     TestOrder     | N ------- 1 | Laboratory |
+------------+             +-------------------+             +------------+
                                 |         |
                          1 to N |         | 1 to N
                                 |         +-------------------+
                                 v                             v
                    +--------------------+             +----------------+
                    | OrderIncludesTest  |             |     Sample     |
                    +--------------------+             +----------------+
                             | N                               | N
                             | 1                               | 1
                    +--------------------+             +----------------+
                    |        Test        |             | LabTechnician  |
                    +--------------------+             +----------------+
                             ^                                 ^
                    +--------+--------+                        | (ISA)
                    |                 |                        |
            +---------------+ +---------------+        +----------------+
            | PathologyTest | | RadiologyTest |        |    LabStaff    |
            +---------------+ +---------------+        +----------------+
                                                               ^
                                                               | (ISA)
+-------------+            +--------------------+      +----------------+
|  HasResult  | N ------ 1 |       Report       | N - 1|  Pathologist   |
+-------------+            +--------------------+      +----------------+
```

### Table Definitions Summary

| Table | Primary Key | Description |
|---|---|---|
| `Doctor` | `Doctor_ID` | Referring doctors with clinical specializations |
| `Laboratory` | `Lab_ID` | Accredited physical processing labs and collection centres |
| `LabStaff` | `Staff_ID` | Base entity for laboratory workforce with work shifts |
| `LabTechnician` | `Staff_ID` (FK) | Specialization: certification and phlebotomy credentials |
| `Pathologist` | `Staff_ID` (FK) | Specialization: medical council license number and qualifications |
| `Patient` | `Patient_ID` | Patient demographic profiles (DOB, Gender) |
| `Patient_Contact` | `(Patient_ID, Contact_No)` | Multi-valued contact numbers per patient |
| `Test` | `Test_ID` | Master diagnostic test catalogue and pricing |
| `PathologyTest` | `Test_ID` (FK) | Specialization: biological specimen requirements |
| `RadiologyTest` | `Test_ID` (FK) | Specialization: imaging modalities (X-Ray, MRI, CT, Ultrasound) |
| `TestOrder` | `Order_ID` | Clinical orders tied to patient, doctor, and date |
| `OrderIncludesTest` | `(Order_ID, Test_ID)` | Line items associating diagnostic tests with orders |
| `Sample` | `(Order_ID, Sample_No)` | Physical biological samples collected for an order |
| `Report` | `Report_ID` | Diagnostic report stamped by pathologist upon verification |
| `HasResult` | `(Report_ID, Test_ID)` | Observed parameters, units, and clinical remarks |

---

## Tech Stack

### Frontend
- **Framework**: React 19 with Vite 8
- **Language**: TypeScript 5.x (strict type-checking)
- **Styling**: Tailwind CSS v4 (Obsidian & Arterial Crimson clinical palette)
- **State & Data Fetching**: TanStack React Query v5
- **Routing**: React Router DOM v7
- **UI Primitives**: Radix UI, Lucide Icons
- **Animation**: Custom WebGL / Canvas AeroShards background engine

### Backend & Database
- **Runtime**: Node.js 20+
- **Framework**: Express 4.21
- **Database**: Oracle Database (XE, 19c, 21c) via `oracledb` connection pool
- **Data Validation**: Express Validator & Zod schemas
- **Architecture**: Service-Repository pattern with transactional commit/rollback

---

## Project Structure

```
.
├── backend/
│   ├── sql/
│   │   ├── schema.sql           # Oracle DDL: Tables, constraints, foreign keys
│   │   └── seed.sql             # Deterministic seed data (Staff, Patients, Tests)
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js            # Oracle connection pool & query abstraction
│   │   │   └── dbMapping.js     # Centralized table and column mapping
│   │   ├── controllers/         # REST API route controllers
│   │   ├── middleware/          # Request validation and error handling
│   │   ├── routes/              # Express route declarations
│   │   ├── services/            # Transactional business logic & Oracle SQL
│   │   ├── utils/               # ID generation and pagination helpers
│   │   └── server.js            # Express server initialization
│   └── package.json
├── src/
│   ├── app/                     # Router, AuthProvider, role guards, navigation
│   ├── components/
│   │   ├── data/                # Tables, empty states, pagination, query states
│   │   ├── domain/              # Clinical indicators, status badges, report letterhead
│   │   ├── landing/             # Hero, AeroShards WebGL engine, Login modal
│   │   ├── layout/              # App shell, sidebar, topbar, brand header
│   │   ├── ui/                  # Accessible UI primitives (Radix)
│   │   └── workspace/           # Metric tiles, charts, and breakdown bars
│   ├── hooks/                   # Custom React hooks (useAuth, usePatientScope)
│   ├── lib/                     # Clinical test parameters registry, formatters
│   ├── pages/                   # Application route views & workspaces
│   ├── services/                # HTTP client seams to REST API
│   └── types/                   # Domain TypeScript models and Zod schemas
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- Oracle Database (Local Oracle XE, Oracle Cloud ATP, or Docker container)

### 1. Database Setup
Execute the schema and seed scripts in Oracle SQL*Plus or SQL Developer:

```sql
-- Connect as your target lab schema user
@backend/sql/schema.sql
@backend/sql/seed.sql
```

### 2. Backend Configuration & Launch
Create `backend/.env` (or configure environment variables):

```env
PORT=8080
CORS_ORIGIN=http://localhost:5173
DB_USER=c##lab_user
DB_PASSWORD=your_password
DB_CONNECT_STRING=localhost:1521/XEPDB1
```

Install dependencies and start the backend service:

```bash
cd backend
npm install
npm start
```

*The REST API will be available at `http://localhost:8080/api`.*

### 3. Frontend Configuration & Launch
From the project root:

```bash
npm install
npm run dev
```

*The frontend application will launch at `http://localhost:5173`.*

---

## Production Build & Verification

To verify full-stack code health, TypeScript validation, and asset bundling:

```bash
# Frontend production build
npm run build

# Preview build locally
npm run preview

# Backend health check
cd backend
npm test
```

---

## REST API Contract Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/patients` | Paginated patient register with order counts and search |
| `POST` | `/api/patients` | Register a new patient and contact numbers |
| `GET` | `/api/patients/:id` | Fetch patient profile and associated contact details |
| `GET` | `/api/tests` | Diagnostic catalogue with Pathology and Radiology subtypes |
| `GET` | `/api/orders` | Clinical test orders with status filtering |
| `POST` | `/api/orders` | Create an order with multiple test line items |
| `GET` | `/api/orders/:id` | Order details, patient info, and joined subtype tests |
| `GET` | `/api/samples` | Logged biological samples with accession details |
| `POST` | `/api/samples` | Log sample collection, accession number, and assign lab |
| `GET` | `/api/reports` | Authorized diagnostic reports with observed values |
| `GET` | `/api/reports/pending-results` | Orders awaiting pathologist result entry |
| `GET` | `/api/reports/:id` | Full diagnostic report with clinical findings |
| `PUT` | `/api/reports/:id/results` | Stamp observed values, verify findings, and complete order |
| `GET` | `/api/staff` | Staff directory filtered by Technician or Pathologist role |
| `GET` | `/api/laboratories` | Physical laboratory facilities and contact numbers |
| `GET` | `/api/analytics/summary` | Workspace metrics, volume breakdowns, and turnarounds |

---

## Cloud Deployment

For step-by-step instructions on deploying the full-stack system online using **Oracle Cloud Infrastructure (OCI) Always Free Autonomous Database (ATP)**, Node.js on Render/Railway, and React on Vercel, refer to the [Production Deployment Guide](DEPLOYMENT_GUIDE.md).

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
