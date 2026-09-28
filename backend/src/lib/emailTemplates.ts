import { env } from '../config/env';

/**
 * Base email layout wrapper with SplitPay minimal financial design system.
 */
function wrapEmailHtml(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-flex; align-items: center; gap: 8px;">
                      <div style="display: inline-block; width: 28px; height: 28px; background: #0f172a; border-radius: 6px; text-align: center; line-height: 28px; color: #ffffff; font-weight: 700; font-size: 14px; letter-spacing: -0.5px;">SP</div>
                      <span style="font-size: 18px; font-weight: 700; letter-spacing: -0.5px; color: #0f172a; vertical-align: middle; margin-left: 8px;">SplitPay</span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px;">Verified</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                This is an automated operational notice from <strong>SplitPay</strong>.<br />
                Multi-party automated revenue splitting and payouts.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} SplitPay Financial Technologies. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// -------------------------------------------------------------
// A. Pool Invitation / Member Added
// -------------------------------------------------------------
export function formatInvitationEmail(data: {
  inviterName: string;
  poolName: string;
  role: string;
  splitPercentage?: number;
  inviteCode: string;
  joinUrl: string;
}) {
  const subject = `You've been invited to join ${data.poolName}`;
  const splitNotice = data.splitPercentage && data.splitPercentage > 0
    ? `<div style="background-color: #f8fafc; border-radius: 8px; padding: 12px 16px; margin: 16px 0; border: 1px solid #e2e8f0;">
         <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Assigned Split Share</div>
         <div style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 2px;">${data.splitPercentage}%</div>
       </div>`
    : '';

  const html = wrapEmailHtml(subject, `
    <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">You're Invited to Collaborate</h1>
    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.5; color: #334155;">
      <strong>${data.inviterName}</strong> has invited you to join the pool <strong>"${data.poolName}"</strong> as a collaborator.
    </p>

    ${splitNotice}

    <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
      <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Your Invitation Code</div>
      <div style="font-size: 24px; font-weight: 700; font-family: monospace; letter-spacing: 4px; color: #0f172a; margin-top: 4px;">${data.inviteCode.toUpperCase()}</div>
    </div>

    <div style="margin: 28px 0; text-align: center;">
      <a href="${data.joinUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">Review Invitation</a>
    </div>

    <p style="margin: 20px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.4;">
      Or paste this URL directly into your browser:<br />
      <a href="${data.joinUrl}" style="color: #2563eb; word-break: break-all;">${data.joinUrl}</a>
    </p>
    <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;">
      This invitation is valid for 7 days.
    </p>
  `);

  const text = `You've been invited to join "${data.poolName}" on SplitPay by ${data.inviterName}.\n\nInvite Code: ${data.inviteCode}\nReview & Accept Invitation: ${data.joinUrl}\n\nThis invitation link expires in 7 days.`;

  return { subject, html, text };
}

