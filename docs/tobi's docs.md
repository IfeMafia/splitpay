# Tobi's Financial & Paystack Infrastructure Documentation

> **Role:** Backend Financial & Database Owner  
> **Subsystems Covered:** T1 – T11 (Paystack Infrastructure, Transaction State Machine, Ledger, Fee Engine, Allocations, Balance Infrastructure, Withdrawals, Webhook Idempotency, Financial Audit & Testing)  
> **Target Audience:** Frontend Engineers (Abraham), Backend Engineers (Samkiel), Code Reviewers  

---

## 📑 Table of Contents
1. [Overview & Subsystem Architecture](#1-overview--subsystem-architecture)
2. [Financial Chain & Calculation Rules](#2-financial-chain--calculation-rules)
3. [Database Schema Models](#3-database-schema-models)
4. [API Endpoints Reference](#4-api-endpoints-reference)
5. [Frontend Integration Guide (For Abraham)](#5-frontend-integration-guide-for-abraham)
6. [Testing & Environment Setup](#6-testing--environment-setup)

---

## 1. Overview & Subsystem Architecture

This module owns the complete financial lifecycle: payment checkout initialization, Paystack gateway integration, authoritative payment confirmation, split snapshotting, minor-unit financial ledger calculations, pool balance tracking, member payout calculations, and withdrawal processing.

```text
┌─────────────────┐       ┌────────────────────┐       ┌────────────────────────┐
│ Client Browser  │  ───> │  Paystack Gateway  │  ───> │ Webhook / Verification │
└─────────────────┘       └────────────────────┘       └────────────────────────┘
                                                                   │
                                                                   ▼
                                                       ┌────────────────────────┐
                                                       │ Authoritative Ledger   │
                                                       │ Payment Verification   │
                                                       └────────────────────────┘
                                                                   │
                                                                   ▼
┌─────────────────┐       ┌────────────────────┐       ┌────────────────────────┐
│ Pool Member     │ <───  │   SplitSnapshot    │ <───  │  Financial Chain Calc  │
│ Available Bal   │       │ (Immutable Freeze) │       │ (Minor-unit kobo math) │
└─────────────────┘       └────────────────────┘       └────────────────────────┘
        │
        ▼
┌─────────────────┐       ┌────────────────────┐
│ Member Payout   │ ───>  │ Paystack Transfers │
│ & Withdrawals   │       │ (Real / Test Mode) │
└─────────────────┘       └────────────────────┘
```

---

## 2. Financial Chain & Calculation Rules

When a client pays an invoice or payment link, the backend executes integer minor-unit (kobo) calculations ($1\text{ NGN} = 100\text{ kobo}$) to eliminate floating-point precision loss:

$$\text{Gross Amount} = \text{Payment Actual Amount (e.g. ₦10,000.00)}$$
$$\text{Provider Fee} = \text{Paystack Fee (1.5\% capped at ₦2,000.00)}$$
$$\text{Platform Fee} = \text{Gross Amount} \times \left(\frac{\text{Pool.platformFeePercent}}{100}\right)$$
$$\text{Tax} = 0.00$$
$$\text{Distributable Amount} = \max(0, \text{Gross} - \text{ProviderFee} - \text{PlatformFee} - \text{Tax})$$
$$\text{Collaborator Allocation} = \text{Distributable Amount} \times \left(\frac{\text{Member.splitPercentage}}{100}\right)$$

> **Remainder Guard:** Any odd kobo remainder from integer division is assigned to the member with the highest percentage split, guaranteeing 100% allocation without financial drift.

---

## 3. Database Schema Models

- **`payment_links`**: Active payment links generated for a pool containing `token`, `title`, `amount`, `currency`, and `isActive`.
- **`transactions`**: Payment records tracking `providerReference`, `amount`, `currency`, `status` (`PENDING`, `SUCCESSFUL`, `FAILED`), and `payerEmail`.
- **`split_snapshots`**: Immutable records created at payment confirmation time freezing team split percentages, fees, and distributable amounts.
- **`split_allocations`**: Individual member monetary shares linked to a `split_snapshot`.
- **`withdrawals`**: Member payout requests tracking `amount`, `bankCode`, `accountNumber`, `accountName`, `providerReference`, `status` (`PENDING`, `PROCESSING`, `SUCCESSFUL`, `FAILED`, `REVERSED`), and `failureReason`.
- **`notifications`**: User-facing in-app notifications generated for `PAYMENT_ALLOCATED`, `WITHDRAWAL_REQUESTED`, `WITHDRAWAL_SUCCESS`, and `WITHDRAWAL_FAILED`.
- **`audit_log`**: Immutable operational log tracking system and user events with unique idempotency constraints on webhooks.

---

## 4. API Endpoints Reference

### Public Checkout & Payments (Unauthenticated)

#### 1. Get Payment Link Checkout Data
* **Method & Route:** `GET /api/pay/:token`
* **Auth Required:** No (Public)
* **Response (`200 OK`):**
  ```json
  {
    "data": {
      "id": "link_12345",
      "token": "a1b",
      "title": "Website Design Deposit",
      "description": "Initial 50% deposit for web redesign",
      "amount": 50000,
      "currency": "NGN",
      "pool": {
        "id": "pool_67890",
        "name": "Acme Web Redesign",
        "description": "Client redesign project",
        "currency": "NGN"
      }
    }
  }
  ```

#### 2. Initialize Payment Checkout
* **Method & Route:** `POST /api/pay/:token/initialize`
* **Auth Required:** No (Public)
* **Request Body:**
  ```json
  {
    "payerEmail": "client@example.com",
    "payerName": "Jane Doe"
  }
  ```
* **Response (`200 OK`):**
  ```json
  {
    "data": {
      "transactionId": "tx_998877",
      "reference": "SPLIT-1727063000-A1B2",
      "amount": 50000,
      "amountMinor": 5000000,
      "currency": "NGN",
      "payerEmail": "client@example.com",
      "payerName": "Jane Doe",
      "poolName": "Acme Web Redesign"
    },
    "message": "Payment initialized successfully"
  }
  ```

#### 3. Verify Payment & Trigger Split Execution
* **Method & Route:** `GET /api/payments/verify/:reference`
* **Auth Required:** No (Public verification)
* **Response (`200 OK`):**
  ```json
  {
    "data": {
      "transaction": {
        "id": "tx_998877",
        "reference": "SPLIT-1727063000-A1B2",
        "amount": 50000,
        "currency": "NGN",
        "status": "SUCCESSFUL",
        "paidAt": "2026-09-27T10:00:00.000Z"
      },
      "breakdown": {
        "grossAmount": 50000,
        "providerFee": 750,
        "platformFee": 0,
        "tax": 0,
        "distributableAmount": 49250,
        "collaboratorAllocations": [
          { "collaboratorId": "pm_1", "userId": "u_alice", "role": "Developer", "splitPercentage": 60, "amount": 29550 },
          { "collaboratorId": "pm_2", "userId": "u_bob", "role": "Designer", "splitPercentage": 40, "amount": 19700 }
        ]
      }
    }
  }
  ```

---

### Pool Payment Links Management (Authenticated)

#### 4. List Payment Links for Pool
* **Method & Route:** `GET /api/pools/:poolId/payment-links`
* **Auth Required:** Yes (`Bearer Token` — Member or Owner)
* **Response (`200 OK`):**
  ```json
  {
    "data": [
      {
        "id": "link_12345",
        "poolId": "pool_67890",
        "token": "a1b",
        "title": "Website Design Deposit",
        "description": "Initial deposit",
        "amount": 50000,
        "currency": "NGN",
        "isActive": true,
        "createdAt": "2026-09-27T08:00:00.000Z"
      }
    ]
  }
  ```

#### 5. Create Payment Link
* **Method & Route:** `POST /api/pools/:poolId/payment-links`
* **Auth Required:** Yes (`Bearer Token` — Pool Owner only)
* **Request Body:**
  ```json
  {
    "title": "Final Milestone Payment",
    "amount": 75000,
    "description": "Completion payment",
    "currency": "NGN"
  }
  ```
* **Response (`201 Created`):**
  ```json
  {
    "data": {
      "id": "link_999",
      "poolId": "pool_67890",
      "token": "x9z",
      "title": "Final Milestone Payment",
      "amount": 75000,
      "currency": "NGN",
      "isActive": true,
      "createdAt": "2026-09-27T10:10:00.000Z"
    },
    "message": "Payment link created successfully"
  }
  ```

---

### Pool Balances & Financial Ledger (Authenticated)

#### 6. Get Pool Financial Balance Summary
* **Method & Route:** `GET /api/pools/:poolId/balance`
* **Auth Required:** Yes (`Bearer Token` — Member or Owner)
* **Response (`200 OK`):**
  ```json
  {
    "data": {
      "poolId": "pool_67890",
      "currency": "NGN",
      "totalReceived": 100000,
      "totalDisbursed": 20000,
      "currentBalance": 80000,
      "memberBalances": [
        {
          "poolMemberId": "pm_1",
          "userId": "usr_alice",
          "allocatedBalance": 60000,
          "withdrawnAmount": 20000,
          "availableBalance": 40000
        },
        {
          "poolMemberId": "pm_2",
          "userId": "usr_bob",
          "allocatedBalance": 40000,
          "withdrawnAmount": 0,
          "availableBalance": 40000
        }
      ]
    }
  }
  ```

#### 7. Get Pool Allocations History
* **Method & Route:** `GET /api/pools/:poolId/allocations`
* **Auth Required:** Yes (`Bearer Token` — Member or Owner)

#### 8. Get Pool Transactions History
* **Method & Route:** `GET /api/pools/:poolId/transactions`
* **Auth Required:** Yes (`Bearer Token` — Member or Owner)

---

### Member Withdrawals / Payouts (Authenticated)

#### 9. Request Member Withdrawal
* **Method & Route:** `POST /api/pools/:poolId/withdrawals`
* **Auth Required:** Yes (`Bearer Token` — Member or Owner)
* **Request Body:**
  ```json
  {
    "amount": 15000,
    "bankCode": "057",
    "accountNumber": "0123456789",
    "accountName": "Alice Johnson"
  }
  ```
* **Response (`201 Created` / `200 OK`):**
  ```json
  {
    "data": {
      "id": "wdr_776655",
      "poolId": "pool_67890",
      "poolMemberId": "pm_1",
      "amount": 15000,
      "currency": "NGN",
      "status": "PROCESSING",
      "providerReference": "TRF_123456789",
      "bankCode": "057",
      "accountNumber": "0123456789",
      "accountName": "Alice Johnson",
      "failureReason": null,
      "createdAt": "2026-09-27T10:12:00.000Z"
    },
    "message": "Withdrawal request submitted successfully"
  }
  ```

#### 10. List Pool Withdrawals
* **Method & Route:** `GET /api/pools/:poolId/withdrawals`
* **Auth Required:** Yes (`Bearer Token` — Members see their own; Owner sees all)

#### 11. Get Single Withdrawal Details
* **Method & Route:** `GET /api/pools/:poolId/withdrawals/:withdrawalId`
* **Auth Required:** Yes (`Bearer Token`)

---

### Webhooks (Paystack Server-to-Server)

#### 12. Paystack Webhook Event Handler
* **Method & Route:** `POST /api/webhooks/paystack`
* **Headers:** `x-paystack-signature` (HMAC-SHA512 verification)
* **Events Handled:** `charge.success`, `transfer.success`, `transfer.failed`, `transfer.reversed`

---

## 5. Frontend Integration Guide (For Abraham)

### Flow 1: Public Checkout Page (`/pay/[token]`)

1. User opens `/pay/[token]`.
2. Execute `GET /api/pay/[token]`:
   - Render project name, link title, description, amount, and currency.
3. User enters email (and optional name) and clicks "Pay Now".
4. Call `POST /api/pay/[token]/initialize`:
   ```typescript
   const res = await fetch(`/api/pay/${token}/initialize`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ payerEmail: email, payerName: name }),
   });
   const { data } = await res.json();
   ```
5. Use Paystack Popup / Inline SDK using `data.reference` & `data.amountMinor` or redirect to Paystack authorization.

---

### Flow 2: Payment Verification & Success Page (`/pay/verify`)

1. Extract `reference` from query parameter `?reference=SPLIT-...`.
2. Execute `GET /api/payments/verify/[reference]`:
   ```typescript
   const res = await fetch(`/api/payments/verify/${reference}`);
   const { data } = await res.json();

   if (data.transaction.status === 'SUCCESSFUL') {
     // Render payment success screen with financial breakdown:
     // - Gross Amount: data.breakdown.grossAmount
     // - Provider Fee: data.breakdown.providerFee
     // - Distributable Amount: data.breakdown.distributableAmount
     // - Collaborator Allocations: data.breakdown.collaboratorAllocations
   }
   ```

---

### Flow 3: Pool Financial Dashboard (`/pools/[poolId]`)

1. Execute `GET /api/pools/[poolId]/balance`:
   - Display `totalReceived`, `totalDisbursed`, and `currentBalance`.
   - Filter `memberBalances` to show the logged-in user's `allocatedBalance`, `withdrawnAmount`, and `availableBalance`.
2. Execute `GET /api/pools/[poolId]/transactions` to show recent payments.
3. Execute `GET /api/pools/[poolId]/payment-links` to show active payment links.

---

### Flow 4: Member Payout / Withdrawal (`/pools/[poolId]/withdrawals`)

1. Fetch available balance from `GET /api/pools/[poolId]/balance`.
2. Member inputs withdrawal amount, bank code, account number, and account name.
3. Validate client-side that `amount <= memberBalance.availableBalance`.
4. Call `POST /api/pools/[poolId]/withdrawals`:
   ```typescript
   const res = await fetch(`/api/pools/${poolId}/withdrawals`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${userToken}`,
     },
     body: JSON.stringify({
       amount: Number(requestedAmount),
       bankCode: selectedBankCode,
       accountNumber: accNo,
       accountName: accName,
     }),
   });
   const { data } = await res.json();
   ```
5. Display status badge (`PROCESSING`, `SUCCESSFUL`, or `FAILED`).

---

## 6. Testing & Environment Setup

### Environment Variables (`backend/.env`)
```env
PORT=5050
DATABASE_URL="postgresql://..."
JWT_SECRET="your-super-secret-key"
PAYSTACK_SECRET_KEY="sk_test_..."
PAYSTACK_PUBLIC_KEY="pk_test_..."
```

### Running Automated Financial Tests
- Smoke Tests: `npx tsx src/tests/financial-smoke.test.ts`
- Validation Tests: `npx tsx src/tests/financial-validation.test.ts`
- Build Verification: `npm run build`
