# Production Deployment Guide: Oracle Cloud (OCI) & Web Hosting

This guide provides instructions to deploy the Meridian Diagnostics LIS application to production using **Oracle Cloud Infrastructure (OCI) Always Free Tier** for the database, paired with free cloud platforms for backend and frontend.

---

## Architecture Overview

```
+------------------------------------+
| Frontend: React 19 + Vite          |
| Host: Vercel / Netlify             |
| URL: https://meridian-lis.vercel.app|
+-----------------+------------------+
                  |
                  | HTTPS REST API Calls
                  v
+------------------------------------+
| Backend: Node.js Express           |
| Host: Render / Railway / OCI VM    |
| Port: 8080                         |
| URL: https://meridian-api.onrender.com
+-----------------+------------------+
                  |
                  | Oracle SQL Net / TCPS (TLS)
                  v
+------------------------------------+
| Database: Oracle Autonomous DB     |
| Service: OCI Always Free ATP/ADW   |
| Engine: Oracle Database 23ai / 19c |
| Schema: backend/sql/schema.sql     |
+------------------------------------+
```

---

## Phase 1: Deploying the Oracle Database on OCI Always Free

Oracle Cloud Infrastructure (OCI) provides two Always Free Autonomous Databases with 20 GB of storage each.

### Step 1.1: Create an OCI Account
1. Visit [cloud.oracle.com](https://cloud.oracle.com) and sign up for the **Oracle Cloud Free Tier**.
2. Select your Home Region (choose a region close to your users).
3. Once logged in, navigate to the OCI Console.

### Step 1.2: Provision Autonomous Transaction Processing (ATP)
1. In the OCI Console menu, open **Oracle Database** -> **Autonomous Database**.
2. Click **Create Autonomous Database**.
3. Configure the database details:
   - **Display Name**: `meridian-db`
   - **Database Name**: `meridiandb`
   - **Workload Type**: Select **Transaction Processing**.
   - **Deployment Type**: Shared Infrastructure.
   - **Always Free**: Toggle **Show only Always Free configuration** to **ON**.
   - **Database Version**: Oracle Database 23ai or 19c.
   - **Admin Password**: Choose a strong password (for example: `Meridian#2026LabDB`) and record it securely.
   - **Network Access**: Select **Secure access from everywhere** (or restrict to your application IP).
   - **Mutual TLS (mTLS) Authentication**:
     - *Recommended for simple connection*: **Uncheck** "Require mutual TLS (mTLS) authentication". This allows direct TLS connection via connection string without downloading client wallet files.
     - If mTLS is left enabled, download the Client Wallet zip as described in Step 1.4.
4. Click **Create Autonomous Database**. Provisioning typically completes in 2 to 3 minutes.

### Step 1.3: Run Schema and Seed Scripts in the Browser
You do not need to install local Oracle tools. OCI includes a web-based SQL worksheet:
1. In your Autonomous Database details page, click **Database Actions** -> **SQL**.
2. Log in as user `ADMIN` using the password created in Step 1.2.
3. Open `backend/sql/schema.sql` from your project repository:
   - Copy the entire SQL content.
   - Paste it into the SQL Worksheet.
   - Click **Run Script (F5)**. All tables, constraints, and foreign keys will be created.
4. Open `backend/sql/seed.sql` from your project repository:
   - Copy the seed data SQL content.
   - Paste it into the SQL Worksheet.
   - Click **Run Script (F5)** to insert the baseline diagnostic lab records.

### Step 1.4: Obtain Connection Details
1. In your Autonomous Database details page, click **Database Connection**.
2. If using **TLS (Without Wallet)**:
   - Under **Connection Strings**, locate the service named `meridiandb_low` (or `meridiandb_tp`).
   - Copy the TNS Connection String descriptor.
3. If using **mTLS (With Wallet)**:
   - Click **Download Wallet**.
   - Set a wallet password and download `Wallet_meridiandb.zip`.
   - Extract the zip files into a folder (e.g. `backend/wallet/`).

---

## Phase 2: Deploying the Backend (Node.js + Express)

You can deploy the backend using Render, Railway, or an OCI Compute VM. Render is recommended for fast automated deploys.

### Option A: Deploy to Render.com (Recommended)
1. Push your repository to GitHub.
2. Log in to [render.com](https://render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the service settings:
   - **Name**: `meridian-diagnostics-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. In the **Environment Variables** section, add:
   - `PORT`: `8080`
   - `NODE_ENV`: `production`
   - `SYSTEM_NAME`: `Meridian Diagnostics LIS/LIMS`
   - `CORS_ORIGIN`: `https://<your-frontend>.vercel.app` (or `*` during initial setup)
   - `DB_USER`: `ADMIN`
   - `DB_PASSWORD`: `<your-oci-admin-password>`
   - `DB_CONNECT_STRING`: `<your-oci-connection-string-from-step-1.4>`
6. Click **Deploy Web Service**.
7. Test the health endpoint in your browser:
   `https://meridian-diagnostics-api.onrender.com/api/health`
   The response should return:
   ```json
   {
     "success": true,
     "message": "Backend and database are connected",
     "system": "Meridian Diagnostics LIS/LIMS"
   }
   ```

### Option B: Deploy Backend with Docker (OCI Compute / DigitalOcean / AWS)
The repository includes a production multi-stage `backend/Dockerfile`.
To build and run anywhere:
```bash
docker build -t meridian-backend ./backend
docker run -d \
  -p 8080:8080 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e CORS_ORIGIN="*" \
  -e DB_USER="ADMIN" \
  -e DB_PASSWORD="YourPassword" \
  -e DB_CONNECT_STRING="YourConnectString" \
  --name meridian-api \
  meridian-backend
```

---

## Phase 3: Deploying the Frontend (React 19 + Vite)

Deploy the single-page application to Vercel or Netlify.

### Step 3.1: Deploy to Vercel
1. Log in to [vercel.com](https://vercel.com) and click **Add New** -> **Project**.
2. Import your GitHub repository.
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (project root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_API_MODE`: `live`
   - `VITE_API_BASE_URL`: `https://meridian-diagnostics-api.onrender.com/api`
5. Click **Deploy**.
6. The `vercel.json` file in the root automatically routes all URL paths (`/patient`, `/technician`, `/reports`) to `/index.html`.

### Step 3.2: Update Backend CORS
Once your frontend is assigned a live URL (e.g. `https://meridian-lis.vercel.app`), update the backend environment variable:
- `CORS_ORIGIN`: `https://meridian-lis.vercel.app`

---

## Verification Checklist

1. **Database Health**: Visit `https://<backend-url>/api/health` and verify HTTP 200 with database connection success.
2. **Patient Records**: Open `https://<backend-url>/api/patients` to verify Oracle SQL records are returned.
3. **Frontend Live Integration**: Open the Vercel app, sign in as Patient or Lab Staff, and verify live test orders and reports populate from the cloud Oracle database.
