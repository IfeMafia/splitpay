# Splitpay

Splitpay is a payment distribution platform designed for collaborative projects and teams. It simplifies managing client payments by allowing creators to set up payment pools, invite collaborators, collect client funds securely, and automate split distribution based on predefined percentage rules.

---

## 🚀 Key Features

- **Pool Management**: Create and manage collaborative project pools with role-based team members.
- **Dynamic Payment Links**: Generate public, shareable payment links allowing clients to pay seamlessly without registering.
- **Flexible Distribution**: Configure funds distribution using either equal splits or custom percentage shares.
- **Paystack Payment Integration**: Instant payment collection and automated webhook handling.
- **Ledger & Entitlement Tracking**: Precise balance calculations and payout entitlement tracking for each collaborator.
- **Withdrawal Engine**: Member payout management and withdrawal request processing.
- **Email Notifications**: System alerts and status updates powered by Nodemailer.

---

## 🏗️ Project Architecture

This repository is structured as a monorepo:

```text
splitpay/
├── backend/            # Express.js + TypeScript REST API
├── frontend/           # Next.js 16 (App Router) + TailwindCSS client app
├── docs/               # Architecture specs, PRD, API schemas & Postman collections
└── README.md           # Project documentation
```

### Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS v4, Lucide Icons, Vitest
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Zod, JWT Authentication
- **Integrations**: Paystack API, Nodemailer / SMTP

---

## 🛠️ Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: v18+ 
- **Package Manager**: `pnpm` or `npm`
- **Database**: PostgreSQL database instance

---

### Environment Setup

#### Backend Configuration
Create a `.env` file in the `backend/` directory based on the following variables:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/splitpay
JWT_SECRET=your-secure-jwt-secret-key-at-least-16-chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx

# SMTP Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=no-reply@splitpay.local
```

#### Frontend Configuration
Create a `.env.local` file in the `frontend/` directory if needed:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### Installation & Database Setup

1. **Install Backend Dependencies & Run Migrations**:
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npx prisma generate
   ```

2. **Install Frontend Dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

---

### Running the Application

#### Start Backend Server
From the `backend/` directory:
```bash
npm run dev
```
The API server will run at `http://localhost:5000`.

#### Start Frontend Application
From the `frontend/` directory:
```bash
npm run dev
```
The client app will run at `http://localhost:3000`.

---

## 🧪 Testing

- **Backend Tests**: `npm test` (inside `backend/`)
- **Frontend Tests**: `npm test` (inside `frontend/`)

---

## 📚 Documentation & Resources

Comprehensive project documentation is available in the [`docs/`](file:///c:/Users/SAMKIEL/CODEX/Ife%20Mafia/splitpay/docs) directory:
- [Product Requirements Document (PRD)](file:///c:/Users/SAMKIEL/CODEX/Ife%20Mafia/splitpay/docs/prd.md)
- [System Architecture & API Specs](file:///c:/Users/SAMKIEL/CODEX/Ife%20Mafia/splitpay/docs/documentation.md)
- [Postman Collection](file:///c:/Users/SAMKIEL/CODEX/Ife%20Mafia/splitpay/docs/Splitpay_API.postman_collection.json)
