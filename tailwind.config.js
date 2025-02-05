/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        bubble: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.01)' }
        }
      },
      animation: {
        bubble: 'bubble 0.5s ease-in-out infinite'
      }
    }
  },
  plugins: [],
}

