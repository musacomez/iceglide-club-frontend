import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dce8ff',
          200: '#b9d1ff',
          300: '#8aafff',
          400: '#577fff',
          500: '#365dff',
          600: '#2547df',
          700: '#2039b5',
          800: '#1e3294',
          900: '#1c2e75',
          950: '#141e4e',
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
