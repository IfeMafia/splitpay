# Splitpay Product Requirements Document

**Version:** 3.0  
**Status:** Active  
**Product:** Splitpay  
**Architecture:** Next.js frontend + Node.js/Express backend monorepo  
**Database:** PostgreSQL + Prisma ORM  
**Payments:** Paystack  
**Email:** Google SMTP

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

## 1. Product Summary

Splitpay is a payment distribution platform for collaborative projects.

A creator creates a **Pool**, adds collaborators, generates a payment link and sends it to a client.

The client pays without creating a Splitpay account.

After the payment is confirmed, the Pool creator configures how the received money should be distributed using either:

- Equal split
- Custom percentage split

Splitpay calculates collaborator entitlements, records allocations and allows members to request withdrawals.

### Core proposition

> One Pool. One client payment. Multiple collaborators. Clear distribution.

---

## 2. Product Architecture

Splitpay is a monorepo containing:

```text
front-end
  Next.js frontend

backend
  Node.js + Express backend

packages/shared
  Shared types/contracts
```

The frontend communicates with the Express API over HTTP.

The Express API owns authentication, authorization, application logic, payment processing, split calculation, financial operations and integrations.

---

## 3. Problem

Collaborative projects often have multiple people entitled to portions of one client payment.

Without a dedicated workflow, someone must:

- Calculate everyone's share.
- Make multiple transfers.
- Track who has been paid.
- Communicate payment status.
- Resolve calculation mistakes.
- Maintain records.

Splitpay turns this into a structured workflow.

---

## 4. Product Goal

Allow teams to:

1. Create a Pool.
2. Add collaborators.
3. Generate a payment link.
4. Collect a client payment.
5. Configure the distribution.
6. Calculate member entitlements.
7. Track financial records.
8. Allow members to request withdrawals.

---

## 5. Target Users

### Primary

- Musicians
- Producers
- Videographers
- Editors
- Designers
- Photographers
- Writers
- Freelancers
- Small creative teams

### Secondary

- Agencies
- Event teams
- Small project teams
- Collaborative businesses

---

## 6. Core Concepts

### Pool

The central workspace for one collaborative project.

### Collaborator

A user who belongs to a Pool and may receive an allocation.

### Payment Link

A public link allowing a client to pay into a Pool.

### Split

The distribution rule applied to a confirmed payment.

### Allocation

The amount a collaborator is entitled to receive.

### Withdrawal

A request to receive available allocated funds.

---

## 7. User Journey

```text
Creator signs in
→ Creates Pool
→ Adds collaborators
→ Generates payment link
→ Sends link to client
→ Client pays without account
→ Payment confirmed
→ Creator sees payment
→ Creator chooses Equal or Custom
→ System calculates allocations
→ Members see available amounts
→ Member requests withdrawal
→ System processes payout
```

---

## 8. Pool Requirements

Creator can:

- Create Pool.
- Name Pool.
- Add description.
- View members.
- Invite collaborators.
- Generate payment link.
- View transactions.
- Configure split after payment.

Creator becomes `OWNER`.

---

## 9. Collaborator Requirements

Collaborators can join using:

### Invite code

```text
Enter code
→ Validate
→ Join Pool
```

### Email invitation

Existing account:

```text
Open invitation
→ Authenticate
→ Accept
→ Join Pool
```

New account:

```text
Open invitation
→ Register using invited email
→ Account created
→ Invitation automatically accepted
→ Join Pool
```

---

## 10. Payment Link Requirements

A Pool owner can generate a public payment link before knowing the eventual payment amount.

The link:

- Is unique.
- Identifies the Pool.
- Does not require authentication.
- Opens public checkout.
- Can be copied and shared.

---

## 11. Client Checkout

The client does not need:

- Splitpay account
- Login
- Registration
- Pool membership

The checkout provides:

- Public Pool/project information.
- Payment amount.
- Paystack payment option.
- Processing state.
- Success/failure state.
- Payment reference after confirmation.

---

## 12. Payment Confirmation

A browser redirect is not sufficient proof.

The Express backend must verify the payment with Paystack and process the webhook.

After confirmation:

- Transaction becomes successful.
- Financial records update.
- Creator is notified.
- Payment becomes eligible for distribution.

