# Splitpay — Linear Task Breakdown

## Root Documentation

All product, PRD, architecture, API, task, and engineering documentation lives in the root `docs/` folder so both `backend/` and `frontend/` can use the same source of truth.

```text
splitpay/
├── backend/
├── frontend/
├── docs/
└── package.json
```

## Team Ownership

The workload is intentionally balanced across the three members.

- **Abraham:** Frontend + UI/UX owner. Owns the Next.js pages, components, frontend state, and frontend testing.
- **Samkiel:** Backend application owner. Owns application/auth/pool/member/invitation/payment-link/split application APIs and frontend-backend integration.
- **Tobi:** Backend financial + database owner. Owns Prisma/PostgreSQL, migrations, database constraints/indexes, Paystack infrastructure, payment confirmation, ledger, fees/tax, allocations, balances, withdrawals, and the financial API routes exposing those systems.
- **Review:** Abraham's frontend work is reviewed by Samkiel. Samkiel's application backend is reviewed by Tobi. Tobi's financial/database work is reviewed by Samkiel. Review is part of engineering quality and is not a separate ownership stream.

### Ownership Rule

No member is limited to infrastructure-only work. Each member owns implementation work that reaches the product:

- Abraham ships user-facing frontend routes/pages.
- Samkiel ships application backend routes/services.
- Tobi ships financial backend routes/services **and the complete database layer**.


## A1 — Frontend Foundation

**Linear task:** Initialize and structure `frontend`.

### Work
- Configure Next.js + TypeScript.
- Configure App Router.
- Create global layout.
- Create navigation/sidebar/header.
- Create shared UI primitives.
- Create form, table, modal, card, badge and status components.
- Configure frontend environment variables.
- Create responsive desktop/mobile layout.

### Routes established
```text
/
 /signin
 /signup
 /dashboard
```

### Done when
- Web app runs independently.
- Shared UI components are reusable.
- Layout works on mobile and desktop.

---

## A2 — Authentication UI

**Linear task:** Build authentication screens.

### Routes
```text
/signin
/signup
/dashboard/settings
```

### `/signin`
- Email
- Password
- Submit
- Loading state
- Validation errors
- Auth errors
- Link to sign-up

### `/signup`
- Name
- Email
- Password
- Validation
- Loading/error states
- Invitation-aware registration state

### `/dashboard/settings`
- Profile
- Account information
- Sign out

### API integration
```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

---

## A3 — Dashboard UI

**Linear task:** Build authenticated dashboard.

### Routes
```text
/dashboard
/dashboard/pools
/dashboard/notifications
```

### `/dashboard`
- Total received
- Fees
- Tax
- Distributable amount
- Allocated amount
- Available balance
- Recent transactions
- Recent Pools
- Recent notifications/actions

### `/dashboard/pools`
- Pool cards/table
- Pool name
- Member count
- Status
- Financial summary
- Create Pool button
- Empty state

### `/dashboard/notifications`
- Notification list
- Read/unread state
- Timestamp
- Related Pool/action

---

## A4 — Pool & Member UI

**Linear task:** Build Pool management screens.

### Routes
```text
/pools/new
/pools/[poolId]
/pools/[poolId]/members
```

### `/pools/new`
- Pool name
- Description
- Create action
- Validation

### `/pools/[poolId]`
- Pool name
- Description
- Owner
- Member count
- Financial summary
- Recent transactions
- Payment-link CTA
- Split CTA

### `/pools/[poolId]/members`
- Member list
- Role
- Email
- Invite code section
- Generate/copy code
- Email invitation form
- Pending invitations
- Revoke/remove actions where allowed

---

## A5 — Invitation UI

**Linear task:** Build collaborator invitation acceptance.

### Route
```text
/invitations/[token]
```

### Page states
- Valid invitation
- Expired invitation
- Invalid invitation
- Already accepted
- Existing user → sign in → accept
- New user → sign up → automatic acceptance

### UI
- Pool name
- Inviter
- Invitation email
- Accept button
- Sign-in CTA
- Sign-up CTA
- Success/error states

---

## A6 — Payment & Checkout UI

**Linear task:** Build payment-link and public checkout experience.

### Routes
```text
/pools/[poolId]/payments
/pay/[token]
/pay/[token]/success
/pay/[token]/failed
```

### `/pools/[poolId]/payments`
- Generate payment link
- Copy link
- Active/disabled status
- Link creation date
- Transaction list
- Amount
- Reference
- Status
- Date

### `/pay/[token]`
Public, no authentication:
- Pool/public payment information
- Amount
- Checkout action
- Paystack redirect/checkout state
- Error state

### `/pay/[token]/success`
- Success message
- Amount
- Payment reference
- Timestamp
- Share/communicate confirmation

### `/pay/[token]/failed`
- Failed/cancelled state
- Retry action

---

## A7 — Split & Allocation UI

**Linear task:** Build split configuration and allocation screens.

### Route
```text
/pools/[poolId]/split
```

### Page
- Eligible collaborators
- Equal/custom selector
- Percentage inputs
- Total percentage indicator
- 100% validation
- Gross payment
- Provider fee
- Platform fee
- Tax
- Distributable amount
- Per-member allocation preview
- Confirm split
- Current split
- Historical snapshot information

### Rules
- Frontend validates for UX.
- Backend remains source of truth.
- Do not calculate authoritative financial values only on the client.

---

## A8 — Balance & Transaction UI

**Linear task:** Build financial visibility.

### Routes
```text
/pools/[poolId]
/pools/[poolId]/payments
```

### Financial display
```text
Gross received
- Provider fees
- Platform fees
- Tax
= Distributable amount
```

### Transaction table
- Reference
- Amount
- Status
- Date
- Provider fee
- Platform fee
- Tax
- Distributable amount

### Allocation table
- Collaborator
- Percentage
- Amount
- Status

---

## A9 — Withdrawal UI

**Linear task:** Build collaborator withdrawal experience.

### Route
```text
/pools/[poolId]/withdrawals
```

### Page
- Available balance
- Withdrawal amount
- Request withdrawal
- Withdrawal history
- Status
- Requested amount
- Date
- Failure reason where available

### Rules
- Member sees only their own withdrawable funds/history.
- Owner/member permissions follow backend response.

---

## A10 — Notifications, Settings & UX Polish

**Linear task:** Complete secondary product UX.

### Routes
```text
/dashboard/notifications
/dashboard/settings
```

### Work
- In-app notifications
- Read/unread state
- Notification navigation
- Account settings
- Empty states
- Loading states
- Error states
- Permission denied states
- Toasts/feedback
- Mobile polish
- Accessibility pass

---

## A11 — Frontend Testing & QA

**Linear task:** Test the complete frontend.

### Tests
- Component tests
- Form validation
- Auth flows
- Pool flows
- Invitation flows
- Public checkout
- Payment confirmation
- Split configuration
- Withdrawal
- Responsive behavior
- Error/loading/empty states

### E2E journey
```text
Sign in
→ Create Pool
→ Add members
→ Generate payment link
→ Client checkout
→ View payment
→ Configure split
→ View allocation
→ Request withdrawal
```

---

# SAMKIEL — BACKEND APPLICATION + INTEGRATION

## S1 — Backend Foundation

**Linear task:** Initialize `backend`.

### Work
- Node.js + Express + TypeScript.
- Express app/bootstrap.
- Environment configuration.
- Error middleware.
- Request validation middleware.
- API response conventions.
- Logging foundation.
- CORS configuration.
- Route registration.
- Service/repository conventions.

### Structure
```text
backend/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── validators/
│   └── lib/
```

---

## S2 — Authentication & User Backend

**Linear task:** Implement user authentication and authorization.

### Routes
```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
PATCH /api/users/me
```

### Work
- Registration.
- Login.
- Logout.
- Session/token handling.
- Current-user endpoint.
- User profile.
- Protected-route middleware.
- Role/permission helpers.
- Auth error handling.

### Authorization rule
```text
Authenticated user
→ resource ownership/membership
→ role
→ operation
```

---

## S3 — Core Database & Application Models

**Linear task:** Implement core Prisma schemas.

### Samkiel-owned tables
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
notifications
audit_logs
```

