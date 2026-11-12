# Naira Finance App

**Development of a Mobile Application for Tracking and Managing Personal Finances in Naira**

A complete full-stack mobile application built with React Native (frontend), Node.js/Express.js (backend), and MySQL (database) for managing personal finances in Nigerian Naira (₦).

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Database Setup](#database-setup)
7. [Backend Setup](#backend-setup)
8. [Frontend Setup](#frontend-setup)
9. [Running the Application](#running-the-application)
10. [API Endpoint Reference](#api-endpoint-reference)
11. [Testing Guide](#testing-guide)
12. [Offline Functionality](#offline-functionality)
13. [Security Implementation](#security-implementation)
14. [Sprint Plan Summary](#sprint-plan-summary)
15. [Troubleshooting](#troubleshooting)

---

## Project Overview

Naira Finance App is a mobile personal finance management system that enables Nigerian users to:

- Track income and expenses in Nigerian Naira
- Create category-based monthly budgets with automatic alerts
- Set and monitor personal savings goals
- Record traditional Ajo and Esusu contributions
- View financial reports and visual analytics
- Work fully offline with automatic cloud synchronisation

---

## System Architecture

```
┌─────────────────────────────────────────────────┐
│              REACT NATIVE FRONTEND               │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │Navigation│ │Screens   │ │AsyncStorage      │ │
│  │(React    │ │(Dashboard│ │(Offline Queue +  │ │
│  │Navigation│ │ Income,  │ │ Cached Data)     │ │
│  │Bottom Tab│ │ Expense, │ └──────────────────┘ │
│  │ Stack)   │ │ Budget,  │ ┌──────────────────┐ │
│  └──────────┘ │ Savings, │ │Sync Service      │ │
│               │ Reports, │ │(NetInfo + Axios) │ │
│               │ Ajo/Esusu│ └──────────────────┘ │
│               └──────────┘                      │
└───────────────────┬─────────────────────────────┘
                    │ HTTPS REST API (JWT Bearer)
┌───────────────────▼─────────────────────────────┐
│              NODE.JS / EXPRESS.JS BACKEND        │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │Routes    │ │Controllers│ │Middleware        │ │
│  │auth      │ │auth       │ │JWT Auth          │ │
│  │income    │ │income     │ │express-validator │ │
│  │expenses  │ │expense    │ │Rate Limiting     │ │
│  │budgets   │ │budget     │ │Helmet / CORS     │ │
│  │savings   │ │savings    │ │Error Handler     │ │
│  │ajo       │ │ajo        │ └──────────────────┘ │
│  │reports   │ │dashboard  │                      │
│  │sync      │ │report     │                      │
│  └──────────┘ │sync       │                      │
│               └──────────┘                      │
└───────────────────┬─────────────────────────────┘
                    │ mysql2 connection pool
┌───────────────────▼─────────────────────────────┐
│                   MySQL DATABASE                 │
│  users │ income │ expenses │ income_categories   │
│  expense_categories │ budgets │ savings_goals    │
│  savings_contributions │ ajo_esusu_contributions │
│  sync_records │ password_reset_tokens            │
└─────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer        | Technology             | Version  |
|-------------|------------------------|----------|
| Mobile UI    | React Native           | 0.74.2   |
| Language     | JavaScript (ES6+)      | —        |
| Navigation   | React Navigation       | 6.x      |
| Local Storage| AsyncStorage           | 1.23.1   |
| Charts       | react-native-chart-kit | 6.12.0   |
| HTTP Client  | Axios                  | 1.7.2    |
| Backend      | Node.js + Express.js   | 4.19.2   |
| Database     | MySQL                  | 8.x      |
| DB Connector | mysql2                 | 3.9.7    |
| Auth         | JWT + bcryptjs         | —        |
| Validation   | express-validator      | 7.1.0    |
| Security     | helmet, cors, rate-limit| —       |

---

## Project Structure

```
naira-finance-app/
├── database/
│   └── schema.sql              ← Complete MySQL schema + seed data
│
├── backend/
│   ├── .env.example            ← Environment variables template
│   ├── package.json
│   ├── server.js               ← Express app entry point
│   ├── config/
│   │   ├── database.js         ← MySQL connection pool
│   │   └── jwt.js              ← JWT config constants
│   ├── middleware/
│   │   ├── auth.js             ← JWT authentication middleware
│   │   ├── validate.js         ← express-validator result handler
│   │   └── errorHandler.js     ← Global error handler
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── incomeController.js
│   │   ├── expenseController.js
│   │   ├── categoryController.js
│   │   ├── budgetController.js
│   │   ├── savingsController.js
│   │   ├── ajoController.js
│   │   ├── dashboardController.js
│   │   ├── reportController.js
│   │   └── syncController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── incomeRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── budgetRoutes.js
│   │   ├── savingsRoutes.js
│   │   ├── ajoRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── reportRoutes.js
│   │   └── syncRoutes.js
│   └── utils/
│       ├── response.js         ← Standardised API response helpers
│       └── helpers.js          ← Naira formatting, date utilities
│
├── frontend/
│   ├── App.js                  ← Root component
│   ├── index.js                ← RN app registration
│   ├── app.json
│   ├── babel.config.js
│   ├── package.json
│   └── src/
│       ├── context/
│       │   └── AuthContext.js  ← Auth state (login, logout, token)
│       ├── navigation/
│       │   ├── AppNavigator.js
│       │   ├── AuthNavigator.js
│       │   ├── MainNavigator.js (Bottom Tabs)
│       │   ├── TransactionStack.js
│       │   ├── BudgetStack.js
│       │   ├── SavingsStack.js
│       │   └── MoreStack.js
│       ├── screens/
│       │   ├── Auth/           LoginScreen, RegisterScreen
│       │   ├── Dashboard/      DashboardScreen
│       │   ├── Income/         TransactionHomeScreen, IncomeListScreen, AddIncomeScreen
│       │   ├── Expenses/       ExpenseListScreen, AddExpenseScreen
│       │   ├── Budget/         BudgetListScreen, AddBudgetScreen
│       │   ├── Savings/        SavingsListScreen, AddSavingsScreen, SavingsDetailScreen
│       │   ├── Reports/        ReportsScreen
│       │   ├── AjoEsusu/       AjoListScreen, AddAjoScreen
│       │   └── Profile/        MoreMenuScreen, ProfileScreen
│       ├── components/
│       │   └── common/         Button, Input, Card, LoadingSpinner, EmptyState, SyncBanner
│       ├── services/
│       │   ├── api.js          ← Axios instance with JWT interceptor
│       │   └── syncService.js  ← Offline queue + sync logic
│       ├── styles/
│       │   └── theme.js        ← Colors, fonts, spacing, shadows
│       └── utils/
│           ├── formatters.js   ← Naira formatting, date formatting
│           └── storage.js      ← AsyncStorage helpers
│
└── README.md
```

---

## Prerequisites

Install the following before starting:

| Tool              | Download / Command                                    |
|-------------------|-------------------------------------------------------|
| Node.js 18+       | https://nodejs.org                                    |
| MySQL 8.x         | https://dev.mysql.com/downloads/mysql/                |
| Java JDK 17+      | https://adoptium.net                                  |
| Android Studio    | https://developer.android.com/studio                 |
| React Native CLI  | `npm install -g react-native-cli`                     |
| Git               | https://git-scm.com                                   |

Set the following environment variables on your machine:

```powershell
# Windows PowerShell – add to your profile or set per session
$env:ANDROID_HOME = "C:\Users\YourName\AppData\Local\Android\Sdk"
$env:Path += ";$env:ANDROID_HOME\platform-tools"
$env:Path += ";$env:ANDROID_HOME\emulator"
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"
```

---

## Database Setup

### Step 1 — Create the database

Open MySQL Workbench or MySQL CLI and run:

```sql
-- Option A: MySQL CLI
mysql -u root -p < "c:\Users\dell\Desktop\development of a personal finance bot\naira-finance-app\database\schema.sql"

-- Option B: MySQL Workbench
-- File → Open SQL Script → select database/schema.sql → Execute (⚡)
```

This creates:
- Database: `naira_finance_db`
- All 11 tables with foreign keys and indexes
- Default income and expense categories

### Step 2 — Verify

```sql
USE naira_finance_db;
SHOW TABLES;
SELECT * FROM income_categories;
SELECT * FROM expense_categories;
```

Expected output: 11 tables, 8 income categories, 10 expense categories.

---

## Backend Setup

### Step 1 — Navigate to backend folder

```powershell
cd "c:\Users\dell\Desktop\development of a personal finance bot\naira-finance-app\backend"
```

### Step 2 — Install dependencies

```powershell
npm install
```

Installs: express, mysql2, bcryptjs, jsonwebtoken, express-validator, helmet, cors, morgan, express-rate-limit, uuid, dotenv, nodemon.

### Step 3 — Create environment file

```powershell
Copy-Item .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=naira_finance_db

JWT_SECRET=naira_finance_secret_key_change_this_in_production_2024
JWT_EXPIRES_IN=7d

BCRYPT_ROUNDS=12

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

> **Important:** Never commit `.env` to Git. It is already listed in `.gitignore`.

### Step 4 — Start the backend

```powershell
# Development (auto-restart on file change)
npm run dev

# Production
npm start
```

Expected output:
```
✅ MySQL connected successfully
🚀 Naira Finance API running on port 5000
   Environment: development
```

### Step 5 — Verify the API health

Open a browser or Postman and visit:
```
GET http://localhost:5000/health
```

Response:
```json
{ "status": "ok", "timestamp": "2026-11-07T..." }
```

---

## Frontend Setup

### Step 1 — Navigate to frontend folder

```powershell
cd "c:\Users\dell\Desktop\development of a personal finance bot\naira-finance-app\frontend"
```

### Step 2 — Install dependencies

```powershell
npm install
```

### Step 3 — Configure API base URL

Open `src/services/api.js` and set your backend URL:

```javascript
// For Android Emulator (maps to localhost on your PC)
export const BASE_URL = 'http://10.0.2.2:5000/api';

// For physical Android device (use your PC's local IP)
export const BASE_URL = 'http://192.168.1.XXX:5000/api';
```

Find your PC's local IP with:
```powershell
ipconfig
# Look for: IPv4 Address . . . . 192.168.x.x
```

### Step 4 — Android-specific setup

In `android/app/src/main/AndroidManifest.xml`, add inside `<application>`:

```xml
<application
  android:usesCleartextTraffic="true"
  ...>
```

This allows HTTP traffic during development. Use HTTPS in production.

### Step 5 — Start the Metro bundler

```powershell
npm start
```

### Step 6 — Run on Android Emulator

Open a second terminal:

```powershell
npm run android
```

Or from Android Studio: open `frontend/android`, start a virtual device, then run.

---

## Running the Application

Run these in order, each in its own terminal:

```powershell
# Terminal 1 — MySQL (ensure it is running as a Windows Service)
# Check: Get-Service -Name MySQL80

# Terminal 2 — Backend API
cd "...\naira-finance-app\backend"
npm run dev

# Terminal 3 — React Native Metro bundler
cd "...\naira-finance-app\frontend"
npm start

# Terminal 4 — Android app
cd "...\naira-finance-app\frontend"
npm run android
```

---

## API Endpoint Reference

All protected routes require:
```
Authorization: Bearer <jwt_token>
```

All responses follow the format:
```json
{
  "status": "success" | "error",
  "message": "...",
  "data": { ... }
}
```

---

### Authentication — `/api/auth`

| Method | Endpoint              | Auth | Description              |
|--------|-----------------------|------|--------------------------|
| POST   | `/register`           | ✗    | Register new user        |
| POST   | `/login`              | ✗    | Login and get JWT token  |
| GET    | `/profile`            | ✓    | Get user profile         |
| PUT    | `/profile`            | ✓    | Update name/phone        |
| PUT    | `/change-password`    | ✓    | Change password          |
| POST   | `/logout`             | ✓    | Logout (clears session)  |

**Register body:**
```json
{
  "full_name": "Chidi Okafor",
  "email": "chidi@example.com",
  "phone": "08012345678",
  "password": "Password123"
}
```

**Login body:**
```json
{ "email": "chidi@example.com", "password": "Password123" }
```

---

### Income — `/api/income`

| Method | Endpoint   | Auth | Description                        |
|--------|------------|------|------------------------------------|
| GET    | `/`        | ✓    | List income (filter: start_date, end_date, category_id, page, limit) |
| GET    | `/:id`     | ✓    | Get single income record           |
| POST   | `/`        | ✓    | Create income record               |
| PUT    | `/:id`     | ✓    | Update income record               |
| DELETE | `/:id`     | ✓    | Delete income record               |

**Create/Update body:**
```json
{
  "category_id": 1,
  "amount": 150000.00,
  "description": "November salary",
  "transaction_date": "2026-11-01",
  "source": "ABC Company Ltd",
  "is_recurring": true
}
```

---

### Expenses — `/api/expenses`

| Method | Endpoint   | Auth | Description                        |
|--------|------------|------|------------------------------------|
| GET    | `/`        | ✓    | List expenses (filter: start_date, end_date, category_id, search, page, limit) |
| GET    | `/:id`     | ✓    | Get single expense                 |
| POST   | `/`        | ✓    | Create expense (triggers budget alert check) |
| PUT    | `/:id`     | ✓    | Update expense                     |
| DELETE | `/:id`     | ✓    | Delete expense                     |

**Create/Update body:**
```json
{
  "category_id": 1,
  "amount": 5000.00,
  "description": "Lunch at Mr Biggs",
  "transaction_date": "2026-11-07",
  "payment_method": "cash",
  "is_recurring": false
}
```

---

### Categories — `/api/categories`

| Method | Endpoint          | Auth | Description               |
|--------|-------------------|------|---------------------------|
| GET    | `/income`         | ✓    | List all income categories |
| POST   | `/income`         | ✓    | Create custom income category |
| DELETE | `/income/:id`     | ✓    | Delete custom income category |
| GET    | `/expense`        | ✓    | List all expense categories |
| POST   | `/expense`        | ✓    | Create custom expense category |
| DELETE | `/expense/:id`    | ✓    | Delete custom expense category |

---

### Budgets — `/api/budgets`

| Method | Endpoint    | Auth | Description                          |
|--------|-------------|------|--------------------------------------|
| GET    | `/`         | ✓    | List budgets (query: month, year)    |
| GET    | `/alerts`   | ✓    | Get current month budget alerts      |
| POST   | `/`         | ✓    | Create budget                        |
| PUT    | `/:id`      | ✓    | Update budget limit/alerts           |
| DELETE | `/:id`      | ✓    | Delete budget                        |

**Create body:**
```json
{
  "category_id": 1,
  "amount_limit": 30000.00,
  "month": 11,
  "year": 2026,
  "alert_75": true,
  "alert_90": true,
  "alert_100": true
}
```

---

### Savings Goals — `/api/savings`

| Method | Endpoint                | Auth | Description                  |
|--------|-------------------------|------|------------------------------|
| GET    | `/`                     | ✓    | List all savings goals       |
| GET    | `/:id`                  | ✓    | Get single goal with progress|
| POST   | `/`                     | ✓    | Create savings goal          |
| PUT    | `/:id`                  | ✓    | Update goal                  |
| DELETE | `/:id`                  | ✓    | Delete goal + contributions  |
| GET    | `/:id/contributions`    | ✓    | List contributions for goal  |
| POST   | `/:id/contributions`    | ✓    | Add deposit or withdrawal    |

**Create goal body:**
```json
{
  "title": "Emergency Fund",
  "target_amount": 500000.00,
  "target_date": "2027-06-30",
  "description": "6 months living expenses"
}
```

**Add contribution body:**
```json
{
  "amount": 25000.00,
  "type": "deposit",
  "note": "November savings",
  "contribution_date": "2026-11-07"
}
```

---

### Ajo & Esusu — `/api/ajo`

| Method | Endpoint   | Auth | Description                          |
|--------|------------|------|--------------------------------------|
| GET    | `/`        | ✓    | List contributions (filter: type, start_date, end_date) |
| GET    | `/:id`     | ✓    | Get single contribution              |
| POST   | `/`        | ✓    | Record Ajo or Esusu contribution     |
| PUT    | `/:id`     | ✓    | Update contribution                  |
| DELETE | `/:id`     | ✓    | Delete contribution                  |

**Create body:**
```json
{
  "type": "ajo",
  "group_name": "Surulere Street Ajo",
  "amount": 5000.00,
  "contribution_date": "2026-11-07",
  "description": "Weekly contribution",
  "cycle": "weekly",
  "status": "paid"
}
```

---

### Dashboard — `/api/dashboard`

| Method | Endpoint   | Auth | Description                       |
|--------|------------|------|-----------------------------------|
| GET    | `/summary` | ✓    | Complete dashboard data snapshot  |

**Response includes:** total balance, total income, total expenses, total savings, monthly breakdown, budget utilisation, recent 5 transactions, active savings goals progress, top 6 expense categories.

---

### Reports — `/api/reports`

| Method | Endpoint              | Auth | Description                     |
|--------|-----------------------|------|---------------------------------|
| GET    | `/monthly`            | ✓    | Income vs expenses by month (query: months=6) |
| GET    | `/weekly`             | ✓    | Weekly income/expense summary (query: weeks=8) |
| GET    | `/daily`              | ✓    | Daily summary (query: start_date, end_date) |
| GET    | `/category/expense`   | ✓    | Spending by expense category    |
| GET    | `/category/income`    | ✓    | Income by category              |
| GET    | `/savings`            | ✓    | Savings goals report            |

---

### Offline Sync — `/api/sync`

| Method | Endpoint   | Auth | Description                          |
|--------|------------|------|--------------------------------------|
| POST   | `/`        | ✓    | Sync a batch of offline transactions |
| GET    | `/status`  | ✓    | View sync history for user           |

**Sync body:**
```json
{
  "transactions": [
    {
      "local_id": "uuid-v4-string",
      "entity_type": "income",
      "data": {
        "category_id": 1,
        "amount": 10000,
        "transaction_date": "2026-11-07",
        "description": "Freelance payment"
      }
    },
    {
      "local_id": "uuid-v4-string-2",
      "entity_type": "expense",
      "data": {
        "category_id": 1,
        "amount": 2500,
        "transaction_date": "2026-11-07",
        "payment_method": "cash"
      }
    }
  ]
}
```

---

## Testing Guide

### Backend API Testing with Postman

#### Setup

1. Open Postman
2. Create a new Collection: `Naira Finance API`
3. Set a Collection Variable: `base_url` = `http://localhost:5000/api`
4. Set a Collection Variable: `token` = *(populated after login)*

#### Test Sequence

**1. Register a user**
```
POST {{base_url}}/auth/register
Body (JSON):
{
  "full_name": "Test User",
  "email": "test@example.com",
  "phone": "08012345678",
  "password": "Password123"
}
Expected: 201, token in response
```

**2. Login**
```
POST {{base_url}}/auth/login
Body: { "email": "test@example.com", "password": "Password123" }
Expected: 200, save token to collection variable
```

**3. Add income categories and income**
```
GET {{base_url}}/categories/income
Authorization: Bearer {{token}}
Expected: 200, list of 8 default categories

POST {{base_url}}/income
Body: { "category_id": 1, "amount": 200000, "transaction_date": "2026-11-01", "description": "Salary" }
Expected: 201
```

**4. Add expenses and trigger budget alert**
```
POST {{base_url}}/budgets
Body: { "category_id": 1, "amount_limit": 30000, "month": 11, "year": 2026 }

POST {{base_url}}/expenses  (repeat until 75% of budget)
Body: { "category_id": 1, "amount": 22500, "transaction_date": "2026-11-07" }

GET {{base_url}}/budgets/alerts
Expected: alert_level "caution" at 75%
```

**5. Create savings goal and contribute**
```
POST {{base_url}}/savings
Body: { "title": "Car Fund", "target_amount": 1000000, "target_date": "2027-12-31" }

POST {{base_url}}/savings/1/contributions
Body: { "amount": 50000, "type": "deposit", "contribution_date": "2026-11-07" }
```

**6. Test offline sync**
```
POST {{base_url}}/sync
Body: {
  "transactions": [{
    "local_id": "abc-123",
    "entity_type": "expense",
    "data": { "category_id": 2, "amount": 1500, "transaction_date": "2026-11-07", "payment_method": "cash" }
  }]
}
Expected: synced: 1, failed: 0
```

**7. Dashboard and reports**
```
GET {{base_url}}/dashboard/summary
GET {{base_url}}/reports/monthly?months=6
GET {{base_url}}/reports/category/expense
```

---

### Functional Testing Checklist

#### Module A — Authentication
- [ ] Register with valid data → succeeds
- [ ] Register with duplicate email → 400 error
- [ ] Register with weak password (< 8 chars) → 400 validation error
- [ ] Login with correct credentials → JWT returned
- [ ] Login with wrong password → 401 error
- [ ] Access protected route without token → 401 error
- [ ] Access protected route with expired token → 401 "Token expired"
- [ ] Change password with wrong current password → 400 error
- [ ] Change password with correct current password → 200

#### Module B — Dashboard
- [ ] Dashboard loads after login
- [ ] Total balance = total income − total expenses
- [ ] Monthly figures reflect current month only
- [ ] Recent transactions show up to 5 entries
- [ ] Savings goals display percentage progress
- [ ] Budget utilisation percentage is accurate

#### Module C — Income
- [ ] Add income with all fields → appears in list
- [ ] Add income with missing required field → validation error
- [ ] Edit income → updated in list
- [ ] Delete income → removed from list, dashboard updates
- [ ] Filter income by date range → correct results
- [ ] Filter income by category → correct results

#### Module D — Expenses
- [ ] Add expense → appears in list
- [ ] Search expenses by description → filtered results
- [ ] Edit expense → updated
- [ ] Delete expense → removed
- [ ] Payment method saved correctly
- [ ] Budget alert triggered when threshold reached

#### Module E — Budget
- [ ] Create budget for a category and month
- [ ] Duplicate budget (same category + month) → 400 error
- [ ] Spend 75% of budget → notified_75 set in DB
- [ ] Spend 90% of budget → notified_90 set in DB
- [ ] Exceed budget → notified_100 set in DB
- [ ] Update budget limit → resets notification flags
- [ ] Delete budget → removed

#### Module F — Savings Goals
- [ ] Create savings goal
- [ ] Deposit to goal → current_amount increases, percentage updates
- [ ] Withdraw from goal → current_amount decreases
- [ ] Withdraw more than available → 400 error
- [ ] Reach target amount → status changes to 'completed'
- [ ] Contribution history shows all records

#### Module G — Reports
- [ ] Monthly chart shows last 6 months
- [ ] Category pie chart shows proportions
- [ ] Savings report shows all goals
- [ ] Daily summary returns merged income/expense per day

#### Module H — Offline Sync
- [ ] Add income while device is offline → saved to AsyncStorage
- [ ] SyncBanner appears showing pending count
- [ ] Connect to internet → tap Sync Now → records appear in backend
- [ ] Duplicate sync attempt → returns 'already_synced' status

#### Module I — Ajo & Esusu
- [ ] Record ajo contribution
- [ ] Record esusu contribution
- [ ] Filter by type (ajo / esusu / all)
- [ ] Summary totals are accurate
- [ ] Edit and delete contribution

---

### Performance Testing

Test API response times using Postman's built-in timer or Newman CLI:

```powershell
# Install Newman
npm install -g newman

# Export Postman collection and run
newman run naira-finance-collection.json --env-var base_url=http://localhost:5000/api
```

Target response times:
- Authentication endpoints: < 500ms
- Dashboard summary: < 800ms
- List endpoints (paginated): < 400ms
- Report endpoints: < 1000ms

---

### System Usability Scale (SUS) Testing

After UAT sessions, administer the 10-question SUS questionnaire to users:

1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think I would need the support of a technical person to use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

**Scoring:** Odd questions: score − 1. Even questions: 5 − score. Sum × 2.5. Target: SUS ≥ 68.

---

## Offline Functionality

### How It Works

```
User adds transaction (no internet)
         │
         ▼
createOfflineRecord() → AsyncStorage offline queue
         │
         ▼
SyncBanner shows "X unsynced transactions"
         │
         ▼ (internet available)
syncPendingRecords() called
         │
         ├── POST /api/sync with queued records
         │
         ├── Server processes each record
         │   ├── Checks sync_records for duplicates
         │   ├── Inserts into appropriate table
         │   └── Marks as 'synced' in sync_records
         │
         └── Removes synced items from AsyncStorage queue
```

### Conflict Resolution Strategy

- **Duplicate prevention:** Each offline record has a UUID `local_id`. The server uses `INSERT ... ON DUPLICATE KEY UPDATE` on the `sync_records` table keyed on `(user_id, local_id, entity_type)`.
- **Failed syncs:** Stay in the offline queue and are retried on the next sync attempt. The `retry_count` column tracks attempts.
- **Conflicts:** Last-write-wins. If the same record was edited both offline and online, the offline version (synced later) takes effect. Future versions can implement timestamp-based resolution.

---

## Security Implementation

| Measure               | Implementation                                     |
|-----------------------|----------------------------------------------------|
| Password hashing      | bcryptjs with 12 salt rounds                       |
| Authentication        | JWT tokens with 7-day expiry                       |
| Token storage         | AsyncStorage (client) — never in plain JS vars     |
| SQL injection         | Parameterised queries via mysql2 (`?` placeholders)|
| Input sanitisation    | express-validator on all POST/PUT bodies           |
| HTTP headers          | helmet() sets 11 security headers                  |
| CORS                  | Restricted origins in production                   |
| Rate limiting         | 100 requests per 15 minutes per IP                 |
| User isolation        | Every query filters by `user_id = req.user.id`     |
| Credentials           | Stored in `.env`, never in source code             |
| HTTPS                 | Configured via reverse proxy (nginx) in production |

---

## Sprint Plan Summary

| Sprint | Duration  | Deliverables                                       |
|--------|-----------|----------------------------------------------------|
| 1      | Weeks 1–2 | Requirements gathering, project planning, tool setup |
| 2      | Weeks 3–4 | System architecture, UI/UX wireframes, MySQL schema |
| 3      | Weeks 5–6 | User auth, income module, expense module            |
| 4      | Weeks 7–8 | Budget module, savings goals, offline AsyncStorage  |
| 5      | Weeks 9–10| Dashboard, reports/analytics, Ajo/Esusu module      |
| 6      | Weeks 11–12| Functional testing, UAT, bug fixes, documentation  |

---

## Troubleshooting

### MySQL connection refused
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Fix:** Ensure MySQL service is running.
```powershell
Get-Service -Name MySQL80
Start-Service -Name MySQL80
```

### Metro bundler port conflict
```
Error: Something is already running on port 8081
```
**Fix:**
```powershell
npx react-native start --port 8082
# Then in another terminal:
npx react-native run-android --port 8082
```

### Android build fails — SDK not found
**Fix:** In `frontend/android/local.properties`:
```
sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
```

### API returns 401 after login
**Fix:** Ensure the `JWT_SECRET` in `.env` matches exactly and was not changed after tokens were issued.

### Sync not working on physical device
**Fix:** Change `BASE_URL` in `src/services/api.js` to your PC's local IP address (not `10.0.2.2`).
```powershell
ipconfig | Select-String "IPv4"
```

### node_modules errors after pulling new code
```powershell
# Backend
cd backend; Remove-Item -Recurse node_modules; npm install

# Frontend
cd frontend; Remove-Item -Recurse node_modules; npm install
npx react-native start --reset-cache
```

---

## Production Deployment Notes

1. Set `NODE_ENV=production` in backend `.env`
2. Use a strong random `JWT_SECRET` (minimum 64 characters)
3. Set `BCRYPT_ROUNDS=12` or higher
4. Configure MySQL with a dedicated application user (not root)
5. Place the Node.js backend behind nginx as a reverse proxy
6. Enable SSL/TLS on nginx (Let's Encrypt)
7. Update `BASE_URL` in `src/services/api.js` to your HTTPS domain
8. Remove `android:usesCleartextTraffic="true"` from AndroidManifest.xml
9. Build a release APK: `cd android && ./gradlew assembleRelease`

---

*Naira Finance App — Final Year Computer Science Project*
*Built with React Native · Node.js · Express.js · MySQL*
