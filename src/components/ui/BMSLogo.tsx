// Simplistic QFP chip icon — matches the 3D microchip aesthetic
export function BMSLogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer chip package */}
      <rect x="8" y="8" width="20" height="20" rx="2.5" stroke="#06b6d4" strokeWidth="1.4" />

      {/* Left pins */}
      <line x1="8"  y1="12" x2="4"  y2="12" stroke="#06b6d4" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="8"  y1="16" x2="4"  y2="16" stroke="#06b6d4" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="8"  y1="20" x2="4"  y2="20" stroke="#06b6d4" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="8"  y1="24" x2="4"  y2="24" stroke="#06b6d4" strokeWidth="1.3" strokeLinecap="round" />

      {/* Right pins */}
      <line x1="28" y1="12" x2="32" y2="12" stroke="#06b6d4" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="28" y1="16" x2="32" y2="16" stroke="#06b6d4" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="28" y1="20" x2="32" y2="20" stroke="#06b6d4" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="28" y1="24" x2="32" y2="24" stroke="#06b6d4" strokeWidth="1.3" strokeLinecap="round" />

      {/* Top pins */}
      <line x1="13" y1="8" x2="13" y2="4" stroke="#818cf8" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="18" y1="8" x2="18" y2="4" stroke="#818cf8" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="23" y1="8" x2="23" y2="4" stroke="#818cf8" strokeWidth="1.3" strokeLinecap="round" />

      {/* Bottom pins */}
      <line x1="13" y1="28" x2="13" y2="32" stroke="#818cf8" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="18" y1="28" x2="18" y2="32" stroke="#818cf8" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="23" y1="28" x2="23" y2="32" stroke="#818cf8" strokeWidth="1.3" strokeLinecap="round" />

      {/* Inner die area */}
      <rect x="12" y="12" width="12" height="12" rx="1.5" fill="#06b6d4" fillOpacity="0.08" stroke="#06b6d4" strokeWidth="0.8" />

      {/* Cross-hatch lines on die */}
      <line x1="12" y1="18" x2="24" y2="18" stroke="#06b6d4" strokeWidth="0.5" strokeOpacity="0.4" />
      <line x1="18" y1="12" x2="18" y2="24" stroke="#06b6d4" strokeWidth="0.5" strokeOpacity="0.4" />

      {/* Pin-1 indicator dot — amber */}
      <circle cx="13.5" cy="13.5" r="1.2" fill="#f59e0b" />
    </svg>
  )
}

// Full wordmark: icon + "BMS Services" text
export function BMSWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BMSLogoIcon />
      <span
        style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
        className="text-sm font-bold tracking-tight text-bms-text"
      >
        BMS<span className="text-bms-cyan ml-1">Services</span>
      </span>
    </span>
  )
}
