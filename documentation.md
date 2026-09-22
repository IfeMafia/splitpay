# Splitpay Technical Documentation

**Version:** 2.0\
**Status:** Active technical specification\
**Stack:** Next.js, TypeScript, PostgreSQL, Drizzle ORM, Paystack,
Google SMTP, Vercel

------------------------------------------------------------------------

## 1. Overview

Splitpay is a payment distribution platform for collaborative work.

A **Pool** represents a collaborative project where multiple members are
entitled to portions of client payments.

The core flow is:

> Create Pool → Add Collaborators → Generate Payment Link → Client Pays
> → Payment Confirmed → Configure Split → Calculate Allocations →
> Members Withdraw

The client does not need a Splitpay account to make a payment.

The system owns the payment record, split calculation, internal ledger,
withdrawal state, and audit history.

------------------------------------------------------------------------

## 2. Architecture

``` text
                         SPLITPAY
                            |
                     Next.js App Router
                            |
             +--------------+--------------+
             |                             |
       Authenticated                    Public
         Dashboard                    Checkout Page
             |                             |
             +--------------+--------------+
                            |
                     Application Layer
                            |
       +--------------------+--------------------+
       |                    |                    |
   Pool Service        Payment Service       Split Service
       |                    |                    |
       |                 Paystack                |
       |                    |                    |
       +--------------------+--------------------+
                            |
                       Ledger Service
                            |
                        PostgreSQL
                            |
                       Drizzle ORM
```

### Infrastructure

-   Next.js App Router for frontend and backend.
-   TypeScript throughout the application.
-   PostgreSQL as the primary database.
-   Drizzle ORM for database access and migrations.
-   Paystack for payment collection and supported transfers.
-   Google SMTP for transactional email.
-   Vercel for deployment.

------------------------------------------------------------------------

## 3. Application Boundaries

### Web application

Handles:

-   Authentication
-   Pool dashboard
-   Pool creation
-   Collaborator management
-   Split configuration
-   Payment-link management
-   Balance and transaction views
-   Withdrawal requests
-   Notifications
-   Public payment checkout

### Server-side application logic

Handles:

-   Authorization
-   Pool membership
-   Invitation processing
-   Payment initialization
-   Payment verification
-   Webhook processing
-   Split calculations
-   Ledger operations
-   Withdrawal validation
-   Audit logging

All financial state changes must happen server-side.

------------------------------------------------------------------------

## 4. Pool

A Pool is the main collaborative container.

A Pool contains:

-   Creator/owner
-   Collaborators
-   Invitations
-   Payment links
-   Transactions
-   Split configurations
-   Split snapshots
-   Member allocations
-   Ledger entries
-   Withdrawal requests
-   Audit events

The creator owns the Pool and controls its configuration.

------------------------------------------------------------------------

## 5. Collaborator Management

There are two invitation methods.

### 5.1 Invite Code

The creator generates or receives a Pool invite code.

``` text
Creator
  ↓
Generate invite code
  ↓
Share code
  ↓
User enters code
  ↓
Membership created
```

Invite codes should be:

-   Unique
-   Non-guessable
-   Associated with one Pool
-   Revocable
-   Optionally expirable

### 5.2 Email Invitation

The creator enters a collaborator's email address.

``` text
Creator enters email
        ↓
Invitation created
        ↓
Google SMTP sends email
        ↓
Recipient opens invitation
        ↓
Existing account?
   ┌────┴────┐
  YES       NO
   |         |
 Join      Sign up
 Pool        |
   |         ↓
   +---- Automatically join Pool
```

The invitation token must be securely generated and should expire.

If the email already belongs to an account, accepting the invitation
adds that account to the Pool.

If the email does not belong to an account, registration with that email
completes the invitation automatically.

------------------------------------------------------------------------

## 6. Payment Links

The creator can generate a payment link for a Pool before knowing the
eventual payment amount.

The payment link identifies the Pool and opens a public checkout page.

Example:

``` text
https://splitpay.example/pay/{public_token}
```

The payment page is unauthenticated.

The client does not need:

-   An account
-   Login
-   Registration
-   Pool membership

The client only needs to complete payment.

------------------------------------------------------------------------

## 7. Client Payment Flow

``` text
Client opens payment link
        ↓
Public checkout page
        ↓
Payment amount entered/confirmed
        ↓
Paystack checkout
        ↓
Payment completed
        ↓
Client redirected back
        ↓
Payment confirmation displayed
        ↓
Creator notified
        ↓
Server verifies payment
        ↓
Transaction recorded
        ↓
Pool ledger updated
```

The frontend callback is not the source of truth.

The backend verifies the payment with Paystack and processes the
webhook.

------------------------------------------------------------------------

## 8. Paystack Integration

Paystack is responsible for payment collection and supported money
movement.

### Payment initialization

The server creates a Paystack transaction with:

-   Amount
-   Currency
-   Customer information where required
-   Pool/payment-link reference
-   Internal transaction reference