### Work
- Prisma schemas.
- Relationships.
- Foreign keys.
- Unique constraints.
- Indexes.
- Enums/statuses.
- Migrations.
- Seed data.
- Repositories/data-access helpers.

Tobi owns financial tables and reviews cross-domain consistency.

---

## S4 — Pool & Member Backend

**Linear task:** Implement Pool management APIs.

### Routes
```text
GET    /api/pools
POST   /api/pools

GET    /api/pools/:poolId
PATCH  /api/pools/:poolId
DELETE /api/pools/:poolId

GET    /api/pools/:poolId/members
POST   /api/pools/:poolId/members
DELETE /api/pools/:poolId/members/:memberId
```

### Work
- Create Pool.
- List Pools for current user.
- Fetch Pool.
- Update Pool.
- Archive/delete according to product rules.
- Add/remove members.
- Pool ownership.
- Membership authorization.
- Duplicate membership prevention.

---

## S5 — Invitation Backend

**Linear task:** Implement invite-code and email invitation flows.

### Routes
```text
POST   /api/pools/:poolId/invitations/code
POST   /api/pools/:poolId/invitations/email
GET    /api/pools/:poolId/invitations
DELETE /api/pools/:poolId/invitations/:invitationId

GET    /api/invitations/:token
POST   /api/invitations/:token/accept
```

### Work
- Secure invite-code generation.
- Code validation.
- Code expiration/revocation.
- Secure email invitation token.
- Google SMTP integration boundary.
- Existing-user acceptance.
- New-user registration completion.
- Automatic membership after registration.
- Expired/invalid invitation handling.
- Invitation audit events.

---

## S6 — Payment Link Backend

**Linear task:** Implement Pool payment-link APIs.

### Routes
```text
GET    /api/pools/:poolId/payment-links
POST   /api/pools/:poolId/payment-links
PATCH  /api/pools/:poolId/payment-links/:linkId
DELETE /api/pools/:poolId/payment-links/:linkId

GET    /api/pay/:token
POST   /api/pay/:token/initialize
```

### Work
- Generate secure public token.
- Create payment link.
- Fetch payment-link details.
- Disable/revoke link.
- Validate public token.
- Validate payment amount.
- Create internal transaction before Paystack initialization.
- Return Paystack initialization data to frontend.

Tobi owns Paystack processing after initialization.

---

## S7 — Split Engine

**Linear task:** Implement split configuration and allocation logic.

### Routes
```text
GET  /api/pools/:poolId/split
POST /api/pools/:poolId/split
```

### Work
- Determine eligible collaborators.
- Equal split.
- Custom percentage split.
- Validate total = 100%.
- Integer minor-unit arithmetic.
- Deterministic rounding.
- Calculate distributable amount.
- Create immutable split snapshot.
- Create allocation records.
- Prevent duplicate allocation.
- Associate snapshot with transaction.

