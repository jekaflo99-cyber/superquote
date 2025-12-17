/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          pulse: '#00FF72',   // Primary
          mint: '#39FFA0',    // Secondary / Hover
          mist: '#00E05C',    // Detail / Active
        },
        dark: {
          carbon: '#0E0E0F',  // Main Background
          graphite: '#1A1A1C',// Cards / Sections
          steel: '#2B2B2E',   // Borders
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#C4C4C8',
          dim: '#8A8A8D',
        }
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        }
      }
    },
  },
  plugins: [],
}