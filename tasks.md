# Splitpay — Detailed Task Assignment

## Team Roles

| Person | Primary Ownership | Review Responsibility |
|---|---|---|
| **Abraham** | Frontend + UI/UX | **Reviews all frontend work** |
| **Samkiel** | Backend application + integration | **Reviews all frontend work + selected backend work** |
| **Tobi** | Core backend + financial infrastructure | **Reviews most backend work** |

## Merge Contract

These are the agreed canonical routes/pages. Do not create alternative route names without agreement.

### Frontend Routes

```text
/                         Landing page

/signin                  Signin
/signup                  Signup

/dashboard                Overview/dashboard
/dashboard/pools          Pool list
/dashboard/notifications  Notifications
/dashboard/settings      Account/settings

/pools/new                Create Pool
/pools/[poolId]           Pool overview
/pools/[poolId]/members   Members & invitations
/pools/[poolId]/payments  Payment links + transactions
/pools/[poolId]/split     Split configuration + allocations
/pools/[poolId]/withdrawals Withdrawal management

/invitations/[token]      Invitation acceptance

/pay/[token]              Public client checkout
/pay/[token]/success      Successful payment confirmation
/pay/[token]/failed       Failed/cancelled payment state
```

### Backend API Routes

```text
/api/auth/*
/api/pools
/api/pools/[poolId]
/api/pools/[poolId]/members
/api/pools/[poolId]/invitations
/api/pools/[poolId]/payment-links
/api/pools/[poolId]/transactions
/api/pools/[poolId]/split
/api/pools/[poolId]/withdrawals

/api/invitations/[token]
/api/pay/[token]
/api/pay/[token]/initialize

/api/webhooks/paystack
```

Financial business logic belongs in `src/services/*`, not inside page
components or route handlers.

---

# ABRAHAM — FRONTEND + UI/UX

## E1 — Frontend Foundation

### Tasks
- Set up the frontend application structure.
- Create shared layout/navigation components.
- Create typography, spacing, form, button, modal, table, card and status components.
- Create responsive desktop/mobile layouts.
- Define reusable loading, empty, error and success states.
- Define the frontend component conventions so Samkiel's API integration does not require UI rewrites.

### Shared components
```text
components/ui/
components/layout/
components/forms/
components/feedback/
components/financial/
components/pools/
components/payments/
components/splits/
components/withdrawals/
```

### Review
- Samkiel reviews the frontend structure and integration boundaries.
- Abraham owns the final UI/UX decision.

---

## E2 — Authentication Pages

### `/sign-in`
Contains:
- Email
- Password
- Sign-in button
- Validation errors
- Loading state
- Authentication error
- Link to `/sign-up`

### `/sign-up`
Contains:
- Name
- Email
- Password
- Confirmation if required by auth implementation
- Registration validation
- Loading state
- Invitation-aware registration when arriving from `/invitations/[token]`

### `/dashboard/settings`
Contains:
- Profile information
- Account information
- Relevant payout/account information
- Sign-out action

### Review
- Samkiel reviews API integration.
- Samkiel verifies frontend uses the agreed auth/session contract.

---

## E3 — Dashboard Pages

### `/dashboard`
Contains:
- Total received
- Total fees
- Tax
- Distributable amount
- Allocated amount
- Available balance
- Recent transactions
- Recent Pools
- Important notifications/actions

### `/dashboard/pools`
Contains:
- Pool list
- Pool name
- Pool status
- Member count
- Financial summary
- Create Pool CTA
- Empty state

### `/dashboard/notifications`
Contains:
- Notification list
- Read/unread state
- Event type
- Timestamp
- Navigation to related Pool/resource

---

## E4 — Pool Pages

### `/pools/new`
Contains:
- Pool name
- Description
- Create button
- Validation
- Loading/error state

### `/pools/[poolId]`
Contains:
- Pool name/description
- Owner
- Member count
- Total received
- Fees
- Tax
- Distributable amount
- Allocated amount
- Remaining amount
- Payment-link CTA
- Split CTA
- Recent transactions
- Recent activity

### `/pools/[poolId]/members`
Contains:
- Member list
- Member name/email
- Role
- Invite-code section
- Email invitation form
- Pending invitations
- Invitation status
- Remove/revoke actions where permitted

### `/invitations/[token]`
Contains:
- Pool information
- Inviter
- Invitation status
- Accept invitation
- Sign-in path for existing users
- Registration path for new users
- Invalid/expired invitation state

---

## E5 — Payment Pages

### `/pools/[poolId]/payments`
Contains:
- Payment links
- Create/generate link action
- Copy link action
- Link status
- Link creation date
- Transaction history
- Payment amount
- Payment reference
- Payment status
- Payment date

