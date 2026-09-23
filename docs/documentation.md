# Splitpay Technical Documentation

**Version:** 3.0  
**Status:** Active technical specification  
**Architecture:** Next.js frontend + Node.js/Express backend monorepo  
**Database:** PostgreSQL + Prisma ORM  
**Payments:** Paystack  
**Email:** Google SMTP  
**Deployment:** Frontend on Vercel; Express API on a Node-compatible deployment target (Vercel-compatible deployment may be used if configured accordingly)

---

## Root Documentation

All product, PRD, architecture, API, task, and engineering documentation lives in the root `docs/` folder so both `backend/` and `front-end/` can use the same source of truth.

```text
splitpay/
├── backend/
├── front-end/
├── docs/
└── package.json
```

## 1. Overview

Splitpay is a payment distribution platform for collaborative work.

A **Pool** represents a collaborative project where multiple members are entitled to portions of client payments.

Core flow:

```text
Create Pool
→ Add Collaborators
→ Generate Payment Link
→ Client Pays
→ Payment Confirmed
→ Configure Split
→ Calculate Allocations
→ Members Withdraw
```

The client does not need a Splitpay account to make a payment.

Splitpay owns the payment record, split calculation, internal ledger, withdrawal state and audit history.

---

## 2. System Architecture

Splitpay is a monorepo with two applications:

```text
splitpay/
├── backend/
├── front-end/
├── docs/
└── package.json
```

### Request architecture

```text
                    SPLITPAY
                       |
          +------------+------------+
          |                         |
     Next.js Web              Express API
     front-end                  backend
          |                         |
          +-----------+-------------+
                      |
                PostgreSQL
                      |
                 Prisma ORM
                      |
        +-------------+-------------+
        |                           |
     Paystack                   Google SMTP
```

The frontend never directly owns financial business logic.

The Express API is the authoritative application boundary for authentication, authorization, Pools, payments, splits, ledger access and withdrawals.

---

## 3. Application Responsibilities

### `front-end`

Responsible for:

- UI/UX
- Authentication screens
- Dashboard
- Pool management screens
- Collaborator management
- Payment-link management
- Public checkout
- Split configuration
- Allocation display
- Balance/transaction views
- Withdrawal UI
- Notifications
- Settings

### `backend`

Responsible for:

- Authentication
- Authorization
- Pool management
- Invitations
- Payment-link APIs
- Paystack integration
- Payment verification
- Webhook processing
- Split calculations
- Ledger operations
- Withdrawal processing
- Notifications
- Audit logging

### `packages/shared`

Contains contracts shared between frontend and backend:

```text
types
schemas
enums
API request/response contracts
shared constants
```

Do not place business logic in the shared package.

---

## 4. Frontend Routes

```text
/
 /signin
 /signup

/dashboard
/dashboard/pools
/dashboard/notifications
/dashboard/settings

/pools/new
/pools/[poolId]
/pools/[poolId]/members
/pools/[poolId]/payments
/pools/[poolId]/split
/pools/[poolId]/withdrawals

/invitations/[token]

/pay/[token]
/pay/[token]/success
/pay/[token]/failed
```

The public `/pay/[token]` routes do not require authentication.

---

## 5. Express API

Base API prefix:

```text
/api
```

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
PATCH /api/users/me
```

### Pools

```text
GET    /api/pools
POST   /api/pools
GET    /api/pools/:poolId
PATCH  /api/pools/:poolId
DELETE /api/pools/:poolId
```

### Members

```text
GET    /api/pools/:poolId/members
POST   /api/pools/:poolId/members
DELETE /api/pools/:poolId/members/:memberId
```

### Invitations

```text
POST   /api/pools/:poolId/invitations/code
POST   /api/pools/:poolId/invitations/email
GET    /api/pools/:poolId/invitations
DELETE /api/pools/:poolId/invitations/:invitationId

GET    /api/invitations/:token
POST   /api/invitations/:token/accept
```

### Payment links

```text
GET    /api/pools/:poolId/payment-links
POST   /api/pools/:poolId/payment-links
PATCH  /api/pools/:poolId/payment-links/:linkId
DELETE /api/pools/:poolId/payment-links/:linkId

GET    /api/pay/:token
POST   /api/pay/:token/initialize
```

### Transactions

```text
GET /api/pools/:poolId/transactions
```

### Splits

```text
GET  /api/pools/:poolId/split
POST /api/pools/:poolId/split
GET  /api/pools/:poolId/allocations
GET  /api/pools/:poolId/balance
```

### Withdrawals

```text
GET  /api/pools/:poolId/withdrawals
POST /api/pools/:poolId/withdrawals
GET  /api/pools/:poolId/withdrawals/:withdrawalId
```

### Notifications

```text
GET   /api/notifications
PATCH /api/notifications/:notificationId/read
```

### Paystack webhook

```text
POST /api/webhooks/paystack
```

Financial mutations must be implemented in backend services, not directly in Express route handlers.

---

## 6. Backend Structure

```text
backend/
└── src/
    ├── config/
    ├── middleware/
    ├── routes/
    ├── controllers/
    ├── services/
    │   ├── auth/
    │   ├── pools/
    │   ├── invitations/
    │   ├── payments/
    │   ├── splits/
    │   ├── ledger/
    │   ├── withdrawals/
    │   └── notifications/
    ├── repositories/
    ├── validators/
    ├── db/
    └── lib/
```

Frontend:

```text
front-end/
└── src/
    ├── app/
    ├── components/
    ├── lib/
    ├── hooks/
    └── types/
