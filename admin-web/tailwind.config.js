/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm Indian Tea Palette
        primary: {
          50: '#fef8f3',   // Light cream
          100: '#fef1e7',  // Pale tea
          200: '#fde4cd',  // Soft amber
          300: '#fbc697',  // Light chai
          400: '#f7a860',  // Golden tea
          500: '#d97706',  // Rich amber (main)
          600: '#c2670a',  // Deep chai
          700: '#a0560d',  // Burnt amber
          800: '#824710',  // Dark masala
          900: '#6b3b11',  // Deep brown
        },
        wood: {
          50: '#faf8f5',
          100: '#f5f0e8',
          200: '#e8dcc8',
          300: '#d4c3a3',
          400: '#b8a07a',
          500: '#9d7f54',  // Main wooden tone
          600: '#7d6643',
          700: '#5f4e35',
          800: '#463828',
          900: '#2d241b',
        },
        chai: {
          light: '#f7a860',
          DEFAULT: '#d97706',
          dark: '#a0560d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(217, 119, 6, 0.1), 0 4px 6px -4px rgba(217, 119, 6, 0.1)',
        'soft-lg': '0 10px 25px -5px rgba(217, 119, 6, 0.15), 0 8px 10px -6px rgba(217, 119, 6, 0.1)',
        'warm': '0 4px 20px rgba(217, 119, 6, 0.2)',
      },
      animation: {
        'gentle-pulse': 'gentle-pulse 3s ease-in-out infinite',
        'slow-float': 'slow-float 6s ease-in-out infinite',
      },
      keyframes: {
        'gentle-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'slow-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
