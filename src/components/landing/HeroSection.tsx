'use client'

import Link from 'next/link'

export function HeroSection() {
  return (
    <section style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
      background: '#0d0614',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Keyframe styles ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes bloom1 {
          0%   { transform: translate(0px, 0px) scale(1); }
          100% { transform: translate(-40px, 30px) scale(1.15); }
        }
        @keyframes bloom2 {
          0%   { transform: translate(0px, 0px) scale(1); }
          100% { transform: translate(30px, -50px) scale(1.2); }
        }
        @keyframes bloom3 {
          0%   { transform: translate(0px, 0px) scale(1); }
          100% { transform: translate(-20px, 40px) scale(1.1); }
        }
        @keyframes tri1 {
          0%, 100% { opacity: 0.06; }
          50%       { opacity: 0.22; }
        }
        @keyframes tri2 {
          0%, 100% { opacity: 0.08; }
          50%       { opacity: 0.20; }
        }
        @keyframes tri3 {
          0%, 100% { opacity: 0.05; }
          50%       { opacity: 0.18; }
        }
        @keyframes tri4 {
          0%, 100% { opacity: 0.07; }
          50%       { opacity: 0.22; }
        }
        @keyframes tri5 {
          0%, 100% { opacity: 0.06; }
          50%       { opacity: 0.16; }
        }
        @keyframes tri6 {
          0%, 100% { opacity: 0.09; }
          50%       { opacity: 0.21; }
        }
        @keyframes tri7 {
          0%, 100% { opacity: 0.06; }
          50%       { opacity: 0.19; }
        }
        .bms-bloom1 {
          animation: bloom1 9s ease-in-out infinite alternate;
          animation-delay: 0s;
        }
        .bms-bloom2 {
          animation: bloom2 11s ease-in-out infinite alternate;
          animation-delay: -3s;
        }
        .bms-bloom3 {
          animation: bloom3 8s ease-in-out infinite alternate;
          animation-delay: -5s;
        }
        .bms-btn-primary {
          background: #7b2ff7;
          color: #fff;
          border: none;
          padding: 12px 28px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: background 0.2s, transform 0.15s;
        }
        .bms-btn-primary:hover { background: #6a25e0; transform: translateY(-1px); }
        .bms-btn-outline {
          background: transparent;
          color: #fff;
          border: 1.5px solid rgba(255,255,255,0.4);
          padding: 12px 28px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }
        .bms-btn-outline:hover {
          border-color: rgba(255,255,255,0.8);
          background: rgba(255,255,255,0.06);
          transform: translateY(-1px);
        }
      `}</style>

      {/* ── Bloom layers ────────────────────────────────────────────────── */}
      {/* Purple bloom — top-right */}
      <div className="bms-bloom1" style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '55%',
        height: '70%',
        background: 'rgba(160,0,255,0.35)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Fire-orange bloom — mid-right */}
      <div className="bms-bloom2" style={{
        position: 'absolute',
        top: '30%',
        right: '5%',
        width: '35%',
        height: '45%',
        background: 'rgba(255,60,0,0.2)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Blue bloom — center-right */}
      <div className="bms-bloom3" style={{
        position: 'absolute',
        top: '20%',
        right: '20%',
        width: '30%',
        height: '40%',
        background: 'rgba(0,140,255,0.2)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* ── Low-poly SVG mesh ────────────────────────────────────────────── */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Triangles — breathing opacity */}
        <polygon points="0,0 520,0 280,320"         fill="rgba(160,0,255,1)"  style={{ animation: 'tri1 6s ease-in-out infinite', animationDelay: '0s',    opacity: 0.06 }} />
        <polygon points="520,0 1440,0 900,260"       fill="rgba(255,60,0,1)"   style={{ animation: 'tri2 6s ease-in-out infinite', animationDelay: '-1.2s', opacity: 0.08 }} />
        <polygon points="0,0 280,320 0,600"          fill="rgba(0,140,255,1)"  style={{ animation: 'tri3 6s ease-in-out infinite', animationDelay: '-2.1s', opacity: 0.05 }} />
        <polygon points="280,320 900,260 620,600"    fill="rgba(160,0,255,1)"  style={{ animation: 'tri4 6s ease-in-out infinite', animationDelay: '-0.7s', opacity: 0.07 }} />
        <polygon points="900,260 1440,0 1440,500"    fill="rgba(255,60,0,1)"   style={{ animation: 'tri5 6s ease-in-out infinite', animationDelay: '-3.0s', opacity: 0.06 }} />
        <polygon points="0,600 620,600 280,900"      fill="rgba(0,140,255,1)"  style={{ animation: 'tri6 6s ease-in-out infinite', animationDelay: '-1.8s', opacity: 0.09 }} />
        <polygon points="620,600 1440,500 1440,900"  fill="rgba(160,0,255,1)"  style={{ animation: 'tri7 6s ease-in-out infinite', animationDelay: '-4.2s', opacity: 0.06 }} />

        {/* Edge lines */}
        <line x1="0"   y1="0"   x2="520" y2="0"   stroke="rgba(200,108,255,0.12)" strokeWidth="0.5" />
        <line x1="520" y1="0"   x2="280" y2="320"  stroke="rgba(200,108,255,0.10)" strokeWidth="0.5" />
        <line x1="280" y1="320" x2="0"   y2="0"    stroke="rgba(0,140,255,0.12)"   strokeWidth="0.5" />
        <line x1="520" y1="0"   x2="1440" y2="0"   stroke="rgba(255,60,0,0.10)"    strokeWidth="0.5" />
        <line x1="1440" y1="0"  x2="900" y2="260"  stroke="rgba(255,60,0,0.12)"    strokeWidth="0.5" />
        <line x1="900" y1="260" x2="520" y2="0"    stroke="rgba(200,108,255,0.10)" strokeWidth="0.5" />
        <line x1="280" y1="320" x2="900" y2="260"  stroke="rgba(200,108,255,0.10)" strokeWidth="0.5" />
        <line x1="900" y1="260" x2="620" y2="600"  stroke="rgba(255,60,0,0.10)"    strokeWidth="0.5" />
        <line x1="620" y1="600" x2="280" y2="320"  stroke="rgba(0,140,255,0.12)"   strokeWidth="0.5" />
        <line x1="900" y1="260" x2="1440" y2="500" stroke="rgba(255,60,0,0.12)"    strokeWidth="0.5" />
        <line x1="1440" y1="500" x2="1440" y2="0"  stroke="rgba(200,108,255,0.08)" strokeWidth="0.5" />
        <line x1="0"   y1="600" x2="620" y2="600"  stroke="rgba(0,140,255,0.12)"   strokeWidth="0.5" />
        <line x1="620" y1="600" x2="1440" y2="500" stroke="rgba(255,60,0,0.10)"    strokeWidth="0.5" />
        <line x1="0"   y1="600" x2="280" y2="900"  stroke="rgba(0,140,255,0.10)"   strokeWidth="0.5" />

        {/* Vertex dots */}
        <circle cx="280"  cy="320" r="2.5" fill="#a000ff" opacity="0.5" />
        <circle cx="520"  cy="0"   r="2"   fill="#c86cff" opacity="0.45" />
        <circle cx="900"  cy="260" r="2.5" fill="#ff3c00" opacity="0.4" />
        <circle cx="620"  cy="600" r="2"   fill="#008cff" opacity="0.45" />
        <circle cx="1440" cy="500" r="2"   fill="#ff3c00" opacity="0.35" />
        <circle cx="0"    cy="600" r="2"   fill="#008cff" opacity="0.3" />
        <circle cx="280"  cy="900" r="2"   fill="#a000ff" opacity="0.3" />
      </svg>

      {/* ── Hero content ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        padding: '45px 48px 80px',
        maxWidth: '720px',
      }}>
        <div>
          {/* Headline */}
          <h1 style={{
            margin: '0 0 24px',
            lineHeight: 1.05,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            fontSize: 'clamp(52px, 7vw, 72px)',
          }}>
            <span style={{ display: 'block', color: '#ffffff' }}>Your business.</span>
            <span style={{ display: 'block', color: '#c86cff' }}>Supercharged</span>
            <span style={{ display: 'block', color: '#ffffff' }}>by AI.</span>
          </h1>

          {/* Subtext */}
          <p style={{
            margin: '0 0 36px',
            fontSize: '18px',
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.6)',
            maxWidth: '540px',
            fontWeight: 400,
          }}>
            I help businesses grow smarter with AI — from custom websites and marketing
            automation to social media strategy and intelligent lead generation.
            Less manual work, more results.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
            <Link href="/signup"  className="bms-btn-primary">Get Started</Link>
            <Link href="/booking" className="bms-btn-outline">Book a Demo</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