The Paystack reference must be stored.

### Payment verification

After payment:

1.  Receive callback.
2.  Verify the transaction server-side.
3.  Process the Paystack webhook.
4.  Confirm the transaction state.
5.  Update the internal transaction.
6.  Create corresponding ledger entries.
7.  Notify the Pool creator.

### Webhooks

Webhook handling must:

-   Verify Paystack signature.
-   Be idempotent.
-   Reject invalid events.
-   Handle duplicate events.
-   Persist relevant events.
-   Never create duplicate ledger entries.
-   Never create duplicate withdrawals.

------------------------------------------------------------------------

## 9. Payment State Machine

Recommended states:

``` text
PENDING
  |
  +--> SUCCESS
  |
  +--> FAILED
```

A successful payment enters the Pool's available/distributable balance.

Refund and reversal handling are intentionally outside the current
scope.

------------------------------------------------------------------------

## 10. Split Configuration

Splitting happens after the client payment is received.

There are two modes.

### 10.1 Equal Split

The distributable amount is divided equally between eligible Pool
members.

Example:

``` text
₦100,000
4 members

Member A = 25%
Member B = 25%
Member C = 25%
Member D = 25%
```

### 10.2 Custom Split

The creator assigns a percentage to each member.

Example:

``` text
A = 40%
B = 30%
C = 20%
D = 10%

Total = 100%
```

The server must validate that the percentages total exactly 100%.

------------------------------------------------------------------------

## 11. Fees and Tax

The financial calculation must distinguish:

``` text
Gross Payment
    ↓
Payment Provider Fees
    ↓
Platform Fee
    ↓
Tax
    ↓
Distributable Amount
    ↓
Collaborator Allocations
```

The exact fee and tax rules should be configurable rather than
hard-coded into the frontend.

All monetary values should be handled using integer minor units where
appropriate, such as kobo for NGN.

Never use JavaScript floating-point arithmetic for financial
calculations.

------------------------------------------------------------------------

## 12. Split Snapshot

A split configuration can change over time.

Historical transactions must never change because a creator edits the
Pool's current split.

Therefore, when a transaction is assigned a split, the system creates an
immutable snapshot.

Example:

``` text
Current configuration:
A 50%
B 25%
C 25%

Transaction #123 snapshot:
A 50%
B 25%
C 25%
```

If the current configuration later becomes:

``` text
A 40%
B 30%
C 30%
```

Transaction #123 remains 50/25/25.

------------------------------------------------------------------------

## 13. Ledger

The ledger is the financial source of truth inside Splitpay.

Do not rely only on a mutable `balance` field.

Ledger records should represent financial events such as:

-   Payment received
-   Platform fee
-   Tax
-   Allocation created
-   Withdrawal requested
-   Withdrawal reserved
-   Withdrawal completed
-   Withdrawal failed

A derived balance can be calculated from ledger entries.

------------------------------------------------------------------------

## 14. Withdrawal Flow

After allocation, members can request withdrawal.

``` text
Member balance
      ↓
Request withdrawal
      ↓
Validate available balance
      ↓
Reserve funds
      ↓
Create withdrawal
      ↓
Paystack transfer
      ↓
Success / failure
      ↓
Finalize ledger
```

The same funds must never be withdrawable twice.

Withdrawal processing must be idempotent.

------------------------------------------------------------------------

## 15. Database Model

Core tables:

``` text
users
pools
pool_members
pool_invitations

payment_links
transactions
transaction_events

split_configurations
split_allocations
split_snapshots

ledger_accounts
ledger_entries

withdrawals
withdrawal_events

notifications
audit_logs
```

### Users

Stores application accounts and authentication-related information.

### Pools

Stores collaborative projects.

### Pool Members

Associates users with Pools and stores membership information.

### Pool Invitations

Stores invite-code and email invitations.

### Payment Links

Stores public payment-link identifiers and configuration.

### Transactions

Stores client payment records.

### Transaction Events

Stores payment-provider events and webhook processing information.

### Split Configurations

Stores the current split rules for a Pool.

### Split Snapshots

Stores immutable split rules used by a specific transaction.

### Split Allocations

Stores how much each member is entitled to from a transaction.

### Ledger Accounts

Represents financial accounts/balances inside the platform.

### Ledger Entries

Stores immutable financial movements.

### Withdrawals

Stores member withdrawal requests and their state.

### Withdrawal Events

Stores provider events associated with withdrawals.

### Notifications

Stores in-app notification state.

### Audit Logs

Stores important user and system actions.

------------------------------------------------------------------------

## 16. Authorization

Every authenticated Pool operation must verify:

``` text
Authenticated user
        ↓
Pool membership
        ↓
Required role/permission
        ↓
Operation
```

The creator must not be able to access another Pool simply by changing
an ID in a URL.

All resource ownership checks happen server-side.

------------------------------------------------------------------------

## 17. Suggested Pool Roles

