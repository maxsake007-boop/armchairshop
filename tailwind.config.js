/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0052FF',
          hover: '#003EC7',
          dark: '#0038B6',
          container: '#EBF2FF',
          'container-dark': '#001452',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#121212',
          light: '#F8F9FA',
          'light-dark': '#1E1E1E',
          card: '#F3F4F5',
          'card-dark': '#262626',
        },
        charcoal: {
          DEFAULT: '#1A1A1B',
          muted: '#71717A',
        },
        tg: {
          bg: 'var(--tg-theme-bg-color, #ffffff)',
          text: 'var(--tg-theme-text-color, #1a1a1b)',
          hint: 'var(--tg-theme-hint-color, #71717a)',
          button: 'var(--tg-theme-button-color, #0052ff)',
          'button-text': 'var(--tg-theme-button-text-color, #ffffff)',
          'secondary-bg': 'var(--tg-theme-secondary-bg-color, #f8f9fa)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'button': '24px',
      },
      boxShadow: {
        'floating': '0 4px 20px rgba(0, 0, 0, 0.04)',
        'floating-dark': '0 4px 20px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};