---

## 13. Split Modes

### Equal

Distribute the eligible distributable amount equally.

### Custom

Creator defines percentages.

Example:

```text
A = 40%
B = 30%
C = 20%
D = 10%

Total = 100%
```

The backend must reject totals other than 100%.

---

## 14. Fees and Tax

The financial model is:

```text
Gross payment
- Provider fee
- Platform fee
- Tax
= Distributable amount
```

Exact fee/tax values are backend configuration.

The frontend displays the resulting values but does not own the authoritative calculation.

---

## 15. Balance and Distribution

Creator can view:

- Total received
- Provider fees
- Platform fees
- Tax
- Distributable amount
- Allocated amount
- Remaining amount
- Transactions

Collaborators can view:

- Their allocations
- Available withdrawal balance
- Withdrawal history

---

## 16. Withdrawal

A collaborator can request available funds.

The system:

1. Validates amount.
2. Checks available balance.
3. Reserves funds.
4. Creates withdrawal.
5. Processes payout.
6. Updates ledger.
7. Displays status.

States:

```text
PENDING
PROCESSING
SUCCESS
FAILED
```

---

## 17. Notifications

Important events:

### Creator

- Collaborator joined.
- Client payment received.
- Split configured.
- Withdrawal requested.
- Withdrawal completed/failed.

### Collaborator

- Added to Pool.
- Allocation created.
- Withdrawal status changed.

### Client

- Payment confirmation in checkout.

---

## 18. Functional Requirements

### FR-01 Authentication
Users can register and authenticate.

### FR-02 Pool Creation
Authenticated users can create Pools.

### FR-03 Collaborator Invitation
Owners can invite collaborators through code and email.

### FR-04 Invitation Completion
New users automatically join the Pool after invitation registration.

### FR-05 Payment Link
Owners can generate public payment links.

### FR-06 Guest Checkout
Clients can pay without authentication.

### FR-07 Payment Processing
Payments use Paystack.

### FR-08 Payment Verification
Successful payments are verified server-side.

### FR-09 Equal Split
System supports equal distribution.

### FR-10 Custom Split
System supports custom percentage distribution.

### FR-11 Split Validation
Custom split totals must equal 100%.

### FR-12 Fee/Tax Calculation
System calculates fees/tax before distributable amount.

### FR-13 Snapshot
Applied split configuration is immutable for historical transactions.

### FR-14 Ledger
Financial changes are recorded in an internal ledger.

### FR-15 Withdrawal
Members can request available funds.

### FR-16 Notifications
Relevant users receive important event notifications.

### FR-17 Audit
Important actions are auditable.

---

## 19. Non-Functional Requirements

### Security

- Server-side authorization.
- Secure authentication.
- Secure invitation tokens.
- Webhook signature verification.
- No financial mutation from untrusted client state.
- Server-only secrets.

### Reliability

- Idempotent webhook processing.
- Idempotent financial operations.
- Immutable split snapshots.
- Transactional ledger operations.

### Performance

- Responsive dashboard.
- Fast public checkout.
- Efficient API/database queries.

### Auditability

Important financial events must have traceable records.

---

## 20. Out of Scope

- Refunds
- Reversals
- Multi-currency
- Country-specific payout systems

---

## 21. MVP Success Criteria

The MVP succeeds when this flow works end-to-end:

```text
Creator creates Pool
→ Invites collaborators
→ Generates payment link
→ Client pays without account
→ Paystack confirms payment
→ Express API records payment
→ Creator sees payment
→ Creator chooses Equal or Custom split
→ System calculates allocations
→ Collaborators see balances
→ Collaborator requests withdrawal
→ Paystack processes withdrawal
→ Ledger records final state
→ Relevant records are visible
```

---

## 22. Product Principle

Splitpay does not decide what percentage a collaborator deserves.

The Pool creator/collaborators determine the agreement.

Splitpay's responsibility is:

> Collect → Verify → Record → Calculate → Allocate → Distribute → Audit.

---

## 23. Future Direction

The architecture can later support:

- Additional payment providers.
- Additional payout providers.
- Receipts.
- Analytics.
- API integrations.
- More notification channels.
- Cross-border capabilities.

These are not required for the current MVP.