// -------------------------------------------------------------
// B. Payment Received — Pool Owner
// -------------------------------------------------------------
export function formatPaymentReceivedOwnerEmail(data: {
  ownerName: string;
  poolName: string;
  amount: number;
  currency: string;
  reference: string;
  paidAt?: Date | string;
  poolUrl: string;
}) {
  const formattedAmount = `₦${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const subject = `Payment received — ${formattedAmount} for ${data.poolName}`;

  const html = wrapEmailHtml(subject, `
    <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">Payment Received</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569;">
      A verified client payment has been confirmed and distributed for your pool.
    </p>

    <!-- Amount Hero Card -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Gross Payment Amount</div>
      <div style="font-size: 28px; font-weight: 700; color: #0f172a; margin-top: 4px;">${formattedAmount}</div>
      <div style="font-size: 13px; color: #16a34a; font-weight: 500; margin-top: 4px;">● Confirmed & Automatically Allocated</div>
    </div>

    <!-- Details Table -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Workspace Pool</td>
        <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${data.poolName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Payment Reference</td>
        <td style="padding: 8px 0; color: #0f172a; font-family: monospace; text-align: right; border-bottom: 1px solid #f1f5f9;">${data.reference}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Status</td>
        <td style="padding: 8px 0; color: #16a34a; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">SUCCESSFUL</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Timestamp</td>
        <td style="padding: 8px 0; color: #0f172a; text-align: right;">${data.paidAt ? new Date(data.paidAt).toUTCString() : new Date().toUTCString()}</td>
      </tr>
    </table>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${data.poolUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none;">View Pool Financials</a>
    </div>
  `);

  const text = `Payment received: ${formattedAmount} for ${data.poolName}\nReference: ${data.reference}\nStatus: SUCCESSFUL\nView pool: ${data.poolUrl}`;

  return { subject, html, text };
}

// -------------------------------------------------------------
// C. Payment Allocation — Collaborator
// -------------------------------------------------------------
export function formatPaymentAllocatedEmail(data: {
  collaboratorName: string;
  poolName: string;
  grossAmount: number;
  splitPercentage: number;
  allocatedAmount: number;
  currency: string;
  reference: string;
  poolUrl: string;
}) {
  const formattedAlloc = `₦${data.allocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedGross = `₦${data.grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const subject = `Your share from ${data.poolName} — ${formattedAlloc}`;

  const html = wrapEmailHtml(subject, `
    <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">Share Allocated</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569;">
      A new verified client payment was confirmed in <strong>"${data.poolName}"</strong> and your share has been credited to your available balance.
    </p>

    <!-- Allocated Amount Card -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Your Allocated Share (${data.splitPercentage}%)</div>
      <div style="font-size: 28px; font-weight: 700; color: #0f172a; margin-top: 4px;">${formattedAlloc}</div>
      <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Status: <strong style="color: #0f172a;">Allocated & Available for Payout</strong></div>
    </div>

    <!-- Breakdown Table -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Workspace Pool</td>
        <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${data.poolName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Total Gross Payment</td>
        <td style="padding: 8px 0; color: #0f172a; text-align: right; border-bottom: 1px solid #f1f5f9;">${formattedGross}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Your Agreed Percentage</td>
        <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${data.splitPercentage}%</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Transaction Reference</td>
        <td style="padding: 8px 0; color: #0f172a; font-family: monospace; text-align: right;">${data.reference}</td>
      </tr>
    </table>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${data.poolUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none;">View Workspace & Withdraw</a>
    </div>
  `);

  const text = `Your share from ${data.poolName}: ${formattedAlloc} (${data.splitPercentage}% of ${formattedGross})\nStatus: Allocated\nReference: ${data.reference}\nView: ${data.poolUrl}`;

  return { subject, html, text };
}

// -------------------------------------------------------------
// D. Payment Receipt / Confirmation — Client
// -------------------------------------------------------------
export function formatPaymentReceiptClientEmail(data: {
  poolName: string;
  description?: string;
  amount: number;
  currency: string;
  reference: string;
  paidAt?: Date | string;
}) {
  const formattedAmount = `₦${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const subject = `Payment confirmed — ${data.poolName}`;

  const html = wrapEmailHtml(subject, `
    <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">Payment Successful</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569;">
      Thank you. Your payment for <strong>"${data.poolName}"</strong> has been successfully processed and verified.
    </p>

    <!-- Receipt Amount Card -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Amount Paid</div>
      <div style="font-size: 28px; font-weight: 700; color: #0f172a; margin-top: 4px;">${formattedAmount}</div>
      <div style="font-size: 13px; color: #16a34a; font-weight: 500; margin-top: 4px;">● Verified by Paystack / SplitPay</div>
    </div>

    <!-- Receipt Details -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Payment For</td>
        <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${data.poolName}</td>
      </tr>
      ${data.description ? `
      <tr>
        <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Description</td>
        <td style="padding: 8px 0; color: #0f172a; text-align: right; border-bottom: 1px solid #f1f5f9;">${data.description}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Payment Reference</td>
        <td style="padding: 8px 0; color: #0f172a; font-family: monospace; text-align: right; border-bottom: 1px solid #f1f5f9;">${data.reference}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Date & Time</td>
        <td style="padding: 8px 0; color: #0f172a; text-align: right;">${data.paidAt ? new Date(data.paidAt).toUTCString() : new Date().toUTCString()}</td>
      </tr>
    </table>

    <div style="background-color: #f1f5f9; border-radius: 6px; padding: 12px 16px; font-size: 12px; color: #64748b; line-height: 1.4;">
      Need assistance regarding this charge? Contact the pool organizer or reply to this receipt with your reference code.
    </div>
  `);

  const text = `Payment Confirmed — ${data.poolName}\nAmount Paid: ${formattedAmount}\nReference: ${data.reference}\nStatus: SUCCESSFUL`;

  return { subject, html, text };
}

// -------------------------------------------------------------
// F. Withdrawal Initiated
// -------------------------------------------------------------
export function formatWithdrawalInitiatedEmail(data: {
  userName: string;
  poolName: string;
  amount: number;
  currency: string;
  accountName: string;
  accountNumber: string;
  withdrawalId: string;
}) {
  const formattedAmount = `₦${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const subject = `Payout initiated — ${formattedAmount}`;

  const html = wrapEmailHtml(subject, `
    <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">Payout Initiated</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569;">
      Your withdrawal request for <strong>${formattedAmount}</strong> from "${data.poolName}" has been queued and is being transferred to your bank account.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Transfer Amount</div>
      <div style="font-size: 28px; font-weight: 700; color: #0f172a; margin-top: 4px;">${formattedAmount}</div>
      <div style="font-size: 13px; color: #3b82f6; font-weight: 500; margin-top: 4px;">● Status: Processing Bank Transfer</div>
    </div>

    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Destination Account</td>
        <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${data.accountName} (${data.accountNumber.slice(-4)})</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Withdrawal ID</td>
        <td style="padding: 8px 0; color: #0f172a; font-family: monospace; text-align: right;">${data.withdrawalId}</td>
      </tr>
    </table>
  `);

  const text = `Payout Initiated: ${formattedAmount} to ${data.accountName} (***${data.accountNumber.slice(-4)})\nStatus: Processing\nWithdrawal ID: ${data.withdrawalId}`;

  return { subject, html, text };
}

// -------------------------------------------------------------
// G. Withdrawal Completed
// -------------------------------------------------------------
export function formatWithdrawalSuccessEmail(data: {
  userName: string;
  poolName: string;
  amount: number;
  currency: string;
  accountName: string;
  accountNumber: string;
  withdrawalId: string;
}) {
  const formattedAmount = `₦${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const subject = `Payout completed — ${formattedAmount}`;

  const html = wrapEmailHtml(subject, `
    <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">Payout Completed</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569;">
      Great news. Your payout of <strong>${formattedAmount}</strong> from "${data.poolName}" has been successfully transferred to your bank account.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Completed Transfer</div>
      <div style="font-size: 28px; font-weight: 700; color: #0f172a; margin-top: 4px;">${formattedAmount}</div>
      <div style="font-size: 13px; color: #16a34a; font-weight: 500; margin-top: 4px;">● Disbursed Successfully</div>
    </div>
  `);

  const text = `Payout Completed: ${formattedAmount} transferred to ${data.accountName}\nStatus: SUCCESSFUL\nWithdrawal ID: ${data.withdrawalId}`;

  return { subject, html, text };
}
