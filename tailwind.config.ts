import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Neutral zinc-based darks — no blue tint, professional
        'bms-dark':       '#09090b',
        'bms-darker':     '#050507',
        'bms-card':       '#101014',
        'bms-card-hover': '#16161d',
        // Primary — vivid teal/cyan (more saturated than before)
        'bms-cyan':       '#06b6d4',
        'bms-cyan-dark':  '#0891b2',
        // Secondary — electric indigo
        'bms-purple':     '#818cf8',
        'bms-purple-dark':'#6366f1',
        // Accent — warm amber (new, adds warmth + variety)
        'bms-amber':      '#f59e0b',
        'bms-amber-dark': '#d97706',
        // Structure
        'bms-border':       '#27272a',
        'bms-border-light': '#3f3f46',
        'bms-text':         '#fafafa',
        'bms-muted':        '#71717a',
      },
      fontFamily: {
        sans:    ['var(--font-sans)',    'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)',    'monospace'],
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':   'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient':    'linear-gradient(135deg, #09090b 0%, #0c0c10 50%, #09090b 100%)',
        'card-gradient':    'linear-gradient(135deg, #101014 0%, #16161d 100%)',
        'cyan-gradient':    'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        'purple-gradient':  'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
        'amber-gradient':   'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'glow-cyan':        'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
        'glow-purple':      'radial-gradient(circle, rgba(129,140,248,0.10) 0%, transparent 70%)',
        'glow-amber':       'radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)',
      },
      animation: {
        'float':        'float 6s ease-in-out infinite',
        'pulse-slow':   'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':         'glow 2s ease-in-out infinite alternate',
        'slide-up':     'slideUp 0.6s ease-out',
        'fade-in':      'fadeIn 0.8s ease-out',
        'spin-slow':    'spin 20s linear infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'border-glow':  'borderGlow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 5px rgba(6,182,212,0.35)' },
          '100%': { boxShadow: '0 0 20px rgba(6,182,212,0.55), 0 0 40px rgba(6,182,212,0.15)' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        borderGlow: {
          '0%':   { borderColor: 'rgba(6,182,212,0.2)' },
          '100%': { borderColor: 'rgba(6,182,212,0.55)' },
        },
      },
      boxShadow: {
        'cyan-glow':    '0 0 20px rgba(6,182,212,0.22)',
        'cyan-glow-lg': '0 0 40px rgba(6,182,212,0.30)',
        'purple-glow':  '0 0 20px rgba(129,140,248,0.22)',
        'amber-glow':   '0 0 20px rgba(245,158,11,0.25)',
        'card':         '0 4px 24px rgba(0,0,0,0.6)',
        'card-hover':   '0 8px 40px rgba(6,182,212,0.08)',
      },
    },
  },
  plugins: [],
}

export default config