Tobi reviews monetary correctness.

---

## S8 — Application Financial & Notification APIs

**Linear task:** Expose backend data required by the frontend.

### Routes
```text
GET /api/pools/:poolId/transactions
GET /api/pools/:poolId/allocations
GET /api/pools/:poolId/balance
GET /api/notifications
PATCH /api/notifications/:notificationId/read
```

### Work
- Transaction history.
- Pool financial summary.
- Allocation retrieval.
- Member balance retrieval.
- Notification retrieval.
- Read/unread notification state.
- Audit-event retrieval where required by UI.

Financial values come from Tobi's ledger services.

---

## S9 — Withdrawal Application Layer

**Linear task:** Connect the application to the withdrawal infrastructure.

### Routes
```text
GET  /api/pools/:poolId/withdrawals
POST /api/pools/:poolId/withdrawals
GET  /api/pools/:poolId/withdrawals/:withdrawalId
```

### Work
- Authenticate member.
- Validate Pool membership.
- Validate available balance from financial service.
- Validate amount.
- Create withdrawal request through Tobi's service.
- Return withdrawal status/history.
- Enforce member ownership.
- Connect withdrawal APIs to Abraham's UI.

Tobi owns actual transfer/ledger execution.

---

## S10 — Frontend ↔ Backend Integration

**Linear task:** Own the complete integration layer.

### Work
- Define request/response contracts.
- Maintain shared types in `packages/shared`.
- Connect authentication.
- Connect dashboard.
- Connect Pools.
- Connect members/invitations.
- Connect payment links.
- Connect public checkout.
- Connect payment confirmation.
- Connect split configuration.
- Connect allocations/balance.
- Connect withdrawals.
- Connect notifications.
- Standardize frontend error handling.
- Resolve API/frontend mismatches.

### Shared package
```text
packages/shared/
├── types/
├── schemas/
├── enums/
└── contracts/
```

### Critical flow
```text
Next.js
   ↓
Express API
   ↓
Application Services
   ↓
PostgreSQL / Core Backend
   ↓
Paystack / Financial Services
```

---

## S11 — Application Testing, Integration & Documentation

**Linear task:** Verify the complete application.

### Tests
- Auth API
- Pool API
- Member API
- Invitation API
- Payment-link API
- Split API
- Notification API
- Withdrawal API integration
- Authorization
- API integration
- End-to-end application flow

### Documentation
- API route documentation
- Local development setup
- Environment variables
- Integration contracts
- Deployment/application documentation

---

# TOBI — CORE BACKEND + FINANCIAL INFRASTRUCTURE

## T1 — Core Backend Architecture

**Linear task:** Own the backend infrastructure foundation.

### Work
- Define core service boundaries.
- Define repository/database transaction conventions.
- Define financial service interfaces.
- Configure PostgreSQL/Prisma connection strategy.
- Define backend infrastructure patterns.
- Establish production configuration strategy.

---

## T2 — Financial Database Layer

**Linear task:** Implement financial Prisma schemas.

### Tables
```text
ledger_accounts
ledger_entries
withdrawals
withdrawal_events
```

### Work
- Schema definitions.
- Foreign keys.
- Unique constraints.
- Financial indexes.
- Ledger entry types.
- Withdrawal states.
- Database transaction boundaries.
- Immutable financial records.

---

## T3 — Paystack Payment Infrastructure

**Linear task:** Own Paystack integration.

### Routes
```text
POST /api/pay/:token/initialize
POST /api/webhooks/paystack
```

### Work
- Paystack SDK/API integration.
- Payment initialization.
- Server-side payment verification.
- Internal reference mapping.
- Paystack reference storage.
- Webhook signature verification.
- Webhook parsing.
- Webhook event persistence.
- Duplicate-event handling.
- Idempotency.

---

## T4 — Transaction State & Payment Confirmation

**Linear task:** Own authoritative payment state.

### Work
- Payment state machine.
- Verify successful transactions.
- Handle failed transactions.
- Prevent duplicate transaction confirmation.
- Update transaction state.
- Create payment ledger event.
- Trigger creator notification.
- Ensure browser redirect is never treated as payment proof.

### States
```text
PENDING
SUCCESS
FAILED
```

Refunds/reversals remain outside current scope.

---

## T5 — Ledger System

**Linear task:** Implement the financial source of truth.

### Work
- Ledger accounts.
- Ledger entries.
- Payment entries.
- Fee entries.
- Tax entries.
- Allocation entries.
- Withdrawal reservation entries.
- Withdrawal completion entries.
- Withdrawal failure/release entries.
- Immutable event history.
- Idempotent ledger mutations.

### Financial chain
```text
Gross Payment
→ Provider Fee
→ Platform Fee
→ Tax
→ Distributable Amount
→ Allocation
→ Available Balance
→ Withdrawal Reservation
→ Withdrawal Completion
```

---

## T6 — Fees, Tax & Distributable Amount

**Linear task:** Implement server-side financial calculations.

### Work
- Provider fee calculation.
- Platform fee calculation.
- Tax calculation.
- Distributable amount calculation.
- Configurable fee/tax rules.
- Integer minor-unit arithmetic.
- Rounding rules.
- Allocation total validation.

No authoritative financial calculation should live only in the frontend.

---

## T7 — Allocation & Balance Infrastructure

**Linear task:** Connect split allocations to the ledger.