Initial roles:

``` text
OWNER
MEMBER
```

The OWNER can:

-   Update Pool
-   Invite collaborators
-   Generate payment links
-   Configure splits
-   View Pool financial information
-   Manage withdrawals where applicable

MEMBER can:

-   View Pool
-   View their allocations
-   View relevant transactions
-   Configure their payout information
-   Request withdrawal

------------------------------------------------------------------------

## 18. API / Server Actions

The implementation can use Next.js Route Handlers and/or Server Actions.

Suggested domain endpoints/actions:

``` text
/auth/*
/pools
/pools/:id
/pools/:id/members
/pools/:id/invitations
/pools/:id/payment-links
/pools/:id/splits
/pools/:id/transactions
/pools/:id/withdrawals

/pay/:token

/webhooks/paystack
```

Financial mutations should have explicit service-layer functions rather
than embedding business logic inside UI components.

------------------------------------------------------------------------

## 19. Suggested Project Structure

``` text
src/
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   ├── pools/
│   ├── pay/
│   └── api/
│       └── webhooks/
│           └── paystack/
│
├── components/
│
├── db/
│   ├── schema/
│   ├── migrations/
│   └── index.ts
│
├── lib/
│   ├── auth/
│   ├── paystack/
│   ├── email/
│   ├── validation/
│   └── utils/
│
├── services/
│   ├── pools/
│   ├── invitations/
│   ├── payments/
│   ├── splits/
│   ├── ledger/
│   ├── withdrawals/
│   └── notifications/
│
└── types/
```

------------------------------------------------------------------------

## 20. Email

Google SMTP is used for transactional emails.

Initial email types:

-   Pool invitation
-   Invitation/account completion
-   Payment received
-   Split configured
-   Withdrawal requested
-   Withdrawal completed
-   Withdrawal failed

Email sending must happen server-side.

------------------------------------------------------------------------

## 21. Validation

Use schema validation at the server boundary.

Validate:

-   Email addresses
-   Pool data
-   Invite codes
-   Payment amounts
-   Percentages
-   Currency
-   Withdrawal amounts
-   Provider webhook payloads

Client validation improves UX; server validation protects the system.

------------------------------------------------------------------------

## 22. Idempotency

Idempotency is required for:

-   Payment initialization where applicable
-   Payment verification
-   Webhooks
-   Ledger creation
-   Withdrawal creation
-   Paystack transfer processing

Provider references and internal idempotency keys should have unique
database constraints where appropriate.

------------------------------------------------------------------------

## 23. Audit Trail

Audit logs should capture important actions:

``` text
Pool created
Member invited
Member joined
Payment link created
Payment received
Split configured
Split snapshot created
Withdrawal requested
Withdrawal completed
Withdrawal failed
```

Each event should include:

-   Actor
-   Action
-   Resource
-   Timestamp
-   Relevant metadata

------------------------------------------------------------------------

## 24. Deployment

Deployment target: **Vercel**.

Production infrastructure includes:

``` text
Vercel
  |
Next.js
  |
PostgreSQL
  |
Paystack
  |
Google SMTP
```

Environment variables must contain secrets such as:

``` text
DATABASE_URL
PAYSTACK_SECRET_KEY
PAYSTACK_PUBLIC_KEY
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
AUTH_SECRET
APP_URL
```

Secrets must never be exposed to client-side code.

------------------------------------------------------------------------

## 25. Security Requirements

-   Hash/password security through the chosen authentication solution.
-   Secure invitation tokens.
-   Authorization on every protected resource.
-   Paystack webhook signature verification.
-   Server-side payment verification.
-   CSRF protections where applicable.
-   Rate limiting for public endpoints.
-   Input validation.
-   Secure HTTP cookies.
-   No secret keys in client bundles.
-   Audit important financial operations.

------------------------------------------------------------------------

## 26. Current Scope

### Included

-   Pools
-   Authentication
-   Invite codes
-   Email invitations
-   Automatic invitation completion after registration
-   Public payment links
-   Guest checkout
-   Paystack payments
-   Payment verification
-   Webhooks
-   Equal splits
-   Custom splits
-   Platform fees
-   Tax
-   Split snapshots
-   Internal ledger
-   Member allocations
-   Withdrawals
-   Notifications
-   Audit logs
-   Vercel deployment

### Excluded

-   Refunds
-   Reversals
-   Multi-currency
-   Country-specific payout systems

------------------------------------------------------------------------

## 27. Core Engineering Principle

The system should treat money movement as a sequence of immutable events
rather than mutable balances.

The fundamental financial chain is:

``` text
Payment
  ↓
Verified Transaction
  ↓
Ledger Entry
  ↓
Fee/Tax Calculation
  ↓
Distributable Balance
  ↓
Split Snapshot
  ↓
Member Allocation
  ↓
Withdrawal
  ↓
Ledger Finalization
```

This keeps payment state, entitlement, and payout state separate and
auditable.
