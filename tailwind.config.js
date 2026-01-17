/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0a0a0a',
          surface: '#1a1a1a',
          border: '#2a2a2a',
          text: '#e0e0e0',
          accent: '#00ff00',
          warning: '#ffaa00',
          error: '#ff0000',
        },
        dependent: {
          noah: '#4a9eff',
          leia: '#ff6b9d',
        }
      },
      fontFamily: {
        mono: ['Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
