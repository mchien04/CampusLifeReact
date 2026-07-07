/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5fa',
          100: '#e1ebf4',
          200: '#c3d7e8',
          300: '#a5c4db',
          400: '#87b0cf',
          500: '#699cc2',
          600: '#4b88b6',
          700: '#2d74a9',
          800: '#002A66',
          900: '#001C44',
        },
        'primary-dark': '#001C44',
        'primary-light': '#002A66',
        'accent': '#FFD66D',
        'accent-hover': '#FFC947',
        'surface-dark': '#121212',
        'surface-subtle': '#f9fafb'
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(0, 28, 68, 0.08)',
        'premium-hover': '0 20px 40px -10px rgba(0, 28, 68, 0.12)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.6)'
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
