/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        'primary-dark': '#001C44',
        'primary-light': '#002A66',
        'accent': '#FFD66D',
        'accent-hover': '#FFC947',
      }
    },
  },
  plugins: [],
}