### `/pay/[token]`
Public, unauthenticated.

Contains:
- Pool/public project information
- Payment amount
- Client checkout information
- Paystack payment action
- Validation errors
- Processing state
- Payment failure state

Client must not see authenticated dashboard functionality.

### `/pay/[token]/success`
Contains:
- Payment successful message
- Amount
- Payment reference
- Pool/project name where appropriate
- Timestamp
- Clear instruction that payment can be shared with the creator

### `/pay/[token]/failed`
Contains:
- Payment failed/cancelled message
- Retry action
- Payment link context

---

## E6 — Split Pages

### `/pools/[poolId]/split`
Contains:
- Eligible collaborators
- Selected split mode
- Equal split option
- Custom split option
- Percentage inputs
- Total percentage indicator
- Validation that custom split totals 100%
- Gross payment
- Provider fee
- Platform fee
- Tax
- Distributable amount
- Per-member allocation preview
- Confirm split action
- Existing/current split state
- Historical snapshot display where applicable

### Review
Samkiel reviews the split UI against the backend split contract.

---

## E7 — Financial UI

### `/pools/[poolId]`
The financial summary must clearly distinguish:
```text
Gross received
- Provider fees
- Platform fees
- Tax
= Distributable amount
```

### `/pools/[poolId]/payments`
Transaction table:
- Reference
- Amount
- Status
- Date
- Fees
- Distributable amount

### `/pools/[poolId]/split`
Allocation table:
- Collaborator
- Percentage
- Allocated amount
- Allocation status

---

## E8 — Withdrawal Pages

### `/pools/[poolId]/withdrawals`
Contains:
- Available balance
- Withdrawal amount
- Withdrawal request action
- Withdrawal history
- Status
- Requested amount
- Date
- Failure information where applicable

Collaborators must only see their own withdrawable balance/history.

---

## E9 — Frontend Integration

Abraham integrates the UI with Samkiel's APIs.

Required flows:
1. Sign up/sign in
2. Create Pool
3. Join Pool
4. Invite collaborator
5. Generate payment link
6. Public client checkout
7. Payment confirmation
8. View Pool balance
9. Configure split
10. View allocations
11. Request withdrawal
12. View withdrawal status
13. View notifications

### Review
- **Samkiel reviews every frontend PR for API correctness/integration.**
- **Abraham reviews every frontend PR for UI/UX consistency.**

---

## E10 — Frontend QA

- Component tests
- Form validation tests
- Responsive QA
- Loading/error/empty states
- Permission-state QA
- Public checkout QA
- Payment confirmation QA
- Full user journey QA

---

# SAMKIEL — BACKEND APPLICATION + INTEGRATION

## E1 — Backend Foundation

### Tasks
- Configure environment variables.
- Configure backend validation.
- Configure error handling.
- Define API response conventions.
- Define service-layer conventions.
- Create shared backend utilities.
- Define authentication/session integration boundaries.

### Structure
```text
src/services/
  pools/
  invitations/
  payments/
  splits/
  ledger/
  withdrawals/
  notifications/

src/lib/
  auth/
  paystack/
  email/
  validation/
  utils/
```

---

## E2 — Authentication & Authorization

### API
```text
/api/auth/*
```

### Tasks
- Implement authentication endpoints/actions required by the chosen auth solution.
- Implement session retrieval.
- Implement protected-route checks.
- Implement authenticated-user lookup.
- Implement Pool membership authorization.
- Implement OWNER/MEMBER authorization.
- Implement profile API.

### Rules
Every protected Pool operation must verify:
```text
Authenticated user
→ Pool membership
→ Role/permission
→ Operation
```

---

## E3 — Core Database

### Own these tables
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

### Tasks
- Define Drizzle schemas.
- Define foreign keys.
- Define unique constraints.
- Define indexes.
- Define enums/statuses.
- Create migrations.
- Create seed data.
- Create database access helpers.

Tobi owns the financial tables and reviews the financial consistency of this schema.

---

## E4 — Pool & Collaboration Backend

### API
```text
GET    /api/pools
POST   /api/pools

GET    /api/pools/[poolId]
PATCH  /api/pools/[poolId]
DELETE /api/pools/[poolId]

GET    /api/pools/[poolId]/members
POST   /api/pools/[poolId]/members

GET    /api/pools/[poolId]/invitations
POST   /api/pools/[poolId]/invitations

POST   /api/invitations/[token]
```

### Tasks
- Create Pool.
- Fetch Pool.
- Update Pool.
- Archive/delete Pool according to product rules.
- Add/remove members.
- Generate secure invite codes.
- Validate invite codes.
- Prevent duplicate membership.
- Create email invitations.
- Generate secure invitation tokens.
- Send invitation through Google SMTP.
- Accept invitations.
- Automatically attach new users after invitation registration.
- Handle expired/invalid invitations.
- Record invitation/member audit events.