### Work
- Receive allocation output from Samkiel's split engine.
- Validate allocation totals.
- Record allocation ledger entries.
- Create/update member financial entitlement.
- Derive available balance.
- Prevent double allocation.
- Ensure allocated funds cannot be allocated again.

---

## T8 — Withdrawal Infrastructure

**Linear task:** Own actual money withdrawal processing.

### Routes
```text
POST /api/pools/:poolId/withdrawals
```

### Work
- Validate available funds.
- Reserve funds.
- Create withdrawal record.
- Initiate Paystack transfer.
- Verify transfer.
- Process transfer events.
- Update withdrawal state.
- Complete ledger entries.
- Release reservation on failure.
- Prevent duplicate withdrawal.

### States
```text
PENDING
PROCESSING
SUCCESS
FAILED
```

---

## T9 — Financial Security & Idempotency

**Linear task:** Harden all money-moving operations.

### Work
- Idempotency keys.
- Unique provider references.
- Duplicate webhook protection.
- Duplicate withdrawal protection.
- Double-spend prevention.
- Database transaction locking/atomicity where required.
- Financial authorization checks.
- Secret handling.
- Paystack signature verification.

---

## T10 — Financial Notifications & Audit Events

**Linear task:** Produce financial events for application consumption.

### Events
```text
PAYMENT_RECEIVED
PAYMENT_FAILED
ALLOCATION_CREATED
WITHDRAWAL_REQUESTED
WITHDRAWAL_SUCCESS
WITHDRAWAL_FAILED
```

### Work
- Emit financial domain events.
- Persist relevant financial audit events.
- Provide service interfaces for Samkiel's notification/application layer.
- Ensure events are emitted once.

---

## T11 — Financial Testing & Production Readiness

**Linear task:** Verify financial correctness and production behavior.

### Tests
- Paystack initialization
- Payment verification
- Webhook signature
- Duplicate webhook
- Idempotency
- Transaction state
- Fee calculation
- Tax calculation
- Ledger entries
- Allocation
- Balance
- Withdrawal
- Double-spend prevention
- Failed transfer recovery

### Production
- Payment configuration
- Webhook configuration
- Logging
- Error monitoring
- Database production checks
- Financial smoke tests

---

# REVIEW MATRIX

| Change | Reviewer |
|---|---|
| Frontend/UI | Samkiel |
| Frontend UX/design | Abraham |
| Core backend | Tobi |
| Application backend | Tobi + Samkiel where relevant |
| Auth/pools/invitations | Tobi + Samkiel |
| Split engine | Tobi + Samkiel |
| Paystack/ledger/withdrawals | Tobi |
| Frontend/backend contracts | Samkiel |
| Integration | Samkiel |
| Major architecture | Tobi + Samkiel |

---

# Dependency Order

```text
A1 + S1 + T1
     ↓
S2 + S3 + T2
     ↓
A2 + A3 + A4
     ↓
S4 + S5
     ↓
A5
     ↓
S6 + T3 + T4
     ↓
A6
     ↓
T5 + T6
     ↓
S7 + T7
     ↓
A7 + A8
     ↓
S8 + T10
     ↓
S9 + T8
     ↓
A9 + A10
     ↓
S10 Integration
     ↓
A11 + S11 + T11
```

# Definition of Done

A Linear issue is complete when:

- Its agreed route/service/schema location is implemented.
- Its API contract is documented where applicable.
- Authorization is enforced server-side.
- Loading/error/empty states exist for frontend work.
- Financial calculations are server-authoritative.
- Relevant tests exist.
- Required reviewer has approved the PR.
- No undocumented interface changes are introduced.
- The task can merge without another owner rewriting its contract.### Tobi — Database + Financial Backend

**T1 — Prisma/PostgreSQL Foundation**
- Own the complete Prisma schema.
- Database connection/configuration, migrations, indexes, constraints, relations, and seed strategy.
- Establish repository/data-access patterns used by the backend.

**T2 — Core Database Models**
- Implement users, pools, pool members, invitations, payment links, transactions, notifications, and audit-log models.
- Own all schema changes and migrations.

**T3 — Paystack Payment Infrastructure + API Routes**
- Payment initialization and provider integration.
- Paystack webhook route and signature verification.
- Server-side payment verification.
- Idempotent provider event handling.

**T4 — Payment Confirmation & Transaction State Routes**
- Payment confirmation/status endpoints.
- Transaction state machine and payment events.
- Persist immutable payment/audit events.

**T5 — Ledger API & Financial Data Layer**
- Ledger accounts and entries.
- Financial transaction posting.
- Source-of-truth ledger queries and reconciliation support.

**T6 — Fees, Tax & Distributable Amount**
- Financial calculation services and API endpoints.
- Provider fees, platform fees, tax, and distributable amount.
- Integer minor-unit arithmetic and validation.

**T7 — Allocation & Balance API Routes**
- Split allocation persistence and snapshotting.
- Allocation calculation infrastructure.
- Pool/member available-balance endpoints.
- Prevent double allocation and enforce financial invariants.

**T8 — Withdrawal API & Infrastructure**
- Withdrawal request/status routes.
- Withdrawal reservation, processing, success, and failure states.
- Financial safeguards around available balances and duplicate requests.

**T9 — Financial Security & Idempotency**
- Idempotency keys, transaction boundaries, concurrency protection, authorization checks, and financial invariant enforcement.
- Ensure backend remains the financial source of truth.

**T10 — Financial Notifications & Audit Routes**
- Payment-confirmed, allocation, and withdrawal-related events.
- Financial audit trail and notification event generation.

