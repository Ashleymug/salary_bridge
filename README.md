# GovPay Uganda

A full-stack **Earned Wage Access (EWA)** platform that allows Ugandan public servants to request salary advances against wages already earned, paid instantly to their MTN Mobile Money or Airtel Money account.

---

## Features

### Employee (Public Servant)
- Register with your government Employee ID and set a secure password
- View your real-time earned wages based on days worked this month
- Request a salary advance up to 50% of your monthly salary (capped at UGX 900,000)
- Receive funds instantly to your registered mobile money account
- Download PDF receipts and full transaction history statements
- Enable two-factor authentication (phone verification) for added security
- Change your password securely from the settings page

### Admin Portal
- Dashboard with live KPIs — total advanced, repayment rate, payroll summary, 6-month disbursement chart
- Verify or flag employee identity documents before they can access advances
- Manage employee salaries with inline editing
- Add new employees directly from the portal
- View all advance disbursements with reference numbers, fees, and repayment dates
- Full audit log of every system event with severity levels
- Admin account settings: change password, toggle 2FA, view profile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router v7 |
| Styling | CSS custom properties (design tokens), no UI framework |
| HTTP client | Axios |
| PDF generation | `@react-pdf/renderer` |
| Backend | Python 3.12, FastAPI, Uvicorn |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (PyJWT), bcrypt password hashing |
| Validation | Pydantic v2 |
| Deployment | Vercel (frontend + backend as separate projects) |

---

## Project Structure

```
salary_bridge/
├── src/                        # React frontend
│   ├── api/                    # Axios API layer (one file per domain)
│   │   ├── client.js           # Shared Axios instance + JWT interceptor
│   │   ├── auth.js             # Register, login, verify-phone, me
│   │   ├── users.js            # Profile, salary, 2FA toggle
│   │   ├── advances.js         # Request and list advances
│   │   └── admin.js            # Admin-only operations
│   ├── components/             # Reusable UI components
│   │   ├── ProtectedRoute.jsx  # Redirects unauthenticated users
│   │   ├── AdminRoute.jsx      # Redirects non-admin users
│   │   ├── Sidebar.jsx         # Employee navigation sidebar
│   │   └── Skeleton.jsx        # Loading placeholder screens
│   ├── context/                # React Context for auth state
│   │   └── AuthContext.jsx     # user, token, login, logout, refreshUser
│   ├── lib/                    # Utilities
│   │   ├── format.js           # Currency, date, name formatters
│   │   └── pdf/                # PDF receipt and statement generation
│   ├── pages/                  # One file per screen
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── AdvancePage.jsx
│   │   ├── ConfirmationPage.jsx
│   │   ├── HistoryPage.jsx
│   │   ├── SettingsPage.jsx
│   │   ├── SupportPage.jsx
│   │   ├── WithdrawPage.jsx
│   │   └── AdminDashboardPage.jsx
│   ├── styles/                 # Page-specific CSS
│   └── index.css               # Global design tokens and shared styles
│
├── backend/                    # FastAPI backend
│   ├── api/
│   │   └── index.py            # Vercel entry point
│   ├── app/
│   │   ├── main.py             # App factory, CORS, router registration
│   │   ├── config.py           # Pydantic Settings (env var loader)
│   │   ├── database.py         # Supabase client singleton
│   │   ├── models/             # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── auth.py         # /api/auth/* — register, login, 2FA
│   │   │   ├── users.py        # /api/users/* — profile, salary, settings
│   │   │   ├── advances.py     # /api/advances/* — request + history
│   │   │   └── admin.py        # /api/admin/* — admin-only endpoints
│   │   └── core/
│   │       ├── security.py     # bcrypt hashing, JWT creation/decoding
│   │       └── deps.py         # FastAPI auth dependency functions
│   ├── migrations/
│   │   └── schema.sql          # Full PostgreSQL schema + seed data
│   ├── requirements.txt
│   ├── vercel.json             # Vercel backend deployment config
│   └── .env.example            # Backend environment variable template
│
├── designs/                    # UI design references and mockups
├── .env.example                # Frontend environment variable template
└── vercel.json                 # Vercel frontend deployment config
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- A [Supabase](https://supabase.com) project

### 1. Database Setup

Open the Supabase SQL Editor in your project dashboard and run the full contents of:

```
backend/migrations/schema.sql
```

This creates all tables (`users`, `advances`, `ledger`, `audit_logs`), indexes, Row Level Security policies, and seeds demo accounts.

**Demo accounts created by the seed:**

| Employee ID | Password | Role |
|---|---|---|
| `admin` | `admin` | Administrator |
| `IPPS-004952` | `1234` | Public Servant |
| `UPF/99120` | `4321` | Public Servant |
| `MOH/88219` | `8899` | Public Servant |
| `MOW/55214` | `2211` | Public Servant |

> Change the admin password immediately after first login.

### 2. Backend Setup

```bash
cd salary_bridge/backend

# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, and JWT_SECRET

# Start the development server
uvicorn app.main:app --reload --port 8000
```

API will be available at `http://127.0.0.1:8000`  
Interactive docs at `http://127.0.0.1:8000/docs`

### 3. Frontend Setup

```bash
cd salary_bridge

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# For local development, leave VITE_API_URL blank — Vite proxies /api to localhost:8000

# Start the development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

---

## Environment Variables

### Frontend (`salary_bridge/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL including `/api`. Leave blank for local dev (Vite proxy handles it). Example: `https://your-backend.vercel.app/api` |

### Backend (`salary_bridge/backend/.env`)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase `service_role` secret key (backend only — never expose to client) |
| `JWT_SECRET` | Random secret for signing JWTs. Generate with: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `JWT_ALGORITHM` | `HS256` (default) |
| `JWT_EXPIRE_MINUTES` | Token lifetime in minutes. Default: `1440` (24 hours) |
| `ALLOWED_ORIGINS` | Comma-separated list of frontend origins allowed by CORS. Example: `https://your-app.vercel.app,http://localhost:5173` |

---

## Deployment (Vercel)

The frontend and backend are deployed as two separate Vercel projects.

### Backend
1. Create a new Vercel project pointing to the `salary_bridge/backend/` directory
2. Add all backend environment variables in Vercel → Settings → Environment Variables
3. Deploy — Vercel uses `backend/vercel.json` and `api/index.py` as the entry point

### Frontend
1. Create a new Vercel project pointing to the `salary_bridge/` directory
2. Add `VITE_API_URL` set to your deployed backend URL + `/api`
3. Add the frontend's Vercel domain to `ALLOWED_ORIGINS` in the backend project's env vars
4. Redeploy both projects

---

## Security

- Passwords are hashed with **bcrypt** (cost factor 12) — plain text is never stored or logged
- All sensitive credentials are loaded from environment variables — nothing is hardcoded
- JWTs are stateless and expire after 24 hours
- Admin endpoints require a valid JWT with `role = admin`
- Password change events are logged to the audit trail and invalidate the session
- Row Level Security is enabled on all Supabase tables
- CORS is restricted to explicitly configured frontend origins

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new public servant |
| `POST` | `/api/auth/login` | Login with employee ID + password |
| `POST` | `/api/auth/verify-phone` | Complete 2FA phone verification |
| `GET` | `/api/auth/me` | Get current user profile |
| `GET` | `/api/users/salary-info` | Get salary and advance eligibility |
| `PUT` | `/api/users/2fa` | Toggle two-factor authentication |
| `POST` | `/api/advances/` | Request a salary advance |
| `GET` | `/api/advances/` | List all advances for current user |
| `GET` | `/api/advances/{id}` | Get a single advance |
| `GET` | `/api/admin/overview` | Admin dashboard data |
| `PUT` | `/api/admin/verify/{id}` | Verify or flag an employee |
| `PUT` | `/api/admin/salary/{id}` | Update an employee's salary |
| `POST` | `/api/admin/employees` | Create a new employee |
| `PUT` | `/api/admin/change-password` | Change admin password |

Full interactive documentation is available at `/docs` when the backend is running.

---

## License

This project was built as a demonstration of an Earned Wage Access platform for Ugandan public servants.
