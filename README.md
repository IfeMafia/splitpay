# SplitPay

**The collaborative payment & split distribution platform for project teams, agencies, and freelance collectives.**

SplitPay solves the financial headache of collaborative work. It allows project owners to **create project pools**, **invite teammates**, **collect payments from clients via shareable links**, and **automatically split the earnings** so every collaborator can withdraw their money directly to their bank account.

---

## 💡 The Problem with Collaborative Projects

When a group of freelancers, creatives, or developers work together for a client, handling the payment is messy:

1. **The Lead Contractor Bottleneck**: One person has to receive the entire client payment into their personal bank account. They bear the tax burden, manually calculate everyone's cut, and make individual bank transfers one by one.
2. **Delayed Payouts & Awkward Follow-ups**: Teammates are left in the dark wondering, *"Did the client pay yet?"* and have to constantly chase the lead contractor for their money.
3. **Fee Confusion**: When payment processors deduct processing fees, teammates argue over who should absorb the cost.

---

## 🚀 How SplitPay Solves It

SplitPay automates the entire collaborative payment lifecycle from start to finish:

```text
┌────────────────────────────────┐       ┌────────────────────────────────┐       ┌────────────────────────────────┐
│   1. CREATE POOL & INVITE      │       │   2. GENERATE PAYMENT LINK     │       │   3. AUTO-SPLIT & PAYOUT       │
│                                │       │                                │       │                                │
│ • Create a project Pool        │       │ • Create client invoice link   │       │ • Client pays via Paystack     │
│ • Invite team via Email / Code │ ───>  │ • Share link with client       │ ───>  │ • Money splits automatically   │
│ • Set percentage shares        │       │ • Client pays with card/bank   │       │ • Members withdraw to bank     │
└────────────────────────────────┘       └────────────────────────────────┘       └────────────────────────────────┘
```

---

## 🛠️ Step-by-Step Product Walkthrough

### 1. Create a Project Pool
The project owner creates a dedicated **Pool** for the project (e.g., *"Brand Identity & Web App"* or *"Pepsi Q4 Commercial"*). A Pool serves as the shared workspace and escrow for all transactions related to that contract.

### 2. Add & Invite Collaborators
The owner invites teammates who are contributing to the project:
- **Email Invites**: Send an invite directly to a teammate's inbox.
- **Unique Invite Codes / Links**: Generate a shareable invite code (e.g., `SP-89AB12`) that collaborators can paste into their dashboard to join instantly.
- **Role Assignment**: Designate members as Owner, Admin, or Collaborator.
- **Frictionless Onboarding**: If a collaborator doesn't have a SplitPay account yet, the invite link guides them through a quick signup and automatically links them to the pool.

### 3. Configure the Split Rules
Set how earnings will be shared among the team:
- **Equal Split**: Divide funds equally across all pool members.
- **Custom Percentage Split**: Assign custom percentages based on scope of work (e.g., Lead Dev: `50%`, UI Designer: `30%`, Content Writer: `20%`).
- **100% Rule Validation**: SplitPay validates that the total percentages equal exactly 100%.

### 4. Create & Share Client Payment Links
The owner creates a payment link for the project (full payment or project milestone):
- Enter the amount (in NGN) and payment title (e.g., *"50% Deposit for Website Redesign"*).
- Send the public link directly to the client via WhatsApp, email, or invoice.
- **Zero Client Friction**: Clients open the link in their browser and pay securely with Card, Bank Transfer, USSD, or Apple Pay via Paystack. **The client does not need to register or download anything.**

### 5. Instant Split & Real-Time Alerts
The second the client's payment succeeds:
- Payment processor fees (Paystack) and SplitPay platform fees are cleanly separated.
- The remaining net funds are **split instantly** into each collaborator's wallet.
- The project split rule is **permanently frozen (snapshot)** so future percentage changes never alter past payment history.
- The client gets an instant receipt, and all team members receive in-app and email notifications: *"₦56,040 has been allocated to you from Website Redesign Deposit"*.