**T11 — Financial Testing & Production Readiness**
- Database tests, migration verification, Paystack webhook tests, ledger tests, allocation tests, withdrawal tests, idempotency/concurrency tests, and production financial checks.


## Root Documentation

All product, PRD, architecture, API, task, and engineering documentation lives in the root `docs/` folder so both `backend/` and `frontend/` can use the same source of truth.

```text
splitpay/
├── backend/
├── frontend/
├── docs/
└── package.json
```

## Team Ownership

The workload is intentionally balanced across the three members.

- **Abraham:** Frontend + UI/UX owner. Owns the Next.js pages, components, frontend state, and frontend testing.
- **Samkiel:** Backend application owner. Owns application/auth/pool/member/invitation/payment-link/split application APIs and frontend-backend integration.
- **Tobi:** Backend financial + database owner. Owns Prisma/PostgreSQL, migrations, database constraints/indexes, Paystack infrastructure, payment confirmation, ledger, fees/tax, allocations, balances, withdrawals, and the financial API routes exposing those systems.
- **Review:** Abraham's frontend work is reviewed by Samkiel. Samkiel's application backend is reviewed by Tobi. Tobi's financial/database work is reviewed by Samkiel. Review is part of engineering quality and is not a separate ownership stream.

### Ownership Rule

No member is limited to infrastructure-only work. Each member owns implementation work that reaches the product:

- Abraham ships user-facing frontend routes/pages.
- Samkiel ships application backend routes/services.
- Tobi ships financial backend routes/services **and the complete database layer**.


## A1 — Frontend Foundation

**Linear task:** Initialize and structure `frontend`.

### Work
- Configure Next.js + TypeScript.
- Configure App Router.
- Create global layout.
- Create navigation/sidebar/header.
- Create shared UI primitives.
- Create form, table, modal, card, badge and status components.
- Configure frontend environment variables.
- Create responsive desktop/mobile layout.

### Routes established
```text
/
 /signin
 /signup
 /dashboard
```

### Done when
- Web app runs independently.
- Shared UI components are reusable.
- Layout works on mobile and desktop.

---

## A2 — Authentication UI

**Linear task:** Build authentication screens.

### Routes
```text
/signin
/signup
/dashboard/settings
```

### `/signin`
- Email
- Password
- Submit
- Loading state
- Validation errors
- Auth errors
- Link to sign-up

### `/signup`
- Name
- Email
- Password
- Validation
- Loading/error states
- Invitation-aware registration state

### `/dashboard/settings`
- Profile
- Account information
- Sign out

### API integration
```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

---

## A3 — Dashboard UI

**Linear task:** Build authenticated dashboard.

### Routes
```text
/dashboard
/dashboard/pools
/dashboard/notifications
```

### `/dashboard`
- Total received
- Fees
- Tax
- Distributable amount
- Allocated amount
- Available balance
- Recent transactions
- Recent Pools
- Recent notifications/actions

### `/dashboard/pools`
- Pool cards/table
- Pool name
- Member count
- Status
- Financial summary
- Create Pool button
- Empty state

### `/dashboard/notifications`
- Notification list
- Read/unread state
- Timestamp
- Related Pool/action

---

## A4 — Pool & Member UI

**Linear task:** Build Pool management screens.

### Routes
```text
/pools/new
/pools/[poolId]
/pools/[poolId]/members
```

### `/pools/new`
- Pool name
- Description
- Create action
- Validation

### `/pools/[poolId]`
- Pool name
- Description
- Owner
- Member count
- Financial summary
- Recent transactions
- Payment-link CTA
- Split CTA

### `/pools/[poolId]/members`
- Member list
- Role
- Email
- Invite code section
- Generate/copy code
- Email invitation form
- Pending invitations
- Revoke/remove actions where allowed

---

## A5 — Invitation UI

**Linear task:** Build collaborator invitation acceptance.

### Route
```text
/invitations/[token]
```

### Page states
- Valid invitation
- Expired invitation
- Invalid invitation
- Already accepted
- Existing user → sign in → accept
- New user → sign up → automatic acceptance

### UI
- Pool name
- Inviter
- Invitation email
- Accept button
- Sign-in CTA
- Sign-up CTA
- Success/error states

---

## A6 — Payment & Checkout UI

**Linear task:** Build payment-link and public checkout experience.

### Routes
```text
/pools/[poolId]/payments
/pay/[token]
/pay/[token]/success
/pay/[token]/failed
```

### `/pools/[poolId]/payments`
- Generate payment link
- Copy link
- Active/disabled status
- Link creation date
- Transaction list
- Amount
- Reference
- Status
- Date

### `/pay/[token]`
Public, no authentication:
- Pool/public payment information
- Amount
- Checkout action
- Paystack redirect/checkout state
- Error state

### `/pay/[token]/success`
- Success message
- Amount
- Payment reference
- Timestamp
- Share/communicate confirmation

### `/pay/[token]/failed`
- Failed/cancelled state
- Retry action

---

## A7 — Split & Allocation UI

**Linear task:** Build split configuration and allocation screens.

### Route
```text
/pools/[poolId]/split
```

### Page
- Eligible collaborators
- Equal/custom selector
- Percentage inputs
- Total percentage indicator
- 100% validation
- Gross payment
- Provider fee
- Platform fee
- Tax
- Distributable amount
- Per-member allocation preview
- Confirm split
- Current split
- Historical snapshot information

### Rules
- Frontend validates for UX.
- Backend remains source of truth.
- Do not calculate authoritative financial values only on the client.

---

## A8 — Balance & Transaction UI

**Linear task:** Build financial visibility.

### Routes
```text
/pools/[poolId]
/pools/[poolId]/payments
```

### Financial display
```text
Gross received
- Provider fees
- Platform fees
- Tax
= Distributable amount
```

### Transaction table
- Reference
- Amount
- Status
- Date
- Provider fee
- Platform fee
- Tax
- Distributable amount

### Allocation table
- Collaborator
- Percentage
- Amount
- Status

---

## A9 — Withdrawal UI

**Linear task:** Build collaborator withdrawal experience.

### Route
```text
/pools/[poolId]/withdrawals
```

### Page
- Available balance
- Withdrawal amount
- Request withdrawal
- Withdrawal history
- Status
- Requested amount
- Date
- Failure reason where available

### Rules
- Member sees only their own withdrawable funds/history.
- Owner/member permissions follow backend response.

---

## A10 — Notifications, Settings & UX Polish

**Linear task:** Complete secondary product UX.

### Routes
```text
/dashboard/notifications
/dashboard/settings
```

### Work
- In-app notifications
- Read/unread state
- Notification navigation
- Account settings
- Empty states
- Loading states
- Error states
- Permission denied states
- Toasts/feedback
- Mobile polish
- Accessibility pass

---

## A11 — Frontend Testing & QA

**Linear task:** Test the complete frontend.

### Tests
- Component tests
- Form validation
- Auth flows
- Pool flows
- Invitation flows
- Public checkout
- Payment confirmation
- Split configuration
- Withdrawal
- Responsive behavior
- Error/loading/empty states

### E2E journey
```text
Sign in
→ Create Pool
→ Add members
→ Generate payment link
→ Client checkout
→ View payment
→ Configure split
→ View allocation
→ Request withdrawal
```

---

# SAMKIEL — BACKEND APPLICATION + INTEGRATION

## S1 — Backend Foundation

**Linear task:** Initialize `backend`.

### Work
- Node.js + Express + TypeScript.
- Express app/bootstrap.
- Environment configuration.
- Error middleware.
- Request validation middleware.
- API response conventions.
- Logging foundation.
- CORS configuration.
- Route registration.
- Service/repository conventions.

### Structure
```text
backend/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── validators/
│   └── lib/
```

---

## S2 — Authentication & User Backend

**Linear task:** Implement user authentication and authorization.

### Routes
```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
PATCH /api/users/me
```

### Work
- Registration.
- Login.
- Logout.
- Session/token handling.
- Current-user endpoint.
- User profile.
- Protected-route middleware.
- Role/permission helpers.
- Auth error handling.

### Authorization rule
```text
Authenticated user
→ resource ownership/membership
→ role
→ operation
```

---

## S3 — Core Database & Application Models

**Linear task:** Implement core Prisma schemas.

### Samkiel-owned tables
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
notifications
audit_logs
```