```

---

## 7. Pool

A Pool contains:

- Owner
- Collaborators
- Invitations
- Payment links
- Transactions
- Split configurations
- Split snapshots
- Allocations
- Ledger entries
- Withdrawal requests
- Audit events

Roles:

```text
OWNER
MEMBER
```

---

## 8. Invitation System

Two invitation methods exist.

### Invite code

```text
Owner
→ Generate code
→ Share code
→ Collaborator enters code
→ Membership created
```

Codes should be unique, non-guessable, revocable and optionally expirable.

### Email

```text
Owner enters email
→ Invitation created
→ Google SMTP sends email
→ Recipient opens token
→ Existing account? join
→ No account? register
→ Invitation automatically accepted
```

Invitation tokens must be secure and expirable.

---

## 9. Payment Link and Checkout

Payment links are generated before the final payment amount is known.

The public link identifies the Pool.

```text
https://splitpay.example/pay/{token}
```

The client:

- Does not need an account.
- Does not need to join the Pool.
- Uses the public checkout.
- Pays through Paystack.

---

## 10. Payment Flow

```text
Client
→ Next.js public checkout
→ Express API
→ Paystack
→ Callback/webhook
→ Express verification
→ Transaction confirmed
→ Ledger updated
→ Creator notification
```

The browser redirect is never the authoritative proof of payment.

The Express backend verifies the payment and processes Paystack webhooks.

---

## 11. Payment States

Current MVP:

```text
PENDING
SUCCESS
FAILED
```

Refund/reversal handling is outside the current scope.

---

## 12. Split Engine

Splitting happens after payment confirmation.

### Equal

```text
Distributable Amount ÷ Eligible Members
```

### Custom

Creator supplies percentages.

```text
A = 40%
B = 30%
C = 20%
D = 10%

Total = 100%
```

The backend validates the total exactly.

All monetary calculations use integer minor units where appropriate.

---

## 13. Fees and Tax

```text
Gross Payment
→ Provider Fee
→ Platform Fee
→ Tax
→ Distributable Amount
→ Collaborator Allocations
```

Fee and tax rules are backend configuration, not frontend business logic.

---

## 14. Split Snapshot

When a split is applied to a transaction, create an immutable snapshot.

Changing the current Pool split must never modify historical allocations.

---

## 15. Ledger

The ledger is the financial source of truth.

Events include:

- Payment received
- Provider fee
- Platform fee
- Tax
- Allocation
- Withdrawal reservation
- Withdrawal completion
- Withdrawal failure/release

Balances are derived from ledger state rather than trusted mutable client values.

---

## 16. Withdrawal

```text
Member balance
→ Request
→ Validate
→ Reserve
→ Paystack transfer
→ Verify
→ Complete/release
```

States:

```text
PENDING
PROCESSING
SUCCESS
FAILED
```

Withdrawal processing is idempotent.

---

## 17. Database

Core tables:

```text
users
pools
pool_members
pool_invitations

payment_links
transactions
transaction_events

split_configurations
split_snapshots
split_allocations

ledger_accounts
ledger_entries

withdrawals
withdrawal_events

notifications
audit_logs
```

Prisma manages schemas and migrations.

---

## 18. Authorization

Every protected API operation checks:

```text
Authenticated user
→ Pool membership/resource ownership
→ Role
→ Operation
```

Never trust Pool IDs or member IDs supplied by the client.

---

## 19. Email

Google SMTP handles transactional email.

Initial types:

- Pool invitation
- Payment received
- Split configured
- Withdrawal requested
- Withdrawal completed
- Withdrawal failed

---

## 20. Validation & Idempotency

Server-side validation is required for:

- Authentication
- Invitations
- Payment amounts
- Percentages
- Withdrawal amounts
- Provider events

Idempotency is required for:

- Payment processing
- Webhooks
- Ledger mutations
- Withdrawal processing

Use unique provider references and database constraints where appropriate.

---

## 21. Audit Trail

Important events should record:

- Actor
- Action
- Resource
- Timestamp
- Relevant metadata

Examples:

```text
Pool created
Member invited
Member joined
Payment link created
Payment received
Split configured
Allocation created
Withdrawal requested
Withdrawal completed
Withdrawal failed
```

---

## 22. Deployment

### Frontend

```text
front-end → Vercel
```

### Backend

```text
backend → Node-compatible production environment
```

If the API is deployed through Vercel, the Express app must be configured using the appropriate serverless entry/adapter rather than assuming a persistent Node server.

### Environment variables

```text
DATABASE_URL
PAYSTACK_SECRET_KEY
PAYSTACK_PUBLIC_KEY
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
AUTH_SECRET
WEB_URL
API_URL
```

Secrets are server-only.

---

## 23. Security

- Server-side authorization
- Secure authentication
- Secure invitation tokens
- Paystack webhook signature verification
- Server-side payment verification
- Input validation
- Rate limiting on public endpoints
- Secure cookies/tokens
- No secret keys in frontend bundles
- Audit financial operations
- Idempotent money movement

---

## 24. Scope

### Included

- Pools
- Authentication
- Invite codes
- Email invitations
- Automatic invitation completion
- Public payment links
- Guest checkout
- Paystack payments
- Payment verification
- Webhooks
- Equal splits
- Custom splits
- Platform fees
- Tax
- Split snapshots
- Internal ledger
- Allocations
- Withdrawals
- Notifications
- Audit logs
- Next.js frontend
- Express backend
- Monorepo architecture

### Excluded

- Refunds
- Reversals
- Multi-currency
- Country-specific payout systems

---

## 25. Engineering Principle

```text
Collect
→ Verify
→ Record
→ Calculate
→ Allocate
→ Distribute
→ Audit
```

The frontend presents state.

The Express backend owns application and financial mutations.

The ledger owns financial truth.