---

## E5 — Payment-Link Backend

### API
```text
GET    /api/pools/[poolId]/payment-links
POST   /api/pools/[poolId]/payment-links

GET    /api/pay/[token]
POST   /api/pay/[token]/initialize
```

### Tasks
- Generate unique public payment tokens.
- Associate token with Pool.
- Validate public token.
- Create payment link.
- Disable/revoke link where supported.
- Validate payment amount.
- Prevent unauthorized management of another Pool's links.
- Create the payment initialization request used by Tobi's Paystack layer.

---

## E6 — Split Engine

### API
```text
GET  /api/pools/[poolId]/split
POST /api/pools/[poolId]/split
```

### Tasks
- Determine eligible collaborators.
- Implement equal split.
- Implement custom percentage split.
- Validate custom total = 100%.
- Calculate allocation amounts using integer minor units.
- Handle rounding deterministically.
- Calculate based on the post-fee/tax distributable amount.
- Create immutable split snapshot for the transaction.
- Prevent historical snapshot mutation.
- Create member allocation records.
- Ensure the same transaction cannot be allocated twice.

---

## E7 — Application Financial APIs

### API
```text
GET /api/pools/[poolId]/transactions
GET /api/pools/[poolId]/split
```

### Tasks
- Expose transaction history.
- Expose Pool financial summary.
- Expose allocation data.
- Expose member balance.
- Expose relevant ledger-derived values.
- Keep frontend calculations out of financial source-of-truth logic.
- Connect split engine results to Tobi's ledger.

---

## E8 — Withdrawal Application Layer

### API
```text
GET  /api/pools/[poolId]/withdrawals
POST /api/pools/[poolId]/withdrawals
```

### Tasks
- Validate authenticated member.
- Validate available balance.
- Validate withdrawal amount.
- Prevent withdrawal from another member's balance.
- Create withdrawal request through Tobi's financial service.
- Return withdrawal status/history.
- Integrate frontend with withdrawal APIs.

---

## E9 — Integration Owner

Samkiel owns the application integration across all three developers.

### Exact integration responsibility
- Define API contracts before frontend implementation.
- Keep route names and request/response shapes stable.
- Connect Abraham's frontend to backend APIs.
- Connect Tobi's financial services to Pool/split/payment flows.
- Resolve cross-domain merge conflicts.
- Verify authentication → Pool → payment → split → withdrawal flow.
- Own final integration branch/merge coordination.
- Ensure frontend never duplicates backend financial logic.

### End-to-end contract
```text
Auth
 ↓
Pool
 ↓
Members
 ↓
Payment Link
 ↓
Paystack Payment
 ↓
Verified Transaction
 ↓
Fees + Tax
 ↓
Split Configuration
 ↓
Immutable Snapshot
 ↓
Allocation
 ↓
Withdrawal
 ↓
Ledger Finalization
```

---

## E10 — Backend Testing & Documentation

- Auth tests
- Pool tests
- Invitation tests
- Payment-link tests
- Split-engine tests
- Authorization tests
- API integration tests
- End-to-end application tests
- API documentation
- Local setup documentation
- Deployment documentation

### Review
Tobi reviews the backend implementation for correctness, especially financial boundaries.
Samkiel reviews backend changes affecting application integration.

---

# TOBI — CORE BACKEND + FINANCIAL INFRASTRUCTURE

## E1 — Core Backend Infrastructure

### Tasks
- Own core backend architecture.
- Configure Drizzle/PostgreSQL connection strategy.
- Define database transaction patterns.
- Define financial service boundaries.
- Configure production backend infrastructure.
- Support Vercel deployment architecture.

---

## E2 — Backend Security Review

### Tasks
- Review authentication security.
- Review session handling.
- Review authorization boundaries.
- Review financial endpoint exposure.
- Review secret handling.
- Review public endpoint protections.

---

## E3 — Financial Database

### Own these tables
```text
ledger_accounts
ledger_entries
withdrawals
withdrawal_events
```

### Tasks
- Define financial schemas.
- Define financial indexes.
- Define financial unique constraints.
- Define ledger transaction boundaries.
- Ensure immutable financial records.
- Ensure financial operations are safe inside database transactions.
- Review Samkiel's core schema for financial consistency.

---

## E4 — Backend Architecture Review

### Tasks
- Review backend architecture.
- Review service boundaries.
- Review authorization/security.
- Review database transaction usage.
- Support Samkiel on cross-domain backend integration.

---

