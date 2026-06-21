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
          crimson:   '#C0152A',  // Updated primary brand red to premium crimson
          crimson_light: '#FF4D6A',
          crimson_dark:  '#800F1C',
          rose:      '#FFF5F5',  // Background tint
          midnight:  '#07070A',  // Deeper obsidian black
          gold:      '#F59E0B',  // Accent / warnings
          emerald:   '#10B981',  // Available / success
          slate:     '#475569',  // Secondary text
          glass:     'rgba(255, 255, 255, 0.03)', // Premium Glassmorphism
          glass_dark: 'rgba(7, 7, 10, 0.8)',
        }
      },
      fontFamily: {
        heading: ['"Sora"', 'sans-serif'], // Updated to Sora font
        body: ['"Inter"', 'sans-serif'],    // Updated to Inter font
        mono: ['"Space Grotesk"', 'sans-serif'], // Updated to Space Grotesk font
      },
      animation: {
        'pulse-slow': 'pulse 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.12)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.12)' },
          '70%': { transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
