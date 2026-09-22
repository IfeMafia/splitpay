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

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const links = [
    { label: "Problem",      href: "#problem" },
    { label: "Solution",     href: "#solution" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Features",     href: "#features" },
    { label: "FAQ",          href: "#faq" },
  ];

  return (
    <>
      {/* Floating Header Container */}
      <header className={`sp-header ${scrolled ? "scrolled" : ""} ${menuOpen ? "menu-open" : ""}`}>
        <nav aria-label="Main navigation" className="sp-nav-container">
          
          {/* Brand Logo */}
          <a
            href="/"
            className="sp-logo"
            onClick={() => setMenuOpen(false)}
          >
            {/* Geometric Mark */}
            <div className="sp-logo-mark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6C4 10.4183 7.58172 14 12 14C16.4183 14 20 10.4183 20 6H4Z" fill="currentColor" />
                <circle cx="7" cy="18" r="3.2" fill="currentColor" fillOpacity="0.4" />
                <circle cx="15.5" cy="18" r="3.2" fill="currentColor" fillOpacity="0.15" />
              </svg>
            </div>
            <span className="sp-logo-text">Splitpay</span>
          </a>

          {/* Desktop Navigation Links */}
          <div className="sp-nav-links">
            {links.map(({ label, href }) => (
              <a key={label} href={href} className="sp-nav-link">
                {label}
              </a>
            ))}
          </div>

          {/* Right Action CTAs (Desktop) */}
          <div className="sp-nav-right">
            <a href="/login" className="sp-nav-login">Log in</a>
            <a href="/signup" className="sp-nav-cta">
              Get started
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* "Mad" 3-Line Hamburger Menu Icon */}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className={`sp-nav-burger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(v => !v)}
          >
            <div className="burger-lines">
              <span className="line l1"></span>
              <span className="line l2"></span>
              <span className="line l3"></span>
            </div>
          </button>
        </nav>
      </header>

      {/* Full Page Mobile Menu Overlay */}
      <div className={`sp-mobile-menu-page ${menuOpen ? "active" : ""}`}>
        <div className="sp-mobile-menu-content">
          
          <div className="sp-mobile-links">
            {links.map(({ label, href }, i) => (
              <a
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="sp-mobile-link"
                style={{ transitionDelay: `${menuOpen ? 100 + (i * 40) : 0}ms` }}
              >
                {label}
              </a>
            ))}
          </div>

          <div className="sp-mobile-bottom">
            <a
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="sp-mobile-login"
            >
              Log in to account
            </a>
            <a
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="sp-mobile-signup"
            >
              Start for free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

        </div>
      </div>

      <style>{`
        /* ── DESKTOP & BASE STYLING ── */
        .sp-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          padding: 0; /* Flush to top */
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* 
         * MAD DESIGN: 
         * Edge-to-edge, starts fully transparent over the dark hero, 
         * then solidifies into a premium dark frosted glass bar when scrolling.
         */
        .sp-nav-container {
          width: 100%;
          height: 80px; /* Generous height for premium feel */
          background-color: transparent;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(24px, 5vw, 64px);
          pointer-events: auto;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .sp-header.scrolled .sp-nav-container {
          height: 68px; /* Shrinks slightly on scroll */
          background-color: rgba(10, 10, 10, 0.92); /* Dark glass */
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        /* Logo */
        .sp-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
          color: #fff; /* Always white to pop on dark nav */
          transition: transform 0.3s ease;
        }
        .sp-logo:hover { transform: scale(0.98); }
        .sp-logo-mark { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; color: #C8FF57; }
        .sp-logo-text { font-size: 16.5px; font-weight: 500; letter-spacing: -0.02em; font-family: var(--font-sans); }

        /* Desktop Links */
        .sp-nav-links { display: flex; align-items: center; gap: 6px; }
        .sp-nav-link {
          font-size: 14px; font-weight: 400; color: #999; text-decoration: none;
          padding: 8px 16px; border-radius: 100px; transition: color 200ms ease, background-color 200ms ease;
          letter-spacing: -0.01em;
        }
        .sp-nav-link:hover { color: #fff; background-color: rgba(255, 255, 255, 0.06); }

        /* Desktop CTAs */
        .sp-nav-right { display: flex; align-items: center; gap: 12px; }
        .sp-nav-login {
          font-size: 14px; font-weight: 500; color: #ccc; text-decoration: none;
          padding: 8px 16px; border-radius: 100px; transition: color 200ms ease;
        }
        .sp-nav-login:hover { color: #fff; }
        
        .sp-nav-cta {
          font-size: 13.5px; font-weight: 600; 
          color: #0A0A0A; background-color: #C8FF57; /* Lime button pops on dark */
          text-decoration: none; padding: 10px 20px; border-radius: 100px;
          display: inline-flex; align-items: center; gap: 6px;
          transition: all 200ms ease;
          box-shadow: 0 2px 10px rgba(200,255,87,0.15);
        }
        .sp-nav-cta:hover { background-color: #B4F046; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(200,255,87,0.25); }

        /* Hamburger (Hidden on Desktop) */
        .sp-nav-burger { display: none; background: none; border: none; cursor: pointer; padding: 8px; width: 44px; height: 44px; align-items: center; justify-content: center; z-index: 102; outline: none; }
        .burger-lines { position: relative; width: 24px; height: 16px; }
        .burger-lines .line {
          position: absolute; left: 0; height: 2px; background-color: #fff; /* White lines for dark nav */
          border-radius: 2px; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        /* The "Mad" 3-line design (uneven playful lines) */
        .sp-nav-burger:not(.open) .line.l1 { top: 0; width: 24px; }
        .sp-nav-burger:not(.open) .line.l2 { top: 7px; width: 16px; left: 8px; }
        .sp-nav-burger:not(.open) .line.l3 { top: 14px; width: 20px; left: 4px; }
        
        .sp-nav-burger:not(.open):hover .line.l2 { width: 24px; left: 0; }
        .sp-nav-burger:not(.open):hover .line.l3 { width: 24px; left: 0; }

        /* Hamburger Open State (X) */
        .sp-nav-burger.open .line.l1 { top: 7px; width: 24px; transform: rotate(45deg); background-color: #fff; }
        .sp-nav-burger.open .line.l2 { top: 7px; width: 0; opacity: 0; left: 12px; }
        .sp-nav-burger.open .line.l3 { top: 7px; width: 24px; left: 0; transform: rotate(-45deg); background-color: #fff; }

        /* Full Page Menu Overlay */
        .sp-mobile-menu-page {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background-color: #0A0A0A; /* Dark premium overlay */
          z-index: 99;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex; flex-direction: column; justify-content: center;
        }
        .sp-mobile-menu-page.active { opacity: 1; pointer-events: auto; }
        
        .sp-mobile-menu-content {
          padding: 0 32px;
          height: 100%;
          display: flex; flex-direction: column; justify-content: center;
        }

        .sp-mobile-links { display: flex; flex-direction: column; gap: 24px; margin-bottom: 60px; }
        
        .sp-mobile-link {
          font-size: clamp(32px, 8vw, 48px);
          font-weight: 300; letter-spacing: -0.03em;
          color: #fff; text-decoration: none;
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sp-mobile-menu-page.active .sp-mobile-link { opacity: 1; transform: translateY(0); }
        .sp-mobile-link:active { color: #C8FF57; }

        .sp-mobile-bottom {
          display: flex; flex-direction: column; gap: 16px;
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.4s ease 0.3s, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.3s;
        }
        .sp-mobile-menu-page.active .sp-mobile-bottom { opacity: 1; transform: translateY(0); }

        .sp-mobile-login {
          padding: 16px; border: 1px solid rgba(255,255,255,0.15); border-radius: 100px;
          color: #fff; text-align: center; text-decoration: none; font-size: 15px; font-weight: 400;
        }
        .sp-mobile-signup {
          padding: 16px; background-color: #C8FF57; border-radius: 100px;
          color: #0A0A0A; text-align: center; text-decoration: none; font-size: 15px; font-weight: 600;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }

        /* ── MOBILE SPECIFIC NAV STYLING ── */
        @media (max-width: 820px) {
          .sp-nav-links { display: none !important; }
          .sp-nav-right { display: none !important; }
          .sp-nav-burger { display: flex !important; }
          
          .sp-nav-container {
            height: 64px !important;
            padding: 0 16px 0 20px !important;
          }
          
          /* When menu is open, the nav container goes transparent so the logo sits on the dark menu background */
          .sp-header.menu-open .sp-nav-container {
            background-color: transparent !important;
            border-bottom: 1px solid transparent !important;
            box-shadow: none !important;
            backdrop-filter: none;
          }
        }
      `}</style>
    </>
  );
}
