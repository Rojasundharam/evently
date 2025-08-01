/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Main brand colors
        primary: {
          DEFAULT: '#0b6d41', // Green
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#0b6d41',
          800: '#065F46',
          900: '#064E3B',
        },
        // Secondary colors
        secondary: {
          DEFAULT: '#ffde59', // Yellow
          50: '#FFFBE6',
          100: '#FFF7CC',
          200: '#FFF0B3',
          300: '#FFEA99',
          400: '#FFE380',
          500: '#FFDD66',
          600: '#ffde59',
          700: '#E5C23D',
          800: '#BFA632',
          900: '#998A27',
        },
        // Text colors
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // Background colors
        background: {
          DEFAULT: '#FFFFFF', // White
          dark: '#1F2937',
        },
        // Surface colors for cards, modals, etc.
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F3F4F6',
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
        poppins: ["var(--font-poppins)", "sans-serif"],
      },
      // Border radius
      borderRadius: {
        'sm': '0.25rem',
        DEFAULT: '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
      },
      // Box shadows
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'card': '0 2px 4px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)'
      },
    },
  },
  plugins: [],
}; 