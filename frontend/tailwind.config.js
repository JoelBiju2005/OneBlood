/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ob: {
          // Primary red scale
          'red-50':  '#FFF5F5',
          'red-100': '#FFE0E0',
          'red-200': '#FFB3B3',
          'red-300': '#FF8080',
          'red-400': '#FF4D4D',
          'red-500': '#EF2D2D',
          'red-600': '#D41B1B',
          'red-700': '#C0152A',
          'red-800': '#9B1122',
          'red-900': '#7A0D1A',
          'red-950': '#450812',

          // Neutral ink scale
          'ink':     '#07070A',
          'ink-90':  '#0C0C10',
          'ink-80':  '#111116',
          'ink-70':  '#18181D',
          'ink-60':  '#1F1F26',
          'ink-50':  '#27272F',
          'ink-40':  '#333340',
          'ink-30':  '#4A4A5A',
          'ink-20':  '#6B6B80',
          'ink-10':  '#9393A8',

          // Semantic
          'white':   '#F5F5F7',
          'muted':   '#9393A8',
          'success': '#10B981',
          'warning': '#F59E0B',
          'danger':  '#EF4444',
          'info':    '#3B82F6',

          // Glass
          'glass':        'rgba(255, 255, 255, 0.03)',
          'glass-border': 'rgba(255, 255, 255, 0.06)',
          'glass-hover':  'rgba(255, 255, 255, 0.08)',
        },
        // Keep backward compat for pages not yet migrated
        oneblood: {
          crimson:       '#C0152A',
          crimson_light: '#FF4D6A',
          crimson_dark:  '#800F1C',
          rose:          '#FFF5F5',
          midnight:      '#07070A',
          gold:          '#F59E0B',
          emerald:       '#10B981',
          slate:         '#475569',
          glass:         'rgba(255, 255, 255, 0.03)',
          glass_dark:    'rgba(7, 7, 10, 0.8)',
        }
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans:    ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        // Keep backward compat
        heading: ['"DM Serif Display"', 'Georgia', 'serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm':   '6px',
        'md':   '8px',
        'lg':   '12px',
        'xl':   '16px',
        '2xl':  '20px',
        '3xl':  '24px',
        'pill': '9999px',
      },
      boxShadow: {
        'card':      '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.24)',
        'raised':    '0 4px 14px rgba(0,0,0,0.4)',
        'float':     '0 16px 48px rgba(0,0,0,0.5)',
        'glow-red':  '0 0 20px rgba(192,21,42,0.35), 0 0 60px rgba(192,21,42,0.12)',
        'glow-green':'0 0 20px rgba(16,185,129,0.3), 0 0 60px rgba(16,185,129,0.1)',
      },
      animation: {
        'pulse-slow':   'pulse 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat':    'heartbeat 1.5s ease-in-out infinite',
        'hero-glow':    'heroGlow 4s ease-in-out infinite',
        'float':        'float 6s ease-in-out infinite',
        'slide-up':     'slideUp 0.5s ease-out',
        'draw-pulse':   'drawPulse 2s ease-in-out infinite',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%':      { transform: 'scale(1.12)' },
          '28%':      { transform: 'scale(1)' },
          '42%':      { transform: 'scale(1.12)' },
          '70%':      { transform: 'scale(1)' },
        },
        heroGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%':      { opacity: '0.7', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drawPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