### Work
- Prisma schemas.
- Relationships.
- Foreign keys.
- Unique constraints.
- Indexes.
- Enums/statuses.
- Migrations.
- Seed data.
- Repositories/data-access helpers.

Tobi owns financial tables and reviews cross-domain consistency.

---

## S4 — Pool & Member Backend

**Linear task:** Implement Pool management APIs.

### Routes
```text
GET    /api/pools
POST   /api/pools

GET    /api/pools/:poolId
PATCH  /api/pools/:poolId
DELETE /api/pools/:poolId

GET    /api/pools/:poolId/members
POST   /api/pools/:poolId/members
DELETE /api/pools/:poolId/members/:memberId
```

### Work
- Create Pool.
- List Pools for current user.
- Fetch Pool.
- Update Pool.
- Archive/delete according to product rules.
- Add/remove members.
- Pool ownership.
- Membership authorization.
- Duplicate membership prevention.

---

## S5 — Invitation Backend

**Linear task:** Implement invite-code and email invitation flows.

### Routes
```text
POST   /api/pools/:poolId/invitations/code
POST   /api/pools/:poolId/invitations/email
GET    /api/pools/:poolId/invitations
DELETE /api/pools/:poolId/invitations/:invitationId

GET    /api/invitations/:token
POST   /api/invitations/:token/accept
```

### Work
- Secure invite-code generation.
- Code validation.
- Code expiration/revocation.
- Secure email invitation token.
- Google SMTP integration boundary.
- Existing-user acceptance.
- New-user registration completion.
- Automatic membership after registration.
- Expired/invalid invitation handling.
- Invitation audit events.

---

## S6 — Payment Link Backend

**Linear task:** Implement Pool payment-link APIs.

### Routes
```text
GET    /api/pools/:poolId/payment-links
POST   /api/pools/:poolId/payment-links
PATCH  /api/pools/:poolId/payment-links/:linkId
DELETE /api/pools/:poolId/payment-links/:linkId

GET    /api/pay/:token
POST   /api/pay/:token/initialize
```

### Work
- Generate secure public token.
- Create payment link.
- Fetch payment-link details.
- Disable/revoke link.
- Validate public token.
- Validate payment amount.
- Create internal transaction before Paystack initialization.
- Return Paystack initialization data to frontend.

Tobi owns Paystack processing after initialization.

---

## S7 — Split Engine

**Linear task:** Implement split configuration and allocation logic.

### Routes
```text
GET  /api/pools/:poolId/split
POST /api/pools/:poolId/split
```

