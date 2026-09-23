/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './AdminView.tsx',
    './LoginScreen.tsx',
    './AuthContext.tsx',
    './SettingsView.tsx',
    './components/**/*.{js,ts,jsx,tsx}',
    './views/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'float-up-fade': 'float-up-fade 1s ease-out forwards',
      },
    },
  },
  plugins: [],
};
