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
        oneblood: {
          crimson:   '#B91C1C',  // Primary brand red
          crimson_light: '#DC2626',
          crimson_dark:  '#7F1D1D',
          rose:      '#FEF2F2',  // Background tint
          midnight:  '#0F0A0A',  // Dark backgrounds
          gold:      '#F59E0B',  // Accent / warnings
          emerald:   '#059669',  // Available / success
          slate:     '#334155',  // Secondary text
          glass:     'rgba(255, 255, 255, 0.08)', // Glassmorphism
          glass_dark: 'rgba(15, 10, 10, 0.75)',
        }
      },
      fontFamily: {
        heading: ['"DM Serif Display"', 'serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.15)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.15)' },
          '70%': { transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
