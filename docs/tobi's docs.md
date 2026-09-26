# Tobi's Financial & Paystack Infrastructure Documentation

> **Role:** Backend Financial & Database Owner  
> **Subsystems Covered:** T1 – T11 (Paystack Infrastructure, State Machine, Ledger, Fee Engine, Allocations, Withdrawals, Audit Events)  
> **Target Audience:** Frontend Engineers (Abraham), Backend Engineers (Samkiel), Code Reviewers  

---

## 📑 Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [The Financial Chain Breakdown](#2-the-financial-chain-breakdown)
3. [Database Schema Models](#3-database-schema-models)
4. [API Endpoints Reference](#4-api-endpoints-reference)
5. [Frontend Integration Guide (For Abraham)](#5-frontend-integration-guide-for-abraham)
6. [Testing & Environment Setup](#6-testing--environment-setup)

---

## 1. Overview & Architecture

This financial module owns the payment checkout initialization, Paystack gateway integration, authoritative payment verification, split snapshotting, minor-unit financial ledger calculations, balance tracking, and withdrawal processing.

```text
┌─────────────────┐       ┌────────────────────┐       ┌────────────────────────┐
│ Client Browser  │  ───> │  Paystack Gateway  │  ───> │ Webhook / Verification │
└─────────────────┘       └────────────────────┘       └────────────────────────┘
                                                                   │
                                                                   ▼
                                                       ┌────────────────────────┐
                                                       │ Authoritative Verification│
                                                       └────────────────────────┘
                                                                   │
                                                                   ▼
┌─────────────────┐       ┌────────────────────┐       ┌────────────────────────┐
│ Project Account │ <───  │   SplitSnapshot    │ <───  │  Financial Chain Calc  │
│ Ledger Balance  │       │ (Immutable Freeze) │       │ (Minor-unit kobo math) │
└─────────────────┘       └────────────────────┘       └────────────────────────┘
        │
        ▼
┌─────────────────┐       ┌────────────────────┐
│ Member Payouts  │ ───>  │ Paystack Transfers │
│ & Withdrawals   │       │ (Real/Mock Gateway)│
└─────────────────┘       └────────────────────┘
```

---

## 2. The Financial Chain Breakdown

When a client pays an invoice/payment link, the server executes integer minor-unit (kobo) calculations to eliminate floating-point rounding errors ($1\text{ NGN} = 100\text{ kobo}$):

$$\text{Gross Amount} = \text{Payment Actual Amount (e.g. ₦10,000.00)}$$
$$\text{Provider Fee} = \text{Paystack Fee (e.g. 1.5\%)}$$
$$\text{Platform Fee} = \text{Gross Amount} \times \left(\frac{\text{Project.platformFeePercent}}{100}\right)$$
$$\text{Tax} = 0.00$$
$$\text{Distributable Amount} = \max(0, \text{Gross} - \text{ProviderFee} - \text{PlatformFee} - \text{Tax})$$
$$\text{Collaborator Allocation} = \text{Distributable Amount} \times \left(\frac{\text{Collaborator.splitPercentage}}{100}\right)$$

*Note:* Minor unit remainders are assigned to the final collaborator to guarantee exact 100% distribution without loss.

---

## 3. Database Schema Models

* **`Payment`**: Stores payment links, tokens, expected amounts, actual amounts, Paystack reference, and status (`PENDING`, `SUCCESSFUL`, `FAILED`).
* **`SplitSnapshot`**: Freezes team roles, split percentages, and fee rules at payment confirmation time so future team edits never alter past revenue.
* **`ProjectAccount`**: Virtual wallet ledger tracking `totalReceived`, `totalDisbursed`, and `currentBalance`.
* **`PayoutTransaction`**: Individual team collaborator allocations and withdrawals waiting for/executing disbursement (`PENDING`, `PROCESSING`, `SUCCESSFUL`, `FAILED`).
* **`WebhookEvent`**: Stores raw webhook payloads and guarantees idempotent processing (`providerEventId`).
* **`AuditLog`**: Stores immutable event log with `entityType: "LEDGER_ENTRY"` or `"FINANCIAL_EVENT"`.

---

## 4. API Endpoints Reference

### 1. Get Payment Link Public Details
* **Method & Route:** `GET /api/payments/link/:token`
* **Auth Required:** No (Public)
* **Response (`200 OK`):**
  ```json
  {
    "data": {
      "id": "pmt_12345",
      "projectId": "proj_67890",
      "paymentLinkToken": "abc123token",
      "expectedAmount": "10000.00",
      "currency": "NGN",
      "provider": "paystack",
      "status": "PENDING"
    }
  }
  ```

---

### 2. Initialize Paystack Checkout
* **Method & Route:** `POST /api/payments/pay/:token/initialize`  
  *(Alias: `POST /api/payments/initialize/:token`)*
* **Auth Required:** No (Public)
* **Request Body:**
  ```json
  {
    "email": "client@example.com",
    "callbackUrl": "https://yourdomain.com/pay/verify"
  }
  ```
* **Response (`200 OK`):**
  ```json
  {
    "data": {
      "authorizationUrl": "https://checkout.paystack.com/3M8x...",
      "reference": "sp_pmt_12345_1727063000",
      "payment": {
        "id": "pmt_12345",
        "expectedAmount": "10000.00",
        "status": "PENDING"
      }
    }
  }
  ```

---

### 3. Calculate Financial Chain Preview
* **Method & Route:** `POST /api/payments/calculate`
* **Auth Required:** No (Public preview)
* **Request Body:**
  ```json
  {
    "amount": 10000,
    "platformFeePercent": 2.5,
    "providerFee": 150,
    "collaborators": [
      { "id": "c1", "userId": "u1", "role": "Developer", "splitPercentage": 60 },
      { "id": "c2", "userId": "u2", "role": "Designer", "splitPercentage": 40 }
    ]
  }
  ```
* **Response (`200 OK`):**
  ```json
  {
    "data": {
      "grossAmount": 10000,
      "providerFee": 150,
      "platformFee": 250,
      "tax": 0,
      "distributableAmount": 9600,
      "collaboratorAllocations": [
        { "collaboratorId": "c1", "userId": "u1", "role": "Developer", "splitPercentage": 60, "amount": 5760 },
        { "collaboratorId": "c2", "userId": "u2", "role": "Designer", "splitPercentage": 40, "amount": 3840 }
      ]
    }
  }
  ```

---

### 4. Verify Payment Transaction & Trigger Financial Chain
* **Method & Route:** `GET /api/payments/verify/:reference`
* **Auth Required:** No (Public verification)
* **Response (`200 OK`):**
  ```json
  {
    "data": {
      "payment": {
        "id": "pmt_12345",
        "status": "SUCCESSFUL",
        "actualAmount": "10000.00",
        "paidAt": "2026-09-23T03:50:00.000Z"
      },
      "breakdown": {
        "grossAmount": 10000,
        "providerFee": 150,
        "platformFee": 250,
        "tax": 0,
        "distributableAmount": 9600,
        "collaboratorAllocations": [
          { "collaboratorId": "collab_1", "userId": "usr_alice", "role": "Lead Engineer", "splitPercentage": 60, "amount": 5760 },
          { "collaboratorId": "collab_2", "userId": "usr_bob", "role": "Designer", "splitPercentage": 40, "amount": 3840 }
        ]
      }
    }
  }
  ```

---

### 5. Get Project Financial Balance Summary
* **Method & Route:** `GET /api/projects/:id/balance`
* **Auth Required:** Yes (`Bearer Token`)
* **Response (`200 OK`):**
  ```json
  {
    "data": {
      "projectId": "proj_123",
      "totalReceived": 10000,
      "totalDisbursed": 3000,
      "currentBalance": 7000,
      "currency": "USD",
      "collaboratorBreakdown": {
        "collab_1": {
          "role": "Developer",
          "allocated": 5760,
          "withdrawn": 3000,
          "available": 2760
        }
      }
    }
  }
  ```

---

### 6. Request Member Withdrawal / Payout
* **Method & Route:** `POST /api/payouts/withdraw`
* **Auth Required:** Yes (`Bearer Token`)
* **Request Body:**
  ```json
  {
    "collaboratorId": "collab_1",
    "amount": 2500,
    "accountName": "Alice Johnson",
    "accountNumber": "0123456789",
    "bankCode": "057"
  }
  ```
* **Response (`201 Created`):**
  ```json
  {
    "data": {
      "id": "payout_987",
      "paymentId": "pmt_12345",
      "collaboratorId": "collab_1",
      "amount": "2500.00",
      "currency": "NGN",
      "status": "SUCCESSFUL",
      "providerReference": "wth_collab_1_1727065000",
      "completedAt": "2026-09-23T20:30:00.000Z"
    }
  }
  ```

---

### 7. Paystack Webhook Receiver
* **Method & Route:** `POST /api/webhooks/paystack`
* **Headers Required:** `x-paystack-signature` (HMAC-SHA512)
* **Response (`200 OK`):**
  ```json
  {
    "processed": true,
    "message": "Webhook processed successfully"
  }
  ```

---

## 5. Frontend Integration Guide (For Abraham)

### Flow 1: Client Checkout Page (`/pay/[token]`)

1. User visits `/pay/[token]`.
2. Fetch payment details using `GET /api/payments/link/[token]`.
3. Display project name, expected amount, and email input form.
4. On submit, call `POST /api/payments/pay/[token]/initialize`:
   ```typescript
   const res = await fetch(`/api/payments/pay/${token}/initialize`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: clientEmail, callbackUrl: `${window.location.origin}/pay/verify` }),
   });
   const { data } = await res.json();

   // Redirect client to Paystack Checkout URL
   window.location.href = data.authorizationUrl;
   ```

---

### Flow 2: Payment Verification Page (`/pay/verify`)

1. Paystack redirects back to `callbackUrl?trxref=sp_...&reference=sp_...`.
2. Extract `reference` query param.
3. Call verification endpoint `GET /api/payments/verify/[reference]`:
   ```typescript
   const res = await fetch(`/api/payments/verify/${reference}`);
   const { data } = await res.json();

   if (data.payment.status === 'SUCCESSFUL') {
     // Show Success UI with breakdown (grossAmount, distributableAmount, allocations)
   }
   ```

---

### Flow 3: Collaborator Withdrawal Page (`/pools/[poolId]/withdrawals`)

1. Fetch balance summary using `GET /api/projects/[projectId]/balance`.
2. Display `available` balance for the logged-in collaborator.
3. On withdrawal submit:
   ```typescript
   const res = await fetch('/api/payouts/withdraw', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify({
       collaboratorId: userCollaboratorId,
       amount: requestedAmount,
       accountNumber: bankAccount,
       bankCode: selectedBankCode
     })
   });
   const { data } = await res.json();
   ```

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

> **Note:** If `PAYSTACK_SECRET_KEY` is not set or uses the placeholder `sk_test_placeholder`, the system automatically runs in **Mock Development Mode**, returning test checkout URLs and mock successful verifications/transfers out-of-the-box.