## E5 — Paystack & Payment Infrastructure

### API
```text
POST /api/pay/[token]/initialize

POST /api/webhooks/paystack
```

### Tasks
- Initialize Paystack transactions.
- Attach internal Pool/payment-link references.
- Verify payments server-side.
- Implement Paystack webhook handler.
- Verify webhook signatures.
- Persist transaction events.
- Implement idempotency.
- Handle duplicate/out-of-order webhook events.
- Implement payment transaction state machine.
- Handle payment failures.
- Make backend/provider confirmation the payment source of truth.
- Trigger payment-confirmed notification.

### Payment states
```text
PENDING
SUCCESSFUL
FAILED
PARTIALLY_COMPLETED
REVERSED
REFUNDED
```

Current product scope excludes refund/reversal handling, but the state model should not prevent future support.

---

## E6 — Financial Validation

### Tasks
- Review split calculations for monetary correctness.
- Review rounding behavior.
- Validate integer minor-unit arithmetic.
- Validate fee/tax ordering.
- Validate allocation totals.
- Prevent allocation of unavailable funds.
- Connect allocation creation to ledger transactions.

---

## E7 — Ledger & Financial System

### Service ownership
```text
src/services/ledger/
```

### Tasks
- Calculate provider fees.
- Calculate Splitpay platform fees.
- Calculate tax.
- Calculate distributable amount.
- Create ledger accounts.
- Record payment received.
- Record provider fee.
- Record platform fee.
- Record tax.
- Record allocation.
- Reserve withdrawal funds.
- Finalize successful withdrawal.
- Release funds after failed withdrawal.
- Derive available balances from ledger entries.
- Maintain immutable audit trail.
- Prevent double-spending.
- Make ledger operations idempotent.

### Financial chain
```text
Gross Payment
    ↓
Provider Fee
    ↓
Platform Fee
    ↓
Tax
    ↓
Distributable Amount
    ↓
Allocation
    ↓
Available Member Balance
    ↓
Withdrawal Reservation
    ↓
Withdrawal Completion
```

---

## E8 — Withdrawal Infrastructure

### API
```text
POST /api/pools/[poolId]/withdrawals
```

### Tasks
- Validate available balance.
- Reserve requested funds.
- Create withdrawal record.
- Initiate Paystack transfer.
- Verify transfer.
- Process withdrawal events.
- Implement withdrawal state machine.
- Handle successful withdrawal.
- Handle failed withdrawal.
- Finalize/release ledger entries.
- Prevent duplicate withdrawals.
- Make withdrawal processing idempotent.

### States
```text
PENDING
PROCESSING
SUCCESS
FAILED
```

---

## E9 — Backend Support

- Support Samkiel's integration work.
- Review financial endpoint performance.
- Review database transaction boundaries.
- Resolve backend integration issues involving payments/ledger/withdrawals.

---

## E10 — Financial Testing & Production

### Tests
- Paystack initialization tests
- Payment verification tests
- Webhook signature tests
- Duplicate webhook tests
- Idempotency tests
- Ledger tests
- Fee/tax tests
- Allocation tests
- Withdrawal tests
- Double-spend tests
- Transaction consistency tests

### Production
- Production Paystack configuration
- Webhook configuration
- Logging
- Error monitoring
- Database production checks
- Financial smoke tests

---

# REVIEW & MERGE RULES

## Frontend

**Abraham:** primary reviewer for UI/UX.

**Samkiel:** required reviewer for frontend API integration and backend contract correctness.

Frontend PRs should not merge until:
- UI matches the agreed page contract.
- API route matches this document.
- Request/response shape is agreed.
- Loading/error/empty states exist.
- No financial calculations are duplicated in the frontend.

## Backend

**Tobi:** primary reviewer for most backend PRs.

**Samkiel:** secondary reviewer for backend application logic and all changes affecting integration.

Backend PRs touching:
- Paystack
- Ledger
- Fees
- Tax
- Allocations
- Withdrawals
- Financial transactions

must receive **Tobi's review**.

Backend PRs touching:
- Auth
- Pools
- Invitations
- Split engine
- API contracts
- Frontend integration

should receive **Samkiel's review**.

## Cross-cutting

All three review:
- Database migrations that affect multiple domains
- Major architecture changes
- Production deployment changes
- Final end-to-end integration

---

# Definition of Done

A task is not complete when the code merely works locally.

It is complete when:

- The agreed route/service location is used.
- Database/API contracts are documented.
- Authorization is enforced server-side.
- Loading/error/empty states are handled where applicable.
- Financial operations are server-authoritative.
- Tests cover the critical behavior.
- The correct reviewer has approved the PR.
- The feature can merge without requiring another developer to rewrite its interface.
