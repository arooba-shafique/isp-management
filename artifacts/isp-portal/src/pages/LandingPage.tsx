import { useLocation } from "wouter";
import { useListPublicPackages } from "@workspace/api-client-react";

type Pkg = { id: number; name: string; speedMbps: number; price: number; validity: string; description?: string | null; isActive: boolean };

export default function LandingPage() {
  const [, navigate] = useLocation();

  const { data: packages = [], isLoading: pkgLoading } = useListPublicPackages({ query: { retry: false } });

  const activePkgs = (packages as Pkg[]).filter(p => p.isActive);
  const mid = Math.floor(activePkgs.length / 2);

  const handleSubscribe = () => {
    const token = localStorage.getItem("isp_token");
    navigate(token ? "/packages" : "/login");
  };

  const validityLabel = (v: string) => ({ monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly" }[v] ?? v);
  const perPeriod = (v: string) => ({ monthly: "/mo", quarterly: "/qtr", yearly: "/yr" }[v] ?? `/${v}`);

  return (
    <div className="lp-root">
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        .lp-root{font-family:system-ui,-apple-system,sans-serif;background:#060d1a;color:#f0f6ff;min-height:100vh}

        /* ── NAV ── */
        .lp-nav{position:fixed;top:0;left:0;right:0;z-index:99;display:flex;align-items:center;justify-content:space-between;padding:0 5vw;height:60px;background:rgba(6,13,26,0.97);backdrop-filter:blur(12px);border-bottom:1px solid rgba(99,102,241,0.12)}
        .lp-logo{display:flex;align-items:center;gap:8px;font-size:1.05rem;font-weight:700;color:#f0f6ff;text-decoration:none}
        .lp-mark{width:28px;height:28px;background:linear-gradient(135deg,#6366f1,#3b82f6);border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .lp-nav-r{display:flex;align-items:center;gap:1rem}
        .lp-nl{color:#64788f;font-size:0.875rem;text-decoration:none;background:none;border:none;cursor:pointer;transition:color 0.2s}
        .lp-nl:hover{color:#f0f6ff}
        .lp-nb{background:linear-gradient(135deg,#6366f1,#3b82f6);color:#fff;padding:7px 18px;border-radius:6px;font-size:0.85rem;font-weight:600;border:none;cursor:pointer;transition:opacity 0.2s,transform 0.15s}
        .lp-nb:hover{opacity:0.9;transform:translateY(-1px)}

        /* ── HERO ── */
        .lp-hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 5vw 60px;text-align:center;background:radial-gradient(ellipse 80% 50% at 50% 20%,rgba(99,102,241,0.08) 0%,transparent 70%),radial-gradient(ellipse 60% 40% at 30% 60%,rgba(59,130,246,0.04) 0%,transparent 70%);position:relative;overflow:hidden}
        .lp-hero-ill{width:260px;height:200px;margin-bottom:2rem;opacity:0.85}
        .lp-hero h1{font-size:clamp(2rem,5vw,3.4rem);font-weight:800;line-height:1.14;letter-spacing:-1px;margin-bottom:1.25rem;max-width:680px}
        .lp-hero h1 em{font-style:normal;background:linear-gradient(135deg,#818cf8,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .lp-hero p{font-size:1rem;color:#64788f;max-width:460px;line-height:1.75;margin-bottom:2rem}
        .lp-hero-glow{position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%);top:-100px;right:-100px;pointer-events:none}
        .lp-btns{display:flex;gap:0.75rem;flex-wrap:wrap;justify-content:center}
        .lp-btn{display:inline-flex;align-items:center;gap:6px;padding:11px 24px;border-radius:7px;font-size:0.9rem;font-weight:600;cursor:pointer;border:none;transition:opacity 0.2s,transform 0.15s}
        .lp-btn:hover{transform:translateY(-1px);opacity:0.88}
        .lp-btn-primary{background:linear-gradient(135deg,#6366f1,#3b82f6);color:#fff;box-shadow:0 4px 15px rgba(99,102,241,0.3)}
        .lp-btn-ghost{background:transparent;color:#f0f6ff;border:1px solid rgba(255,255,255,0.15)!important}

        /* ── SECTIONS ── */
        .lp-sec{padding:80px 5vw}
        .lp-sec-alt{padding:80px 5vw;background:#0b1628}
        .lp-sec-center{text-align:center}
        .lp-sec-label{font-size:0.72rem;text-transform:uppercase;letter-spacing:1.5px;color:#818cf8;font-weight:600;margin-bottom:0.5rem}
        .lp-sec-title{font-size:clamp(1.5rem,3vw,2.1rem);font-weight:700;letter-spacing:-0.5px;margin-bottom:0.6rem}
        .lp-sec-sub{font-size:0.9rem;color:#64788f;line-height:1.7;max-width:440px;margin-bottom:2.5rem}

        /* ── PACKAGE CARDS ── */
        .lp-pkg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem}
        .lp-pkg-card{background:linear-gradient(145deg,rgba(15,30,54,0.95),rgba(11,22,40,0.9));border:1px solid rgba(99,102,241,0.13);border-radius:16px;padding:2rem 1.5rem;position:relative;transition:border-color 0.3s,transform 0.3s,box-shadow 0.3s;display:flex;flex-direction:column}
        .lp-pkg-card:hover{border-color:rgba(99,102,241,0.35);transform:translateY(-4px);box-shadow:0 8px 30px rgba(99,102,241,0.08)}
        .lp-pkg-card.pop{border-color:#6366f1;border-width:1.5px;box-shadow:0 0 30px rgba(99,102,241,0.1)}
        .lp-pop-tag{position:absolute;top:-1px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#6366f1,#3b82f6);color:#fff;font-size:0.68rem;font-weight:700;padding:3px 14px;border-radius:0 0 8px 8px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap}
        .lp-pkg-speed{display:inline-flex;align-items:center;gap:6px;font-size:0.72rem;color:#818cf8;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;padding:3px 10px;background:rgba(99,102,241,0.1);border-radius:20px;width:-moz-fit-content;width:fit-content}
        .lp-spd-dot{width:6px;height:6px;border-radius:50%;background:#22d3a0;animation:lp-pulse 2s ease-in-out infinite}
        @keyframes lp-pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .lp-pkg-name{font-size:1.15rem;font-weight:700;margin-bottom:0.75rem}
        .lp-pkg-price{display:flex;align-items:baseline;gap:3px;margin-bottom:4px}
        .lp-pkg-cur{font-size:0.9rem;color:#94a3b8;font-weight:500}
        .lp-pkg-amt{font-size:2.4rem;font-weight:800;line-height:1;background:linear-gradient(135deg,#f0f6ff,#a5b4fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .lp-pkg-per{font-size:0.78rem;color:#64788f}
        .lp-pkg-val{font-size:0.78rem;color:#64788f;margin-bottom:1.25rem}
        .lp-pkg-specs{list-style:none;display:flex;flex-direction:column;gap:0.6rem;margin-bottom:1.5rem;flex:1}
        .lp-spec{display:flex;align-items:center;gap:8px;font-size:0.82rem;color:#94a3b8}
        .lp-spec-icon{width:18px;height:18px;border-radius:50%;background:rgba(34,211,160,0.1);border:1px solid rgba(34,211,160,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .lp-pkg-btn{display:block;width:100%;text-align:center;padding:11px;border-radius:9px;font-size:0.875rem;font-weight:600;border:1.5px solid rgba(99,102,241,0.25);color:#a5b4fc;background:transparent;cursor:pointer;transition:all 0.25s;margin-top:auto}
        .lp-pkg-btn:hover,.lp-pkg-card.pop .lp-pkg-btn{background:linear-gradient(135deg,#6366f1,#3b82f6);color:#fff;border-color:transparent;box-shadow:0 4px 15px rgba(99,102,241,0.25)}
        .lp-pkg-note{font-size:0.7rem;color:#64788f;text-align:center;margin-top:8px}

        /* ── HOW IT WORKS ── */
        .lp-steps-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:2rem;max-width:800px;margin:0 auto}
        .lp-step{text-align:center}
        .lp-step-icon{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(59,130,246,0.1));border:1px solid rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;position:relative}
        .lp-step-num{position:absolute;top:-4px;right:-4px;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#3b82f6);color:#fff;font-size:0.7rem;font-weight:700;display:flex;align-items:center;justify-content:center}
        .lp-step h3{font-size:1rem;font-weight:700;margin-bottom:0.4rem}
        .lp-step p{font-size:0.82rem;color:#64788f;line-height:1.6;max-width:260px;margin:0 auto}
        .lp-sec-sub-center{font-size:0.9rem;color:#64788f;line-height:1.7;max-width:440px;margin:0 auto 3rem}

        /* ── CTA ── */
        .lp-cta{background:#0b1628;border-top:1px solid rgba(99,102,241,0.12);padding:70px 5vw;text-align:center}
        .lp-cta-wrap{max-width:600px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:0.75rem}
        .lp-cta h2{font-size:clamp(1.4rem,3vw,2rem);font-weight:700}
        .lp-cta p{color:#64788f;font-size:0.95rem}
        .lp-cta-ill{width:120px;height:80px;opacity:0.6;margin-bottom:0.5rem}

        /* ── LOADING ── */
        .lp-loading{text-align:center;padding:3rem;color:#64788f;font-size:0.875rem}
        .lp-spinner{display:inline-block;width:20px;height:20px;border:2px solid rgba(99,102,241,0.15);border-top-color:#6366f1;border-radius:50%;animation:lp-spin 0.8s linear infinite;margin-bottom:0.75rem}
        @keyframes lp-spin{to{transform:rotate(360deg)}}

        /* ── FOOTER ── */
        .lp-footer{background:#060d1a;border-top:1px solid rgba(255,255,255,0.05);padding:28px 5vw;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem}
        .lp-footer p{font-size:0.78rem;color:#64788f}
        .lp-foot-brand{display:flex;align-items:center;gap:8px;font-size:0.95rem;font-weight:700}
        .lp-foot-links{display:flex;gap:1.5rem;list-style:none}
        .lp-foot-links button{font-size:0.78rem;color:#64788f;background:none;border:none;cursor:pointer}
        .lp-foot-links button:hover{color:#818cf8}

        @media(max-width:600px){
          .lp-nav{padding:0 1.25rem}
          .lp-nl{display:none}
          .lp-sec,.lp-sec-alt{padding:60px 1.25rem}
          .lp-hero{padding:80px 1.25rem 50px}
          .lp-footer{flex-direction:column}
          .lp-pkg-grid{grid-template-columns:1fr}
          .lp-steps-grid{grid-template-columns:1fr}
        }
      `}</style>

      {/* NAV */}
      <nav className="lp-nav">
        <a href="#" className="lp-logo">
          <div className="lp-mark">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M2 9C2 5.7 4.7 3 8 3S14 5.7 14 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M5 9C5 7.3 6.3 6 8 6S11 7.3 11 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="8" cy="9" r="1.2" fill="white"/>
            </svg>
          </div>
          NetLink ISP
        </a>
        <div className="lp-nav-r">
          <button className="lp-nl" onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })}>Packages</button>
          <button className="lp-nl" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>How it works</button>
          <button className="lp-nb" onClick={() => navigate("/login")}>Login</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-glow" />
        <svg className="lp-hero-ill" viewBox="0 0 200 140" fill="none">
          <circle cx="100" cy="70" r="50" stroke="rgba(99,102,241,0.15)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="100" cy="70" r="32" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
          <circle cx="100" cy="70" r="8" fill="#6366f1" opacity="0.6" />
          <circle cx="100" cy="70" r="3" fill="#a5b4fc" />
          <circle cx="55" cy="42" r="4" fill="#6366f1" opacity="0.5" />
          <circle cx="145" cy="42" r="4" fill="#6366f1" opacity="0.5" />
          <circle cx="55" cy="98" r="4" fill="#6366f1" opacity="0.5" />
          <circle cx="145" cy="98" r="4" fill="#6366f1" opacity="0.5" />
          <circle cx="42" cy="70" r="4" fill="#6366f1" opacity="0.5" />
          <circle cx="158" cy="70" r="4" fill="#6366f1" opacity="0.5" />
          <line x1="58" y1="45" x2="93" y2="67" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
          <line x1="142" y1="45" x2="107" y2="67" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
          <line x1="58" y1="95" x2="93" y2="73" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
          <line x1="142" y1="95" x2="107" y2="73" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
          <line x1="46" y1="70" x2="92" y2="70" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
          <line x1="154" y1="70" x2="108" y2="70" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
          <path d="M80 110 Q100 120 120 110" stroke="rgba(99,102,241,0.15)" strokeWidth="1.5" fill="none" />
          <path d="M85 115 Q100 123 115 115" stroke="rgba(99,102,241,0.1)" strokeWidth="1" fill="none" />
        </svg>
        <h1>Fast, reliable internet<br />for <em>every home</em></h1>
        <p>Flexible plans, transparent pricing, and 24/7 support — pick the speed that fits your life.</p>
        <div className="lp-btns">
          <button className="lp-btn lp-btn-primary" onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })}>See packages</button>
          <button className="lp-btn lp-btn-ghost" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>How it works</button>
        </div>
      </section>

      {/* PACKAGES */}
      <section id="packages" className="lp-sec-alt">
        <p className="lp-sec-label">Pricing</p>
        <h2 className="lp-sec-title">Choose your plan</h2>
        <p className="lp-sec-sub">All plans include 24/7 support and access to your customer portal.</p>

        {pkgLoading ? (
          <div className="lp-loading"><div className="lp-spinner" /><br />Loading packages...</div>
        ) : activePkgs.length === 0 ? (
          <div className="lp-loading">No packages available right now.</div>
        ) : (
          <div className="lp-pkg-grid">
            {activePkgs.map((p, i) => {
              const popular = activePkgs.length > 1 && i === mid;
              return (
                <div key={p.id} className={`lp-pkg-card${popular ? " pop" : ""}`}>
                  {popular && <div className="lp-pop-tag">Most popular</div>}
                  <div className="lp-pkg-speed">
                    <div className="lp-spd-dot" />
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="#22d3a0"/></svg>
                    {p.speedMbps} Mbps
                  </div>
                  <div className="lp-pkg-name">{p.name}</div>
                  <div className="lp-pkg-price">
                    <span className="lp-pkg-cur">Rs.</span>
                    <span className="lp-pkg-amt">{Number(p.price).toLocaleString()}</span>
                    <span className="lp-pkg-per">{perPeriod(p.validity)}</span>
                  </div>
                  <div className="lp-pkg-val">{validityLabel(p.validity)}</div>
                  <ul className="lp-pkg-specs">
                    <li className="lp-spec">
                      <span className="lp-spec-icon"><svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="#22d3a0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                      {p.speedMbps} Mbps download &amp; upload
                    </li>
                    <li className="lp-spec">
                      <span className="lp-spec-icon"><svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="#22d3a0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                      No throttling or data caps
                    </li>
                    <li className="lp-spec">
                      <span className="lp-spec-icon"><svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="#22d3a0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                      24/7 customer support
                    </li>
                    {p.description && (
                      <li className="lp-spec">
                        <span className="lp-spec-icon"><svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="#22d3a0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                        {p.description}
                      </li>
                    )}
                  </ul>
                  <button className="lp-pkg-btn" onClick={handleSubscribe}>Subscribe now</button>
                  <p className="lp-pkg-note">Login required to subscribe</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="lp-sec lp-sec-center">
        <p className="lp-sec-label">How it works</p>
        <h2 className="lp-sec-title">Get connected in 3 easy steps</h2>
        <p className="lp-sec-sub-center">From choosing a plan to surfing the web — we keep it simple.</p>
        <div className="lp-steps-grid">
          <div className="lp-step">
            <div className="lp-step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <div className="lp-step-num">1</div>
            </div>
            <h3>Choose your plan</h3>
            <p>Browse our packages and pick the speed that fits your needs and budget.</p>
          </div>
          <div className="lp-step">
            <div className="lp-step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <div className="lp-step-num">2</div>
            </div>
            <h3>Sign up & subscribe</h3>
            <p>Create your account or log in, then subscribe to your chosen plan in seconds.</p>
          </div>
          <div className="lp-step">
            <div className="lp-step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
                <line x1="8" y1="14" x2="12" y2="14" />
                <line x1="14" y1="14" x2="16" y2="14" />
                <circle cx="9" cy="17" r="1" fill="#22d3a0" />
              </svg>
              <div className="lp-step-num">3</div>
            </div>
            <h3>Pay & get connected</h3>
            <p>Complete payment via JazzCash, EasyPaisa, or bank transfer and start enjoying fast internet.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="lp-cta">
        <div className="lp-cta-wrap">
          <svg className="lp-cta-ill" viewBox="0 0 120 60" fill="none">
            <rect x="10" y="15" width="100" height="30" rx="6" stroke="rgba(99,102,241,0.3)" strokeWidth="1" fill="rgba(99,102,241,0.05)" />
            <circle cx="30" cy="30" r="4" fill="#6366f1" opacity="0.5" />
            <circle cx="48" cy="30" r="4" fill="#6366f1" opacity="0.5" />
            <circle cx="66" cy="30" r="4" fill="#6366f1" opacity="0.5" />
            <circle cx="84" cy="30" r="4" fill="#6366f1" opacity="0.5" />
            <line x1="34" y1="30" x2="44" y2="30" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
            <line x1="52" y1="30" x2="62" y2="30" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
            <line x1="70" y1="30" x2="80" y2="30" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
            <path d="M40 48 Q60 55 80 48" stroke="rgba(99,102,241,0.15)" strokeWidth="1" fill="none" />
          </svg>
          <h2>Already a customer?</h2>
          <p>Log in to your portal to view your plan, pay bills, and track usage.</p>
          <button className="lp-btn lp-btn-primary" onClick={() => navigate("/login")}>Go to portal</button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-foot-brand">
          <div className="lp-mark" style={{ width: 22, height: 22 }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M2 9C2 5.7 4.7 3 8 3S14 5.7 14 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M5 9C5 7.3 6.3 6 8 6S11 7.3 11 9" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="8" cy="9" r="1.2" fill="white"/>
            </svg>
          </div>
          NetLink ISP
        </div>
        <ul className="lp-foot-links">
          <li><button onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })}>Packages</button></li>
          <li><button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>How it works</button></li>
          <li><button onClick={() => navigate("/login")}>Login</button></li>
        </ul>
        <p>© 2025 NetLink ISP</p>
      </footer>
    </div>
  );
}