### Work
- Determine eligible collaborators.
- Equal split.
- Custom percentage split.
- Validate total = 100%.
- Integer minor-unit arithmetic.
- Deterministic rounding.
- Calculate distributable amount.
- Create immutable split snapshot.
- Create allocation records.
- Prevent duplicate allocation.
- Associate snapshot with transaction.

Tobi reviews monetary correctness.

---

## S8 — Application Financial & Notification APIs

**Linear task:** Expose backend data required by the frontend.

### Routes
```text
GET /api/pools/:poolId/transactions
GET /api/pools/:poolId/allocations
GET /api/pools/:poolId/balance
GET /api/notifications
PATCH /api/notifications/:notificationId/read
```

### Work
- Transaction history.
- Pool financial summary.
- Allocation retrieval.
- Member balance retrieval.
- Notification retrieval.
- Read/unread notification state.
- Audit-event retrieval where required by UI.

Financial values come from Tobi's ledger services.

---

## S9 — Withdrawal Application Layer

**Linear task:** Connect the application to the withdrawal infrastructure.

### Routes
```text
GET  /api/pools/:poolId/withdrawals
POST /api/pools/:poolId/withdrawals
GET  /api/pools/:poolId/withdrawals/:withdrawalId
```

### Work
- Authenticate member.
- Validate Pool membership.
- Validate available balance from financial service.
- Validate amount.
- Create withdrawal request through Tobi's service.
- Return withdrawal status/history.
- Enforce member ownership.
- Connect withdrawal APIs to Abraham's UI.

Tobi owns actual transfer/ledger execution.

---

## S10 — Frontend ↔ Backend Integration

**Linear task:** Own the complete integration layer.

### Work
- Define request/response contracts.
- Maintain shared types in `packages/shared`.
- Connect authentication.
- Connect dashboard.
- Connect Pools.
- Connect members/invitations.
- Connect payment links.
- Connect public checkout.
- Connect payment confirmation.
- Connect split configuration.
- Connect allocations/balance.
- Connect withdrawals.
- Connect notifications.
- Standardize frontend error handling.
- Resolve API/frontend mismatches.

### Shared package
```text
packages/shared/
├── types/
├── schemas/
├── enums/
└── contracts/
```

### Critical flow
```text
Next.js
   ↓
Express API
   ↓
Application Services
   ↓
PostgreSQL / Core Backend
   ↓
Paystack / Financial Services
```

---

## S11 — Application Testing, Integration & Documentation

**Linear task:** Verify the complete application.

### Tests
- Auth API
- Pool API
- Member API
- Invitation API
- Payment-link API
- Split API
- Notification API
- Withdrawal API integration
- Authorization
- API integration
- End-to-end application flow

### Documentation
- API route documentation
- Local development setup
- Environment variables
- Integration contracts
- Deployment/application documentation

---

# TOBI — CORE BACKEND + FINANCIAL INFRASTRUCTURE

## T1 — Core Backend Architecture

**Linear task:** Own the backend infrastructure foundation.

### Work
- Define core service boundaries.
- Define repository/database transaction conventions.
- Define financial service interfaces.
- Configure PostgreSQL/Prisma connection strategy.
- Define backend infrastructure patterns.
- Establish production configuration strategy.

---

## T2 — Financial Database Layer

**Linear task:** Implement financial Prisma schemas.

### Tables
```text
ledger_accounts
ledger_entries
withdrawals
withdrawal_events
```

### Work
- Schema definitions.
- Foreign keys.
- Unique constraints.
- Financial indexes.
- Ledger entry types.
- Withdrawal states.
- Database transaction boundaries.
- Immutable financial records.

---

## T3 — Paystack Payment Infrastructure

**Linear task:** Own Paystack integration.

### Routes
```text
POST /api/pay/:token/initialize
POST /api/webhooks/paystack
```

### Work
- Paystack SDK/API integration.
- Payment initialization.
- Server-side payment verification.
- Internal reference mapping.
- Paystack reference storage.
- Webhook signature verification.
- Webhook parsing.
- Webhook event persistence.
- Duplicate-event handling.
- Idempotency.

---

## T4 — Transaction State & Payment Confirmation

**Linear task:** Own authoritative payment state.

### Work
- Payment state machine.
- Verify successful transactions.
- Handle failed transactions.
- Prevent duplicate transaction confirmation.
- Update transaction state.
- Create payment ledger event.
- Trigger creator notification.
- Ensure browser redirect is never treated as payment proof.

### States
```text
PENDING
SUCCESS
FAILED
```

Refunds/reversals remain outside current scope.

---

## T5 — Ledger System

**Linear task:** Implement the financial source of truth.

### Work
- Ledger accounts.
- Ledger entries.
- Payment entries.
- Fee entries.
- Tax entries.
- Allocation entries.
- Withdrawal reservation entries.
- Withdrawal completion entries.
- Withdrawal failure/release entries.
- Immutable event history.
- Idempotent ledger mutations.

### Financial chain
```text
Gross Payment
→ Provider Fee
→ Platform Fee
→ Tax
→ Distributable Amount
→ Allocation
→ Available Balance
→ Withdrawal Reservation
→ Withdrawal Completion
```

---

## T6 — Fees, Tax & Distributable Amount

**Linear task:** Implement server-side financial calculations.

### Work
- Provider fee calculation.
- Platform fee calculation.
- Tax calculation.
- Distributable amount calculation.
- Configurable fee/tax rules.
- Integer minor-unit arithmetic.
- Rounding rules.
- Allocation total validation.

No authoritative financial calculation should live only in the frontend.

---

## T7 — Allocation & Balance Infrastructure

**Linear task:** Connect split allocations to the ledger.

