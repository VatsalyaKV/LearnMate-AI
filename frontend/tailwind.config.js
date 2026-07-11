/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a' },
        secondary: { 500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9' },
        accent: { 500:'#06b6d4',600:'#0891b2' },
        success: { 500:'#22c55e',600:'#16a34a' },
        warning: { 500:'#f59e0b',600:'#d97706' },
        danger: { 500:'#ef4444',600:'#dc2626' },
      },
      fontFamily: { sans: ['-apple-system','BlinkMacSystemFont','Segoe UI','Roboto','sans-serif'] },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}
