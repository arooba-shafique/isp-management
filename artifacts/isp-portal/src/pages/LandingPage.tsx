import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const API = import.meta.env.VITE_API_URL || "https://isp-management-api-server.vercel.app";
const TOKEN_KEY = "isp_token";

interface Package {
  id: number;
  name: string;
  speedMbps: number;
  price: number;
  validity: string;
  description?: string;
}

interface Zone {
  id: number;
  name: string;
  description?: string;
}

export default function LandingPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [pkgLoading, setPkgLoading] = useState(true);
  const [zoneLoading, setZoneLoading] = useState(true);
  const [pkgError, setPkgError] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(`${API}/packages`, { headers })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setPackages)
      .catch(() => setPkgError(true))
      .finally(() => setPkgLoading(false));

    fetch(`${API}/zones`)
      .then((r) => r.json())
      .then(setZones)
      .catch(() => {})
      .finally(() => setZoneLoading(false));
  }, []);

  const handleSubscribe = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  const mid = Math.floor(packages.length / 2);

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#060d1a", color: "#f0f6ff", minHeight: "100vh" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 99;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 5vw; height: 60px;
          background: rgba(6,13,26,0.97); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(59,130,246,0.12);
        }
        .lp-logo { display: flex; align-items: center; gap: 8px; font-size: 1.05rem; font-weight: 700; color: #f0f6ff; text-decoration: none; }
        .lp-logo-mark { width: 28px; height: 28px; background: #3b82f6; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .lp-nav-right { display: flex; align-items: center; gap: 1rem; }
        .lp-nav-link { color: #64788f; font-size: 0.875rem; text-decoration: none; transition: color 0.2s; background: none; border: none; cursor: pointer; }
        .lp-nav-link:hover { color: #f0f6ff; }
        .lp-nav-btn { background: #3b82f6; color: #fff; padding: 7px 18px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; text-decoration: none; border: none; cursor: pointer; transition: opacity 0.2s; }
        .lp-nav-btn:hover { opacity: 0.85; }

        .lp-hero {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 80px 5vw 60px; text-align: center;
          background: radial-gradient(ellipse 80% 50% at 50% 20%, rgba(59,130,246,0.06) 0%, transparent 70%);
        }
        .lp-hero h1 { font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 800; line-height: 1.14; letter-spacing: -1px; margin-bottom: 1.25rem; max-width: 680px; }
        .lp-hero h1 em { font-style: normal; color: #60a5fa; }
        .lp-hero p { font-size: 1rem; color: #64788f; max-width: 460px; line-height: 1.75; margin-bottom: 2rem; }
        .lp-btns { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; }
        .lp-btn { display: inline-flex; align-items: center; gap: 6px; padding: 11px 24px; border-radius: 7px; font-size: 0.9rem; font-weight: 600; text-decoration: none; cursor: pointer; border: none; transition: opacity 0.2s, transform 0.15s; }
        .lp-btn:hover { transform: translateY(-1px); opacity: 0.88; }
        .lp-btn-blue { background: #3b82f6; color: #fff; }
        .lp-btn-ghost { background: transparent; color: #f0f6ff; border: 1px solid rgba(255,255,255,0.15) !important; }
        .lp-btn-ghost:hover { border-color: rgba(59,130,246,0.4) !important; }

        .lp-section { padding: 80px 5vw; }
        .lp-section-alt { padding: 80px 5vw; background: #0b1628; }
        .lp-sec-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1.5px; color: #60a5fa; font-weight: 600; margin-bottom: 0.5rem; }
        .lp-sec-title { font-size: clamp(1.5rem, 3vw, 2.1rem); font-weight: 700; letter-spacing: -0.5px; margin-bottom: 0.6rem; }
        .lp-sec-sub { font-size: 0.9rem; color: #64788f; line-height: 1.7; max-width: 440px; margin-bottom: 2.5rem; }

        .lp-pkg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }

        .lp-pkg-card {
          background: rgba(11,22,40,0.9); border: 1px solid rgba(59,130,246,0.13);
          border-radius: 14px; padding: 1.75rem 1.5rem; position: relative;
          transition: border-color 0.2s, transform 0.2s; display: flex; flex-direction: column;
        }
        .lp-pkg-card:hover { border-color: rgba(59,130,246,0.4); transform: translateY(-3px); }
        .lp-pkg-card.popular { border-color: #3b82f6; border-width: 1.5px; }

        .lp-popular-tag {
          position: absolute; top: -1px; left: 50%; transform: translateX(-50%);
          background: #3b82f6; color: #fff; font-size: 0.68rem; font-weight: 700;
          padding: 3px 12px; border-radius: 0 0 7px 7px;
          text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;
        }

        .lp-pkg-speed {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 0.72rem; color: #60a5fa; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;
        }
        .lp-pkg-speed-dot { width: 6px; height: 6px; border-radius: 50%; background: #22d3a0; }

        .lp-pkg-name { font-size: 1.2rem; font-weight: 700; margin-bottom: 1rem; }

        .lp-pkg-price { display: flex; align-items: baseline; gap: 2px; margin-bottom: 2px; }
        .lp-pkg-currency { font-size: 0.9rem; color: #94a3b8; font-weight: 500; margin-right: 1px; }
        .lp-pkg-amount { font-size: 2.2rem; font-weight: 800; line-height: 1; color: #fff; }
        .lp-pkg-period { font-size: 0.78rem; color: #64788f; margin-left: 2px; }

        .lp-pkg-validity { font-size: 0.78rem; color: #64788f; margin-bottom: 1.25rem; }

        .lp-pkg-specs { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; flex: 1; }
        .lp-pkg-spec { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: #94a3b8; }
        .lp-spec-icon { width: 16px; height: 16px; border-radius: 50%; background: rgba(34,211,160,0.12); border: 1px solid rgba(34,211,160,0.3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        .lp-pkg-desc { font-size: 0.8rem; color: #64788f; line-height: 1.55; margin-bottom: 1.25rem; }

        .lp-pkg-btn {
          display: block; width: 100%; text-align: center;
          padding: 10px; border-radius: 8px; font-size: 0.875rem; font-weight: 600;
          border: 1.5px solid rgba(59,130,246,0.3); color: #60a5fa;
          background: transparent; cursor: pointer; transition: all 0.2s; margin-top: auto;
        }
        .lp-pkg-btn:hover { background: #3b82f6; color: #fff; border-color: #3b82f6; }
        .lp-pkg-card.popular .lp-pkg-btn { background: #3b82f6; color: #fff; border-color: #3b82f6; }
        .lp-pkg-card.popular .lp-pkg-btn:hover { opacity: 0.85; }

        .lp-pkg-login-note { font-size: 0.72rem; color: #64788f; text-align: center; margin-top: 8px; }

        .lp-zones-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 0.75rem; }
        .lp-zone-card { background: #0f1e36; border: 1px solid rgba(59,130,246,0.12); border-radius: 10px; padding: 1rem 1.25rem; display: flex; align-items: flex-start; gap: 10px; }
        .lp-zone-dot { width: 8px; height: 8px; border-radius: 50%; background: #22d3a0; flex-shrink: 0; margin-top: 5px; animation: lp-pulse 2s ease-in-out infinite; }
        @keyframes lp-pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .lp-zone-name { font-size: 0.875rem; font-weight: 600; margin-bottom: 2px; }
        .lp-zone-desc { font-size: 0.75rem; color: #64788f; line-height: 1.4; }

        .lp-cta { background: #0b1628; border-top: 1px solid rgba(59,130,246,0.12); padding: 70px 5vw; text-align: center; }
        .lp-cta h2 { font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 700; margin-bottom: 0.75rem; }
        .lp-cta p { color: #64788f; font-size: 0.95rem; margin-bottom: 2rem; }

        .lp-loading { text-align: center; padding: 3rem; color: #64788f; font-size: 0.875rem; }
        .lp-spinner { display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(59,130,246,0.15); border-top-color: #3b82f6; border-radius: 50%; animation: lp-spin 0.8s linear infinite; margin-bottom: 0.75rem; }
        @keyframes lp-spin { to { transform: rotate(360deg); } }

        .lp-error-box { text-align: center; padding: 2.5rem; background: rgba(11,22,40,0.6); border: 1px solid rgba(59,130,246,0.1); border-radius: 12px; }
        .lp-error-box p { color: #64788f; font-size: 0.875rem; margin-bottom: 1rem; }

        .lp-footer { background: #060d1a; border-top: 1px solid rgba(255,255,255,0.05); padding: 28px 5vw; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
        .lp-footer p { font-size: 0.78rem; color: #64788f; }
        .lp-foot-links { display: flex; gap: 1.5rem; list-style: none; }
        .lp-foot-links a, .lp-foot-links button { font-size: 0.78rem; color: #64788f; text-decoration: none; background: none; border: none; cursor: pointer; }
        .lp-foot-links a:hover, .lp-foot-links button:hover { color: #60a5fa; }

        @media (max-width: 600px) {
          .lp-nav { padding: 0 1.25rem; }
          .lp-nav-link { display: none; }
          .lp-section, .lp-section-alt { padding: 60px 1.25rem; }
          .lp-hero { padding: 80px 1.25rem 50px; }
          .lp-footer { flex-direction: column; }
          .lp-pkg-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* NAV */}
      <nav className="lp-nav">
        <a href="#" className="lp-logo">
          <div className="lp-logo-mark">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M2 9C2 5.7 4.7 3 8 3S14 5.7 14 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M5 9C5 7.3 6.3 6 8 6S11 7.3 11 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="8" cy="9" r="1.2" fill="white"/>
            </svg>
          </div>
          NetLink ISP
        </a>
        <div className="lp-nav-right">
          <a href="#packages" className="lp-nav-link">Packages</a>
          <a href="#zones" className="lp-nav-link">Coverage</a>
          <button className="lp-nav-btn" onClick={() => navigate("/login")}>Login</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <h1>Fast, reliable internet<br />for <em>every home</em></h1>
        <p>Flexible plans, transparent pricing, and 24/7 support — pick the speed that fits your life.</p>
        <div className="lp-btns">
          <a href="#packages" className="lp-btn lp-btn-blue">See packages</a>
          <a href="#zones" className="lp-btn lp-btn-ghost">Check coverage</a>
        </div>
      </section>

      {/* PACKAGES */}
      <section id="packages" className="lp-section-alt">
        <p className="lp-sec-label">Pricing</p>
        <h2 className="lp-sec-title">Choose your plan</h2>
        <p className="lp-sec-sub">All plans include 24/7 support and full access to your customer portal.</p>

        {pkgLoading ? (
          <div className="lp-loading"><div className="lp-spinner" /><br />Loading packages...</div>
        ) : pkgError ? (
          <div className="lp-error-box">
            <p>Packages could not be loaded right now.</p>
            <button className="lp-btn lp-btn-blue" onClick={() => navigate("/login")}>Login to view packages</button>
          </div>
        ) : packages.length === 0 ? (
          <div className="lp-loading">No packages available right now.</div>
        ) : (
          <div className="lp-pkg-grid">
            {packages.map((p, i) => {
              const popular = packages.length > 1 && i === mid;
              return (
                <div key={p.id} className={`lp-pkg-card${popular ? " popular" : ""}`}>
                  {popular && <div className="lp-popular-tag">Most popular</div>}

                  <div className="lp-pkg-speed">
                    <div className="lp-pkg-speed-dot" />
                    {p.speedMbps} Mbps
                  </div>

                  <div className="lp-pkg-name">{p.name}</div>

                  <div className="lp-pkg-price">
                    <span className="lp-pkg-currency">PKR</span>
                    <span className="lp-pkg-amount">{Number(p.price).toLocaleString()}</span>
                    <span className="lp-pkg-period">/mo</span>
                  </div>

                  {p.validity && <div className="lp-pkg-validity">Valid for {p.validity}</div>}

                  <ul className="lp-pkg-specs">
                    <li className="lp-pkg-spec">
                      <span className="lp-spec-icon">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="#22d3a0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      {p.speedMbps} Mbps download &amp; upload
                    </li>
                    <li className="lp-pkg-spec">
                      <span className="lp-spec-icon">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="#22d3a0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      No throttling or data caps
                    </li>
                    <li className="lp-pkg-spec">
                      <span className="lp-spec-icon">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="#22d3a0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      24/7 customer support
                    </li>
                    <li className="lp-pkg-spec">
                      <span className="lp-spec-icon">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="#22d3a0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                      Customer portal access
                    </li>
                    {p.description && (
                      <li className="lp-pkg-spec">
                        <span className="lp-spec-icon">
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="#22d3a0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                        {p.description}
                      </li>
                    )}
                  </ul>

                  <button className="lp-pkg-btn" onClick={handleSubscribe}>
                    Subscribe now
                  </button>
                  <p className="lp-pkg-login-note">Login required to subscribe</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ZONES */}
      <section id="zones" className="lp-section">
        <p className="lp-sec-label">Coverage</p>
        <h2 className="lp-sec-title">Areas we serve</h2>
        <p className="lp-sec-sub">We're expanding fast. Check if your area is covered.</p>

        {zoneLoading ? (
          <div className="lp-loading"><div className="lp-spinner" /><br />Loading zones...</div>
        ) : zones.length === 0 ? (
          <div className="lp-loading">No coverage zones found.</div>
        ) : (
          <div className="lp-zones-grid">
            {zones.map((z) => (
              <div key={z.id} className="lp-zone-card">
                <div className="lp-zone-dot" />
                <div>
                  <div className="lp-zone-name">{z.name}</div>
                  {z.description && <div className="lp-zone-desc">{z.description}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <div className="lp-cta">
        <h2>Already a customer?</h2>
        <p>Log in to your portal to view your plan, pay bills, and track usage.</p>
        <button className="lp-btn lp-btn-blue" onClick={() => navigate("/login")}>Go to portal</button>
      </div>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-logo" style={{ fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 8 }}>
          <div className="lp-logo-mark" style={{ width: 22, height: 22 }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M2 9C2 5.7 4.7 3 8 3S14 5.7 14 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M5 9C5 7.3 6.3 6 8 6S11 7.3 11 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="8" cy="9" r="1.2" fill="white"/>
            </svg>
          </div>
          NetLink ISP
        </div>
        <ul className="lp-foot-links">
          <li><a href="#packages">Packages</a></li>
          <li><a href="#zones">Coverage</a></li>
          <li><button onClick={() => navigate("/login")}>Login</button></li>
        </ul>
        <p>© 2025 NetLink ISP</p>
      </footer>
    </div>
  );
}