### Work
- Receive allocation output from Samkiel's split engine.
- Validate allocation totals.
- Record allocation ledger entries.
- Create/update member financial entitlement.
- Derive available balance.
- Prevent double allocation.
- Ensure allocated funds cannot be allocated again.

---

## T8 — Withdrawal Infrastructure

**Linear task:** Own actual money withdrawal processing.

### Routes
```text
POST /api/pools/:poolId/withdrawals
```

### Work
- Validate available funds.
- Reserve funds.
- Create withdrawal record.
- Initiate Paystack transfer.
- Verify transfer.
- Process transfer events.
- Update withdrawal state.
- Complete ledger entries.
- Release reservation on failure.
- Prevent duplicate withdrawal.

### States
```text
PENDING
PROCESSING
SUCCESS
FAILED
```

---

## T9 — Financial Security & Idempotency

**Linear task:** Harden all money-moving operations.

### Work
- Idempotency keys.
- Unique provider references.
- Duplicate webhook protection.
- Duplicate withdrawal protection.
- Double-spend prevention.
- Database transaction locking/atomicity where required.
- Financial authorization checks.
- Secret handling.
- Paystack signature verification.

---

## T10 — Financial Notifications & Audit Events

**Linear task:** Produce financial events for application consumption.

### Events
```text
PAYMENT_RECEIVED
PAYMENT_FAILED
ALLOCATION_CREATED
WITHDRAWAL_REQUESTED
WITHDRAWAL_SUCCESS
WITHDRAWAL_FAILED
```

### Work
- Emit financial domain events.
- Persist relevant financial audit events.
- Provide service interfaces for Samkiel's notification/application layer.
- Ensure events are emitted once.

---

## T11 — Financial Testing & Production Readiness

**Linear task:** Verify financial correctness and production behavior.

### Tests
- Paystack initialization
- Payment verification
- Webhook signature
- Duplicate webhook
- Idempotency
- Transaction state
- Fee calculation
- Tax calculation
- Ledger entries
- Allocation
- Balance
- Withdrawal
- Double-spend prevention
- Failed transfer recovery

### Production
- Payment configuration
- Webhook configuration
- Logging
- Error monitoring
- Database production checks
- Financial smoke tests

---

# REVIEW MATRIX

| Change | Reviewer |
|---|---|
| Frontend/UI | Samkiel |
| Frontend UX/design | Abraham |
| Core backend | Tobi |
| Application backend | Tobi + Samkiel where relevant |
| Auth/pools/invitations | Tobi + Samkiel |
| Split engine | Tobi + Samkiel |
| Paystack/ledger/withdrawals | Tobi |
| Frontend/backend contracts | Samkiel |
| Integration | Samkiel |
| Major architecture | Tobi + Samkiel |

---

# Dependency Order

```text
A1 + S1 + T1
     ↓
S2 + S3 + T2
     ↓
A2 + A3 + A4
     ↓
S4 + S5
     ↓
A5
     ↓
S6 + T3 + T4
     ↓
A6
     ↓
T5 + T6
     ↓
S7 + T7
     ↓
A7 + A8
     ↓
S8 + T10
     ↓
S9 + T8
     ↓
A9 + A10
     ↓
S10 Integration
     ↓
A11 + S11 + T11
```

# Definition of Done

A Linear issue is complete when:

- Its agreed route/service/schema location is implemented.
- Its API contract is documented where applicable.
- Authorization is enforced server-side.
- Loading/error/empty states exist for frontend work.
- Financial calculations are server-authoritative.
- Relevant tests exist.
- Required reviewer has approved the PR.
- No undocumented interface changes are introduced.
- The task can merge without another owner rewriting its contract.


## Task Summary — Assignee

### Abraham — Frontend + UI/UX
| ID | Task |
|---|---|
| A1 | Frontend Foundation |
| A2 | Authentication UI |
| A3 | Dashboard UI |
| A4 | Pool & Member UI |
| A5 | Invitation UI |
| A6 | Payment & Checkout UI |
| A7 | Split & Allocation UI |
| A8 | Balance & Transaction UI |
| A9 | Withdrawal UI |
| A10 | Notifications, Settings & UX Polish |
| A11 | Frontend Testing & QA |

### Samkiel — Backend Application + Integration
| ID | Task |
|---|---|
| S1 | Backend Foundation |
| S2 | Authentication API |
| S3 | Pool & Member Application API |
| S4 | Invitation API |
| S5 | Payment Link Application API |
| S6 | Split Application API |
| S7 | Pool Dashboard & Transaction API |
| S8 | Notification & User Application API |
| S9 | Application Withdrawal API |
| S10 | Frontend ↔ Backend Integration |
| S11 | Application Testing & Integration |

### Tobi — Database + Financial Backend
| ID | Task |
|---|---|
| T1 | Prisma/PostgreSQL Foundation |
| T2 | Core Database Models |
| T3 | Paystack Payment Infrastructure + API Routes |
| T4 | Payment Confirmation & Transaction State Routes |
| T5 | Ledger API & Financial Data Layer |
| T6 | Fees, Tax & Distributable Amount |
| T7 | Allocation & Balance API Routes |
| T8 | Withdrawal API & Infrastructure |
| T9 | Financial Security & Idempotency |
| T10 | Financial Notifications & Audit Routes |
| T11 | Financial Testing & Production Readiness |

**Assignment balance:** 11 tasks each. Ownership is split across frontend, application backend/integration, and database/financial backend rather than concentrating the backend workload on Samkiel.