### 6. Autonomous Direct Bank Withdrawals
Collaborators don't need to wait on anyone to send them their money:
- Each team member logs into their dashboard and sees their exact **Available Balance**.
- They enter their bank details and request a withdrawal.
- SplitPay processes a direct Paystack bank transfer into their Nigerian bank account.

---

## 📊 Concrete Financial Breakdown (₦100,000 Client Payment)

Here is exactly what happens when a client pays a **₦100,000** invoice for a pool with a **5% platform fee**, split between **Alice (60%)** and **Bob (40%)**:

| Step / Flow | Amount | Details |
| :--- | :--- | :--- |
| **1. Client Payment** | **₦100,000.00** | Client pays invoice via the payment link |
| **2. Paystack Processing Fee** | - ₦1,600.00 | Payment gateway collection cost ($1.5\% \times ₦100,000 + ₦100$) |
| **3. SplitPay Platform Fee** | - ₦5,000.00 | SplitPay service fee ($5\%$ of gross) |
| **4. Net Distributable Pool Funds** | **₦93,400.00** | Total net money available to the team |
| **5. Alice's Cut (60%)** | **₦56,040.00** | Deposited into Alice's balance |
| **6. Bob's Cut (40%)** | **₦37,360.00** | Deposited into Bob's balance |

> **Accounting Invariant:** $\text{Gross (₦100,000)} = \text{Paystack (₦1,600)} + \text{Platform (₦5,000)} + \text{Alice (₦56,040)} + \text{Bob (₦37,360)}$.  
> Every single kobo is accounted for with zero rounding loss.

---

## 👥 Who is SplitPay Built For?

- **Creative & Digital Agencies**: Manage client deposits and automatically pay your freelance designers, animators, and copywriters without manual payroll.
- **Freelance Collectives & Dev Squads**: Pitch for large client projects as a unified team and distribute payments automatically upon milestone delivery.
- **Event Organizers & Production Crews**: Split ticket/vendor proceeds transparently between sound engineers, videographers, caterers, and planners.
- **Content Creators & Podcasters**: Automatically share sponsor payouts between co-hosts, producers, and editors.

---

## ✨ Core Feature Highlights

| Feature | Description |
| :--- | :--- |
| **Collaborative Pools** | Dedicated workspaces for every project, contract, or team endeavor. |
| **Invite by Code / Email** | Flexible onboarding with shareable 6-character invite codes and direct email invites. |
| **Public Payment Links** | Frictionless checkout pages where clients pay invoices without logging in. |
| **Smart Split Engine** | Supports equal shares or custom percentages with zero-drift kobo arithmetic. |
| **Immutable Snapshots** | Freezes split percentages at payment time so past payouts remain untouched. |
| **Independent Balances** | Every member has their own balance and can withdraw to their bank account anytime. |
| **Automated Bank Payouts** | Direct Nigerian bank account transfers powered by Paystack Transfer API. |
| **Multi-channel Notifications** | In-app notification center and transactional email alerts for all financial events. |

---

## 💻 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL
- **Payments & Payouts**: Paystack API (Payment Gateway, Webhooks, Transfers)
- **Transactional Emails**: Nodemailer with SMTP integration

---

## 🏁 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18 or higher
- **PostgreSQL Database**
- **Paystack API Keys** (from [Paystack Dashboard](https://dashboard.paystack.com))

---

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create and configure .env
cp .env.example .env
```

Ensure your `backend/.env` contains:
```env
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/splitpay"
JWT_SECRET="your-super-secret-jwt-key"
FRONTEND_URL="http://localhost:3000"

PAYSTACK_SECRET_KEY="sk_test_xxx"
PAYSTACK_PUBLIC_KEY="pk_test_xxx"
```

Run database migrations and start the backend:
```bash
npx prisma migrate dev
npm run dev
```
*Backend runs at `http://localhost:5000`.*

---

### 3. Frontend Setup
```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

# Start frontend
npm run dev
```
*Frontend runs at `http://localhost:3000`.*

---

### 4. Running Tests
Run the comprehensive financial test suite:
```bash
cd backend
npm test
```

---

## 📄 License
This project is licensed under the MIT License.
