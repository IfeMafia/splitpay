"use client";

import { useState } from "react";
import {
  calculateGrossUpClientBearsFees,
  calculateDeductionsMerchantBearsFees,
} from "@/app/lib/fees";
import { formatAmount } from "@/app/lib/format";

export default function PricingSection() {
  const [feeMode, setFeeMode] = useState<"add_fee" | "include_fee">("add_fee");
  const [amount, setAmount] = useState<number>(100000);

  const calc = feeMode === "add_fee"
    ? calculateGrossUpClientBearsFees(amount)
    : calculateDeductionsMerchantBearsFees(amount);

  const presetAmounts = [50000, 100000, 250000, 500000, 1000000];

  const breakdownRows = feeMode === "add_fee"
    ? [
        {
          label: "Total client checkout invoice",
          amount: formatAmount(calc.grossClientAmount, "NGN"),
          sub: "Grossed up so your team receives 100% of your target payout. Client covers processing.",
          highlight: false,
          negative: false,
        },
        {
          label: "SplitPay base platform fee (1.01%)",
          amount: `−${formatAmount(calc.platformFee, "NGN")}`,
          sub: "Our ultra-low 1.01% platform fee for automated splits, real-time tracking, and verified ledger records.",
          highlight: false,
          negative: true,
        },
        {
          label: "Paystack gateway card processing",
          amount: `−${formatAmount(calc.gatewayFee, "NGN")}`,
          sub: "Standard Nigerian payment processing (1.5% + ₦100, capped at ₦2,000 max).",
          highlight: false,
          negative: true,
        },
        {
          label: "Your team receives (100% Net)",
          amount: formatAmount(calc.netDistributable, "NGN"),
          sub: "Distributed automatically and instantaneously to each collaborator's wallet according to your agreed split.",
          highlight: true,
          negative: false,
        },
      ]
    : [
        {
          label: "Total client payment",
          amount: formatAmount(calc.grossClientAmount, "NGN"),
          sub: "Client pays the exact entered amount on invoice. Fees are absorbed from the pool payout.",
          highlight: false,
          negative: false,
        },
        {
          label: "SplitPay base platform fee (1.01%)",
          amount: `−${formatAmount(calc.platformFee, "NGN")}`,
          sub: "1.01% deducted from gross payment for automatic splits and audit-ready bookkeeping.",
          highlight: false,
          negative: true,
        },
        {
          label: "Paystack gateway card processing",
          amount: `−${formatAmount(calc.gatewayFee, "NGN")}`,
          sub: "Standard payment gateway fee (1.5% + ₦100, capped at ₦2,000 max).",
          highlight: false,
          negative: true,
        },
        {
          label: "Your team receives (Net Distributable)",
          amount: formatAmount(calc.netDistributable, "NGN"),
          sub: "Distributed instantaneously across all collaborator accounts based on agreed percentages.",
          highlight: true,
          negative: false,
        },
      ];

  return (
    <section
      id="pricing"
      aria-label="Splitpay pricing"
      style={{ background: "#F9F9F9", padding: "clamp(80px,11vw,140px) 0", borderTop: "1px solid #F0F0F0" }}
    >
      <div className="container">

        {/* ── HEADER */}
        <div style={{ marginBottom: "clamp(40px,6vw,64px)" }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#bbb", marginBottom: 20,
          }}>
            · Transparent Pricing
          </div>
          <div className="pricing-header" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "clamp(24px,4vw,64px)", alignItems: "end",
          }}>
            <h2 style={{
              fontSize: "clamp(30px, 4vw, 52px)",
              fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1.1,
              color: "#0A0A0A", margin: 0,
            }}>
              No monthly subscriptions.{" "}
              <span style={{ fontStyle: "italic", fontFamily: "var(--font-serif)", color: "#aaa" }}>
                Pay only when you get paid.
              </span>
            </h2>
            <p style={{ fontSize: 15, color: "#888", lineHeight: 1.75, maxWidth: 420, margin: 0 }}>
              SplitPay charges a flat 1.01% base fee only upon confirmed payment. Choose whether clients cover fees on checkout or absorb them from your payout — you are always in total control.
            </p>
          </div>
        </div>

        {/* ── MAIN CONTENT: interactive breakdown + key points */}
        <div className="pricing-grid" style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: "clamp(32px,5vw,64px)",
          alignItems: "start",
        }}>

          {/* LEFT — Interactive Live Calculator */}
          <div style={{
            background: "#fff",
            border: "1px solid #EBEBEB",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.03)",
          }}>
            {/* Card header with mode selector */}
            <div style={{
              padding: "24px 28px",
              borderBottom: "1px solid #F0F0F0",
              background: "#FAFAFA",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", marginBottom: 2 }}>
                    Live Fee Calculator
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "#0A0A0A" }}>
                    Select payment mode & amount
                  </div>
                </div>
                <div style={{
                  background: "#F0FFF4", border: "1px solid #BBF7D0",
                  borderRadius: 100, padding: "4px 12px",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#166534" }}>1.01% Base Fee</span>
                </div>
              </div>

              {/* Fee Mode Toggle */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => setFeeMode("add_fee")}
                  style={{
                    padding: "9px 12px", borderRadius: 8, textAlign: "left", cursor: "pointer",
                    border: feeMode === "add_fee" ? "1.5px solid #0A0A0A" : "1px solid rgba(0,0,0,0.08)",
                    background: feeMode === "add_fee" ? "#fff" : "transparent",
                    boxShadow: feeMode === "add_fee" ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                    transition: "all 120ms ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0A0A0A" }}>Add fee to client</span>
                    {feeMode === "add_fee" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />}
                  </div>
                  <p style={{ fontSize: 11, color: "#777", margin: 0, lineHeight: 1.35 }}>
                    Client covers fees on top · Team gets 100% net target
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFeeMode("include_fee")}
                  style={{
                    padding: "9px 12px", borderRadius: 8, textAlign: "left", cursor: "pointer",
                    border: feeMode === "include_fee" ? "1.5px solid #0A0A0A" : "1px solid rgba(0,0,0,0.08)",
                    background: feeMode === "include_fee" ? "#fff" : "transparent",
                    boxShadow: feeMode === "include_fee" ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                    transition: "all 120ms ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0A0A0A" }}>Include in price</span>
                    {feeMode === "include_fee" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />}
                  </div>
                  <p style={{ fontSize: 11, color: "#777", margin: 0, lineHeight: 1.35 }}>
                    Fees deducted from price · Client pays exact figure
                  </p>
                </button>
              </div>

              {/* Amount input & preset pills */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 12px", borderRadius: 8,
                  background: "#fff", border: "1px solid rgba(0,0,0,0.12)",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#666", fontFamily: "var(--font-mono)" }}>₦</span>
                  <input
                    type="number"
                    min="100"
                    step="1000"
                    value={amount || ""}
                    onChange={e => setAmount(Math.max(0, Number(e.target.value) || 0))}
                    style={{
                      width: 110, border: "none", outline: "none",
                      fontSize: 14, fontWeight: 600, fontFamily: "var(--font-mono)",
                      color: "#0A0A0A", background: "transparent",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {presetAmounts.map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      style={{
                        padding: "6px 10px", borderRadius: 6,
                        border: amount === val ? "1px solid #0A0A0A" : "1px solid rgba(0,0,0,0.08)",
                        background: amount === val ? "#0A0A0A" : "#fff",
                        color: amount === val ? "#fff" : "#555",
                        fontSize: 11.5, fontWeight: 500, cursor: "pointer",
                        fontFamily: "var(--font-mono)", transition: "all 120ms ease",
                      }}
                    >
                      {val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Breakdown rows */}
            <div style={{ padding: "4px 0" }}>
              {breakdownRows.map((row, i) => (
                <div
                  key={i}
                  style={{
                    padding: "18px 28px",
                    borderBottom: i < breakdownRows.length - 1 ? "1px solid #F5F5F5" : "none",
                    background: row.highlight ? "#0A0A0A" : "transparent",
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 4,
                    gap: 16,
                  }}>
                    <span style={{
                      fontSize: 13.5, fontWeight: row.highlight ? 600 : 500,
                      color: row.highlight ? "#fff" : "#0A0A0A",
                    }}>
                      {row.label}
                    </span>
                    <span style={{
                      fontSize: 15.5, fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: row.highlight ? "#C8FF57" : row.negative ? "#DC2626" : "#0A0A0A",
                      flexShrink: 0,
                    }}>
                      {row.amount}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 11.5, color: row.highlight ? "rgba(255,255,255,0.6)" : "#888",
                    lineHeight: 1.5, margin: 0,
                  }}>
                    {row.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Value cards & Policy breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Big callout */}
            <div style={{
              background: "#C8FF57", borderRadius: 20, padding: "28px 32px",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4A6A00", marginBottom: 12 }}>
                Base platform fee
              </div>
              <div style={{ fontSize: "clamp(44px,5vw,56px)", fontWeight: 700, letterSpacing: "-0.05em", color: "#0A0A0A", lineHeight: 1 }}>
                1.01%
              </div>
              <div style={{ fontSize: 13, color: "#3A5500", marginTop: 10, lineHeight: 1.55 }}>
                No setup fees. No recurring monthly charges. Pay only 1.01% when money actually hits the pool account.
              </div>
            </div>

            {/* What is free */}
            <div style={{
              background: "#fff", border: "1px solid #EBEBEB",
              borderRadius: 20, padding: "24px 28px",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#bbb", marginBottom: 16 }}>
                Included for free on every pool
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Unlimited collaborator invites & roles",
                  "Automated equal & custom split calculators",
                  "Instant client payment link generation",
                  "Server-verified webhook payment validation",
                  "Direct individual bank withdrawals to all Nigerian banks",
                  "Immutable split snapshots & audit logs",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M20 6L9 17l-5-5" /></svg>
                    <span style={{ fontSize: 12.5, color: "#333" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Processor note */}
            <div style={{
              background: "#F9F9F9", border: "1px solid #EBEBEB",
              borderRadius: 16, padding: "16px 20px",
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              <p style={{ fontSize: 12, color: "#777", lineHeight: 1.55, margin: 0 }}>
                Payment processing (1.5% + ₦100, capped at ₦2,000) is charged by <strong style={{ color: "#0A0A0A" }}>Paystack</strong> for card/bank rails. SplitPay transparently calculates and shows all fees upfront before payment link creation.
              </p>
            </div>

          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 860px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
          .pricing-header { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
