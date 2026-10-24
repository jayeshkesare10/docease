# DOCEASE — A Complete Documentation Guidance Platform

DOCEASE is a full-stack, responsive web application designed to help ordinary Indian citizens (students, parents, working professionals, job seekers, and senior citizens) navigate documentation requirements, understand officially accepted alternative proofs, follow step-by-step procedures, and book appointments at verified facilitation centers.

---

## 🌐 Localhost Links

- **Frontend Application (Vite + React)**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server (Express + Node.js)**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## ⚡ How to Run Anytime (One-Click)

### Option 1: Desktop Shortcut or Batch File (Easiest)
- Double-click **`DOCEASE.lnk`** directly on your Windows Desktop, OR
- Open this folder and double-click **`START_DOCEASE.bat`**.
- It automatically launches both the backend and frontend concurrently and opens [http://localhost:5173](http://localhost:5173) in your default browser!
- To cleanly stop the app anytime, double-click **`STOP_DOCEASE.bat`** or press `Ctrl + C` in the console window.

### Option 2: Terminal / Command Prompt
In the project root folder (`Documentation app`), run:
```bash
npm start
```
This runs both the API server (port 5000) and the React frontend (port 5173) in parallel.


---

## 🔑 Default Administrator Credentials

For accessing the **Admin CMS** and **Official Desk Approvals**:
- **Email**: `admin@docease.gov.in`
- **Password**: `Admin@DocEase2026!`

*(New citizens can register directly from the UI with real OTP verification).*

---

## 🚀 Key Implemented Workflows

1. **Document Guidance Engine**:
   - Comprehensive guides for **Indian Passport**, **Aadhaar Card**, **PAN Card**, **Income Certificate**, **Caste Validity**, **Driving Licence (Parivahan)**, **Domicile Certificate**, and **College & University Admissions**.
   - Mandatory, Conditional, and Optional requirement badges.
   - Expandable **Accepted Alternative Documents** under official gazette rules.
   - **How to Obtain Missing Documents** popup with location, required proofs, statutory fees, and verified timelines.

2. **Multi-Language Support (Localization)**:
   - Instant dynamic switching between **English**, **हिंदी (Hindi)**, and **मराठी (Marathi)** across all navigation, forms, guidance, and status alerts.

3. **Personalized Citizen Checklists**:
   - Mark documents as *Available*, *Missing*, or *Not Applicable*.
   - Live readiness progress tracker.
   - Clear distinction between citizen self-reported status and official government verification.

4. **Appointment Booking & Holiday Verification**:
   - Double-booking prevention and concurrency control.
   - Automatic blocking of weekend dates (Saturdays & Sundays) and gazetted national/state holidays.
   - Real-time time slot availability calculation.

5. **Cryptographic QR Code Pass & Official Verification**:
   - Opaque verification token generation (`vtoken_...`) that avoids exposing sensitive PII in plain text.
   - High-resolution QR pass generation and print capability.
   - Official QR Verification Desk for authorized officers to inspect citizen checklist readiness, log outcomes, and generate audit trails.

6. **Encrypted Private Document Vault**:
   - Cloud object storage outside public web root.
   - File type validation (PDF, JPG, PNG) and size limitation (up to 10MB).
   - Secure authenticated stream download and inline preview.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, QRCode React.
- **Backend**: Node.js v24, Express, TypeScript, Multer, JSON Web Tokens.
- **Database**: SQLite with `node:sqlite` (`DatabaseSync`), WAL mode, persistent storage (`data/docease.db`).
- **Security**: Cryptographic password hashing (`scryptSync` + 16-byte random salt), timing-safe comparisons, role-based access control (RBAC), and brute-force rate limiters.

---

## 🌐 Production Deployment

### Option 1: Full-Stack Deployment (Render / Railway / Cloud VMs)
1. Push this repository to your GitHub account (`git push origin main`).
2. Connect your repository on [Render](https://render.com) (or Railway / Fly.io).
3. If using **Render**:
   - Create a **Web Service** from GitHub.
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV=production`
     - `PORT=5000`
     - `JWT_SECRET=your_production_secret_32_characters_long`
   - *(The backend will serve both the REST API and the built React frontend on a single URL).*

### Option 2: Docker Container Deployment
A multi-stage production Dockerfile is included:
```bash
docker build -t docease .
docker run -p 5000:5000 -e JWT_SECRET=your_jwt_secret docease
```

### Option 3: Separate Frontend & Backend (e.g., Vercel + Render)
- **Backend**: Deploy `server/` to Render/Railway.
- **Frontend**: Deploy `client/` to Vercel/Netlify and configure:
  - `VITE_API_URL=https://your-backend.onrender.com/api`

