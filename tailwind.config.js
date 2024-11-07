// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        zinc: {
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
        blue: {
          300: '#93c5fd',
          400: '#60a5fa',
        },
      },
      opacity: {
        '50': '0.5',
      },
      spacing: {
        '96': '24rem',
      },
      minHeight: {
        'screen': '100vh',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}