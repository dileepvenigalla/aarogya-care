# AAROGYA CARE — Full-Stack Hospital & Clinic Portal

Full-stack healthcare web application built with a **React + Vite** frontend and a **Node.js + Express + SQLite** backend REST API. (The original vanilla HTML/CSS/JS prototype remains preserved in `aarogya-care/`.)

## Project Structure

- `frontend/` — React 19 + Vite single-page application (`react-router-dom`, `chart.js`, `react-chartjs-2`, Bootstrap 5 styling)
- `backend/` — Express REST API with JWT authentication (`jsonwebtoken`), password hashing (`bcryptjs`), and persistent SQLite storage via Node's built-in `node:sqlite`
- `aarogya-care/` — Original static HTML/CSS/JS localStorage prototype

## Features

- **Public Portal**: Landing page with animated statistics, featured departments modal, specialist doctor search & department filter, services, testimonials, FAQ accordion, and database-backed contact inquiry form.
- **Appointment Booking**: Live slot availability lookup (`/api/appointments/slots`), double-booking prevention, doctor fee display, and instant booking reference ID.
- **Authentication**: Patient registration (auto-generated `PTxxxxx` ID) and JWT login supporting either email or patient/admin ID.
- **Patient Dashboard**: Overview, appointment history & cancellation, my doctors, medical records, prescriptions, billing summary, and notifications.
- **Admin Dashboard**: Analytics overview with Chart.js bar & doughnut charts, plus full management for Doctors, Patients, Departments, Appointments (status updates), and Contact Messages.

## Demo Credentials

- **Admin**: `admin@aarogya.demo` / `Admin@123`
- **Patient**: `patient@aarogya.demo` / `Patient@123`

> **Note:** Demo application with sample data only. Do not enter real medical or sensitive personal information.

## Running Locally

### 1. Start the Backend API (`http://localhost:5000`)

```bash
cd backend
npm install
npm start
```

Run backend integration tests:

```bash
cd backend
npm test
```

### 2. Start the React Frontend (`http://localhost:5173`)

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api/*` requests directly to `http://localhost:5000`. For a single-server production build, run `npm run build` in `frontend/` and `npm start` in `backend/` (Express automatically serves `frontend/dist`).
