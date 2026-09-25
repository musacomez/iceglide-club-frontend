import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff8ff',
          100: '#dbeffe',
          200: '#bfe5fe',
          300: '#93d5fd',
          400: '#5fbdfa',
          500: '#3aa1f2',
          600: '#2681e6',
          700: '#1f68d1',
          800: '#1f54a9',
          900: '#1f4885',
          950: '#182d51',
        },
        ice: {
          50: '#f4fbfd',
          100: '#e6f6fb',
          900: '#0b2436',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 6px -1px rgb(15 23 42 / 0.06)',
        popover: '0 12px 32px -8px rgb(15 23 42 / 0.25)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
