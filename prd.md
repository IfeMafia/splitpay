# Splitpay Product Requirements Document

**Version:** 2.0\
**Status:** Active\
**Product:** Splitpay\
**Primary stack:** Next.js, PostgreSQL, Drizzle ORM, Paystack, Google
SMTP, Vercel

------------------------------------------------------------------------

## 1. Product Summary

Splitpay is a payment distribution platform for collaborative projects.

A creator creates a Pool, adds collaborators, generates a payment link,
and sends it to a client. The client can pay without creating a Splitpay
account.

After the payment is confirmed, the Pool creator configures how the
received money should be distributed using either equal or custom
percentage splitting.

Splitpay calculates each collaborator's entitlement, records the
allocation, and allows members to request withdrawals.

### Core proposition

> One Pool. One client payment. Multiple collaborators. Clear
> distribution.

------------------------------------------------------------------------

## 2. Problem

Collaborative projects often have multiple people entitled to portions
of a client payment.

Without a dedicated system, the person who receives the client payment
has to:

-   Calculate everyone's share.
-   Make several transfers.
-   Keep track of who has been paid.
-   Communicate payment status.
-   Resolve calculation mistakes.
-   Maintain records.

Splitpay turns that manual process into a structured workflow.

------------------------------------------------------------------------

## 3. Product Goal

Build a simple financial coordination layer for collaborative work that
allows teams to:

1.  Create a Pool.
2.  Add collaborators.
3.  Collect a client payment.
4.  Configure how the payment should be distributed.
5.  Calculate member entitlements.
6.  Track balances and transactions.
7.  Allow members to request withdrawals.

------------------------------------------------------------------------

## 4. Target Users

### Primary

Collaborative creators and project teams:

-   Musicians
-   Producers
-   Videographers
-   Editors
-   Designers
-   Photographers
-   Writers
-   Freelancers
-   Small creative teams

### Secondary

-   Agencies
-   Event teams
-   Small project teams
-   Other collaborative businesses

------------------------------------------------------------------------

## 5. Core Concepts

### Pool

The central workspace representing one collaborative project.

### Collaborator

A user who belongs to a Pool and may receive part of its distributable
funds.

### Payment Link

A public link that allows a client to pay into a Pool without
authentication.

### Split

The rule used to determine how distributable funds are allocated.

### Allocation

The amount a specific collaborator is entitled to receive from a
transaction.

### Withdrawal

A request by a collaborator to receive their available funds.

------------------------------------------------------------------------

## 6. User Journey

``` text
Creator signs in
      ↓
Creates Pool
      ↓
Adds collaborators
      ↓
Generates payment link
      ↓
Sends link to client
      ↓
Client pays without signing in
      ↓
Payment confirmed
      ↓
Creator sees Pool balance
      ↓
Creator selects split mode
      ↓
Equal OR Custom
      ↓
System calculates allocations
      ↓
Members see available amounts
      ↓
Member requests withdrawal
      ↓
System processes distribution
```

------------------------------------------------------------------------

## 7. Pool Creation

The creator must be able to:

-   Create a Pool.
-   Give it a name.
-   Add a description where applicable.
-   View its members.
-   Generate a payment link.
-   Configure distribution after payment.

The creator becomes the Pool OWNER.

------------------------------------------------------------------------

## 8. Collaborator Invitations

### Method A: Invite Code

The Pool creator can generate an invite code.

A collaborator enters the code and joins the Pool after authentication.

### Method B: Email

The creator enters an email address.

Splitpay sends an invitation email.

#### Existing user

If an account exists for that email:

``` text
Open invitation
    ↓
Authenticate
    ↓
Accept invitation
    ↓
Join Pool
```

#### New user

If no account exists:

``` text
Open invitation
    ↓
Create account using invited email
    ↓
Account created
    ↓
Invitation automatically accepted
    ↓
Join Pool
```

The user should not have to manually search for the Pool again after
registration.

------------------------------------------------------------------------

## 9. Payment Link

The creator can generate a public payment link.

The link must:

-   Be unique.
-   Identify the Pool.
-   Be safe to share publicly.
-   Open without authentication.
-   Allow the client to complete payment.

The creator can copy and send the link through any communication
channel.

------------------------------------------------------------------------

## 10. Client Checkout

The client does not create a Splitpay account.

The client opens the payment link and sees a checkout page.

The checkout must provide:

-   Pool/project information appropriate for public display.
-   Payment amount.
-   Paystack payment option.
-   Payment status.
-   Confirmation after successful payment.

After payment, the client is redirected to a confirmation page.

The confirmation should provide enough information for the client to
communicate:

> Payment completed successfully.

A payment reference should be visible.

------------------------------------------------------------------------

## 11. Payment Confirmation

Splitpay must not trust the browser redirect as proof of payment.

A payment is considered successful only after server-side
verification/provider confirmation.

After confirmation:

-   Transaction becomes successful.
-   Pool financial records are updated.
-   Creator is notified.
-   The payment becomes available for distribution according to product
    rules.

------------------------------------------------------------------------

## 12. Split Modes

### Equal Split

The system divides the distributable amount equally among selected
collaborators.

Example:

``` text
₦120,000
4 collaborators

A = ₦30,000
B = ₦30,000
C = ₦30,000
D = ₦30,000
```

