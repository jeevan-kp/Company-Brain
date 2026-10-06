/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        company: {
          navy: '#1a2332',
          teal: '#0d9488',
          light: '#f8fafc',
          accent: '#14b8a6'
        }
      }
    },
  },
  plugins: [],
}
