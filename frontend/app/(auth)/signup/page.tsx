"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [loading, setIsloading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation placeholder
    console.log("Signup submitted:", { name, email, password });
  };

  return (
    <div style={{ width: "100%", animation: "fadeIn 0.4s ease" }}>
      {/* Mobile back link */}
      <div style={{ marginBottom: 40 }} className="mobile-only">
        <Link href="/" style={{ fontSize: 13, color: "#888", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to home
        </Link>
      </div>

      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 400, letterSpacing: "-0.03em", color: "#0A0A0A", marginBottom: 8 }}>
          Create an account
        </h1>
        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
          Join Splitpay to start managing collaborative payments and splits effortlessly.
        </p>
      </div>

      {/* Social Signup */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        <button type="button" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          width: "100%", padding: "12px", borderRadius: "12px",
          background: "#fff", border: "1px solid #E5E5E5",
          fontSize: 14, fontWeight: 500, color: "#0A0A0A", cursor: "pointer",
          transition: "background 140ms, border-color 140ms",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F9F9F9"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div style={{ flex: 1, height: 1, background: "#F0F0F0" }} />
        <span style={{ fontSize: 12, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>Or register</span>
        <div style={{ flex: 1, height: 1, background: "#F0F0F0" }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* Full Name Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label htmlFor="name" style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A" }}>
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jane Doe"
            required
            style={{
              width: "100%", padding: "14px 16px", borderRadius: "12px",
              border: "1px solid #E5E5E5", background: "#fff",
              fontSize: 14, color: "#0A0A0A", outline: "none",
              transition: "border-color 140ms, box-shadow 140ms",
            }}
            onFocus={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "#0A0A0A";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 1px #0A0A0A";
            }}
            onBlur={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "#E5E5E5";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          />
        </div>

        {/* Email Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label htmlFor="email" style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A" }}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            style={{
              width: "100%", padding: "14px 16px", borderRadius: "12px",
              border: "1px solid #E5E5E5", background: "#fff",
              fontSize: 14, color: "#0A0A0A", outline: "none",
              transition: "border-color 140ms, box-shadow 140ms",
            }}
            onFocus={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "#0A0A0A";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 1px #0A0A0A";
            }}
            onBlur={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "#E5E5E5";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          />
        </div>

        {/* Password Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label htmlFor="password" style={{ fontSize: 13, fontWeight: 500, color: "#0A0A0A" }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Create a strong password"
            required
            
            style={{
              width: "100%", padding: "14px 16px", borderRadius: "12px",
              border: "1px solid #E5E5E5", background: "#fff",
              fontSize: 14, color: "#0A0A0A", outline: "none",
              transition: "border-color 140ms, box-shadow 140ms",
            }}
            onFocus={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "#0A0A0A";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 1px #0A0A0A";
            }}
            onBlur={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "#E5E5E5";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          />
        </div>

        {/* Submit Button */}
        <button type="submit" style={{
          width: "100%", padding: "14px", borderRadius: "100px",
          background: "#0A0A0A", color: "#fff", border: "none",
          fontSize: 14, fontWeight: 500, cursor: "pointer",
          marginTop: 8, transition: "background 140ms, transform 140ms",
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "#222";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "#0A0A0A";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
        >
         {loading ? (
            <svg
              style={{ animation: "spin 1s linear infinite", display: "inline-block", verticalAlign: "middle" }}
              width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : "Create account"}
        </button>

      </form>

      <div style={{ marginTop: 32, textAlign: "center", fontSize: 14, color: "#666", lineHeight: 1.6 }}>
        By continuing, you agree to Splitpay's{" "}
        <Link href="/terms" style={{ color: "#0A0A0A", textDecoration: "underline", textUnderlineOffset: 2 }}>Terms of Service</Link>
        {" "}and{" "}
        <Link href="/privacy" style={{ color: "#0A0A0A", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy Policy</Link>.
      </div>

      <div style={{ marginTop: 32, textAlign: "center", fontSize: 14, color: "#666" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "#0A0A0A", fontWeight: 500, textDecoration: "none" }}>
          Log in
        </Link>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 901px) {
          .mobile-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}
