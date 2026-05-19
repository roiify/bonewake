/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        rarity: {
          3: '#9ca3af',
          4: '#a855f7',
          5: '#f59e0b',
        },
        element: {
          fire: '#ef4444',
          water: '#3b82f6',
          earth: '#84cc16',
          light: '#fde047',
          dark: '#8b5cf6',
        },
      },
      animation: {
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'shake': 'shake 0.4s ease-in-out',
      },
      keyframes: {
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [],
};
