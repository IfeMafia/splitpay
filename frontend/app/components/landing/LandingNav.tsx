"use client";

import { useState, useEffect } from "react";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const links = [
    { label: "Problem",      href: "#problem" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Features",     href: "#features" },
    { label: "Pricing",      href: "#pricing" },
    { label: "FAQ",          href: "#faq" },
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* ── HEADER ── */}
      <header className={`sp-header ${scrolled ? "scrolled" : ""}`}>
        <nav aria-label="Main navigation" className="sp-nav-container">

          {/* Brand */}
          <a href="/" className="sp-logo" onClick={closeMenu}>
            <div className="sp-logo-mark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 6C4 10.4183 7.58172 14 12 14C16.4183 14 20 10.4183 20 6H4Z" fill="currentColor" />
                <circle cx="7" cy="18" r="3.2" fill="currentColor" fillOpacity="0.4" />
                <circle cx="15.5" cy="18" r="3.2" fill="currentColor" fillOpacity="0.15" />
              </svg>
            </div>
            <span className="sp-logo-text">Splitpay</span>
          </a>

          {/* Desktop Links */}
          <div className="sp-nav-links">
            {links.map(({ label, href }) => (
              <a key={label} href={href} className="sp-nav-link">{label}</a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="sp-nav-right">
            <a href="/login" className="sp-nav-login">Log in</a>
            <a href="/signup" className="sp-nav-cta">
              Get started
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* Mobile Burger */}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className={`sp-burger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(v => !v)}
          >
            <span className="burger-bar b1" />
            <span className="burger-bar b2" />
            <span className="burger-bar b3" />
          </button>
        </nav>
      </header>

      {/* ── MOBILE DRAWER ── */}
      {/* Backdrop */}
      <div
        className={`sp-backdrop ${menuOpen ? "visible" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className={`sp-drawer ${menuOpen ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="Navigation menu">

        {/* Drawer top: logo + close */}
        <div className="sp-drawer-top">
          <a href="/" className="sp-drawer-logo" onClick={closeMenu}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6C4 10.4183 7.58172 14 12 14C16.4183 14 20 10.4183 20 6H4Z" fill="#C8FF57" />
              <circle cx="7" cy="18" r="3.2" fill="#C8FF57" fillOpacity="0.5" />
              <circle cx="15.5" cy="18" r="3.2" fill="#C8FF57" fillOpacity="0.2" />
            </svg>
            <span>Splitpay</span>
          </a>
          <button
            type="button"
            onClick={closeMenu}
            className="sp-drawer-close"
            aria-label="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tagline */}
        <p className="sp-drawer-tagline">
          One payment link.<br />Everyone gets paid.
        </p>

        {/* Nav links */}
        <nav className="sp-drawer-links">
          {links.map(({ label, href }, i) => (
            <a
              key={label}
              href={href}
              onClick={closeMenu}
              className={`sp-drawer-link ${label === "Pricing" ? "pricing-link" : ""}`}
              style={{ transitionDelay: menuOpen ? `${60 + i * 40}ms` : "0ms" }}
            >
              <span className="drawer-link-num">0{i + 1}</span>
              <span className="drawer-link-label">{label}</span>
              <svg className="drawer-link-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </nav>

        {/* Bottom CTAs */}
        <div className="sp-drawer-bottom">
          <a href="/login" onClick={closeMenu} className="sp-drawer-login">
            Log in to my account
          </a>
          <a href="/signup" onClick={closeMenu} className="sp-drawer-signup">
            Get started — it&apos;s free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      <style>{`
        /* ── HEADER BASE ── */
        .sp-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 200;
          pointer-events: none;
        }
        .sp-nav-container {
          width: 100%;
          height: 80px;
          background-color: transparent;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(20px, 5vw, 64px);
          pointer-events: auto;
          transition: height 0.35s ease, background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
        }
        .sp-header.scrolled .sp-nav-container {
          height: 68px;
          background-color: rgba(10,10,10,0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        }

        /* ── LOGO ── */
        .sp-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
          color: #fff;
          transition: opacity 0.2s;
        }
        .sp-logo:hover { opacity: 0.85; }
        .sp-logo-mark { width: 22px; height: 22px; display: flex; align-items: center; color: #C8FF57; }
        .sp-logo-text { font-size: 16.5px; font-weight: 500; letter-spacing: -0.02em; }

        /* ── DESKTOP LINKS ── */
        .sp-nav-links { display: flex; align-items: center; gap: 4px; }
        .sp-nav-link {
          font-size: 14px; font-weight: 400; color: #999; text-decoration: none;
          padding: 7px 14px; border-radius: 100px;
          transition: color 180ms, background 180ms;
          letter-spacing: -0.01em;
        }
        .sp-nav-link:hover { color: #fff; background: rgba(255,255,255,0.06); }

        /* ── DESKTOP CTAS ── */
        .sp-nav-right { display: flex; align-items: center; gap: 12px; }
        .sp-nav-login {
          font-size: 14px; font-weight: 500; color: #ccc; text-decoration: none;
          padding: 7px 14px; border-radius: 100px; transition: color 180ms;
        }
        .sp-nav-login:hover { color: #fff; }
        .sp-nav-cta {
          font-size: 13.5px; font-weight: 600;
          color: #0A0A0A; background: #C8FF57;
          text-decoration: none; padding: 10px 20px; border-radius: 100px;
          display: inline-flex; align-items: center; gap: 6px;
          transition: background 180ms, transform 180ms, box-shadow 180ms;
          box-shadow: 0 2px 10px rgba(200,255,87,0.15);
        }
        .sp-nav-cta:hover { background: #B4F046; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(200,255,87,0.25); }

        /* ── BURGER ── */
        .sp-burger {
          display: none;
          flex-direction: column; justify-content: center; align-items: flex-end;
          gap: 5px;
          background: none; border: none; cursor: pointer;
          padding: 8px; width: 44px; height: 44px;
          outline: none; z-index: 202;
        }
        .burger-bar {
          display: block; height: 2px;
          background: #fff; border-radius: 2px;
          transform-origin: center;
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        .burger-bar.b1 { width: 24px; }
        .burger-bar.b2 { width: 16px; }
        .burger-bar.b3 { width: 20px; }

        .sp-burger:hover .b2,
        .sp-burger:hover .b3 { width: 24px; }

        .sp-burger.open .b1 { transform: translateY(7px) rotate(45deg); }
        .sp-burger.open .b2 { opacity: 0; transform: scaleX(0); }
        .sp-burger.open .b3 { width: 24px; transform: translateY(-7px) rotate(-45deg); }

        /* ── BACKDROP ── */
        .sp-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 210;
          opacity: 0; pointer-events: none;
          transition: opacity 0.35s ease;
        }
        .sp-backdrop.visible { opacity: 1; pointer-events: auto; }

        /* ── DRAWER ── */
        .sp-drawer {
          position: fixed;
          top: 0; right: 0; bottom: 0;
          width: min(360px, 88vw);
          background: #0A0A0A;
          z-index: 220;
          display: flex;
          flex-direction: column;
          padding: 0;
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
          overflow-y: auto;
          box-shadow: -8px 0 40px rgba(0,0,0,0.4);
        }
        .sp-drawer.open { transform: translateX(0); }

        /* Drawer top bar */
        .sp-drawer-top {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #1A1A1A;
          flex-shrink: 0;
        }
        .sp-drawer-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none;
          font-size: 16px; font-weight: 500; color: #fff;
          letter-spacing: -0.02em;
        }
        .sp-drawer-close {
          width: 36px; height: 36px;
          background: #1A1A1A; border: 1px solid #2A2A2A;
          border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #888;
          transition: background 180ms, color 180ms;
        }
        .sp-drawer-close:hover { background: #222; color: #fff; }

        /* Tagline */
        .sp-drawer-tagline {
          font-size: clamp(22px, 6vw, 28px);
          font-weight: 300; letter-spacing: -0.03em;
          color: #fff; line-height: 1.25;
          padding: 32px 24px 0;
          margin: 0;
          flex-shrink: 0;
        }

        /* Links */
        .sp-drawer-links {
          display: flex; flex-direction: column;
          padding: 24px 16px;
          flex: 1;
          gap: 4px;
        }
        .sp-drawer-link {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 12px;
          border-radius: 12px;
          text-decoration: none;
          color: #999;
          transition: background 180ms, color 180ms, transform 180ms;
          opacity: 0; transform: translateX(20px);
          transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1), background 180ms, color 180ms;
        }
        .sp-drawer.open .sp-drawer-link { opacity: 1; transform: translateX(0); }
        .sp-drawer-link:hover { background: #141414; color: #fff; transform: translateX(4px) !important; }

        .sp-drawer-link.pricing-link { color: #C8FF57; }
        .sp-drawer-link.pricing-link:hover { background: rgba(200,255,87,0.08); }

        .drawer-link-num {
          font-size: 10px; font-weight: 700; font-family: var(--font-mono);
          color: #333; width: 20px; flex-shrink: 0;
          letter-spacing: 0.05em;
        }
        .pricing-link .drawer-link-num { color: rgba(200,255,87,0.4); }
        .drawer-link-label { flex: 1; font-size: 16px; font-weight: 400; letter-spacing: -0.01em; }
        .drawer-link-arrow { opacity: 0; transition: opacity 180ms; flex-shrink: 0; }
        .sp-drawer-link:hover .drawer-link-arrow { opacity: 1; }

        /* Bottom CTAs */
        .sp-drawer-bottom {
          padding: 16px;
          border-top: 1px solid #1A1A1A;
          display: flex; flex-direction: column; gap: 10px;
          flex-shrink: 0;
          opacity: 0; transform: translateY(12px);
          transition: opacity 0.4s ease 0.25s, transform 0.4s cubic-bezier(0.16,1,0.3,1) 0.25s;
        }
        .sp-drawer.open .sp-drawer-bottom { opacity: 1; transform: translateY(0); }

        .sp-drawer-login {
          display: block; text-align: center;
          padding: 14px 20px; border-radius: 12px;
          border: 1px solid #222; color: #999;
          text-decoration: none; font-size: 14px; font-weight: 400;
          transition: border-color 180ms, color 180ms;
        }
        .sp-drawer-login:hover { border-color: #444; color: #fff; }

        .sp-drawer-signup {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 15px 20px; border-radius: 12px;
          background: #C8FF57; color: #0A0A0A;
          text-decoration: none; font-size: 14px; font-weight: 600;
          transition: background 180ms, transform 180ms;
        }
        .sp-drawer-signup:hover { background: #B4F046; transform: translateY(-1px); }

        /* ── RESPONSIVE ── */
        @media (max-width: 820px) {
          .sp-nav-links  { display: none !important; }
          .sp-nav-right  { display: none !important; }
          .sp-burger     { display: flex !important; }
          .sp-nav-container { height: 64px !important; padding: 0 16px 0 20px !important; }
        }
      `}</style>
    </>
  );
}