### Custom Split

The creator manually defines percentages.

Example:

``` text
A = 40%
B = 30%
C = 20%
D = 10%
```

The system must prevent saving a custom split unless the total equals
100%.

------------------------------------------------------------------------

## 13. Fees and Tax

The platform supports:

-   Payment provider fees
-   Splitpay platform fees
-   Tax

The system must clearly distinguish gross payment from the amount
available for collaborator distribution.

The UI should make the calculation understandable.

Example:

``` text
Gross payment
- Payment fee
- Platform fee
- Tax
= Distributable amount
```

The exact business values should be configurable.

------------------------------------------------------------------------

## 14. Balance and Distribution

After successful payment, the Pool dashboard displays financial
information.

The creator should be able to see:

-   Total received
-   Fees
-   Tax
-   Distributable amount
-   Allocated amount
-   Remaining amount
-   Transaction history

Collaborators should be able to see:

-   Their allocations
-   Available withdrawal balance
-   Withdrawal history

------------------------------------------------------------------------

## 15. Withdrawal

A collaborator can request withdrawal when they have available funds.

The system must:

-   Validate the requested amount.
-   Confirm sufficient available balance.
-   Reserve the amount.
-   Create a withdrawal record.
-   Process the payout.
-   Update the ledger.
-   Show withdrawal status.

Possible withdrawal states:

``` text
PENDING
PROCESSING
SUCCESS
FAILED
```

------------------------------------------------------------------------

## 16. Notifications

The system should notify relevant users about important events.

Initial notifications:

### Creator

-   Collaborator joined.
-   Client payment received.
-   Split configured.
-   Withdrawal requested.
-   Withdrawal completed/failed.

### Collaborator

-   Added to Pool.
-   Payment allocation created.
-   Withdrawal status changed.

### Client

The client receives a payment confirmation through the checkout
experience. Additional email receipts can be added where required.

------------------------------------------------------------------------

## 17. Functional Requirements

### FR-01 Authentication

Users must be able to create accounts and authenticate securely.

### FR-02 Pool creation

Authenticated users must be able to create Pools.

### FR-03 Collaborator invitation

Pool owners must be able to invite collaborators through invite codes
and email.

### FR-04 Invitation completion

Existing users can join directly. New users automatically join after
completing registration through an invitation.

### FR-05 Payment link

Pool owners must be able to generate public payment links.

### FR-06 Guest checkout

Clients must be able to pay without authentication.

### FR-07 Payment processing

Payments must be processed through Paystack.

### FR-08 Payment verification

Successful payments must be verified server-side.

### FR-09 Equal split

The system must support equal distribution.

### FR-10 Custom split

The system must support percentage-based custom distribution.

### FR-11 Split validation

Custom splits must equal 100%.

### FR-12 Fee/tax calculation

The system must calculate applicable fees and taxes before determining
distributable funds.

### FR-13 Snapshot

The exact split applied to a transaction must be immutable.

### FR-14 Ledger

Financial changes must be recorded in an internal ledger.

### FR-15 Withdrawal

Members must be able to request withdrawal of available funds.

### FR-16 Notifications

Relevant users must receive notifications for important events.

### FR-17 Audit

Important financial and administrative actions must be auditable.

------------------------------------------------------------------------

## 18. Non-Functional Requirements

### Security

-   Server-side authorization.
-   Secure authentication.
-   Secure invitation tokens.
-   Webhook signature verification.
-   No financial mutations from untrusted client state.
-   Secrets stored only in server environment variables.

### Reliability

-   Idempotent webhook processing.
-   Idempotent financial operations.
-   Immutable transaction snapshots.
-   Transactional database operations for ledger mutations.

### Performance

Normal dashboard and Pool operations should feel responsive.

Public payment pages should load quickly because they are directly
exposed to clients.

### Auditability

Every important financial event must have a traceable record.

------------------------------------------------------------------------

## 19. Out of Scope

The following are intentionally not part of the current product scope:

-   Refunds
-   Reversals
-   Multi-currency
-   Country-specific payout systems

------------------------------------------------------------------------

## 20. Success Criteria

The MVP is successful when a complete flow can be demonstrated:

``` text
Creator creates Pool
        ↓
Invites collaborators
        ↓
Generates payment link
        ↓
Client pays without account
        ↓
Paystack confirms payment
        ↓
Creator sees payment
        ↓
Creator chooses Equal or Custom split
        ↓
System calculates allocations
        ↓
Collaborators see their balances
        ↓
Collaborator requests withdrawal
        ↓
Withdrawal is processed
        ↓
All relevant records are visible
```

The demo should prove that the manual calculation and distribution
workflow has been replaced by a structured system.

------------------------------------------------------------------------

## 21. Product Principle

Splitpay does not decide what percentage a collaborator deserves.

The collaborators and Pool creator determine the agreement.

Splitpay's responsibility is to:

> **Collect → Record → Calculate → Allocate → Distribute → Audit.**

------------------------------------------------------------------------

## 22. Future Direction

The architecture should leave room for:

-   More payment providers.
-   More payout providers.
-   Advanced collaboration agreements.
-   Receipts.
-   Analytics.
-   API integrations.
-   Additional notification channels.
-   Cross-border capabilities.

These should not complicate the initial product unnecessarily.
