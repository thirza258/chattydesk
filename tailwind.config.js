module.exports = {
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F9F8F5',
          raised: '#FFFFFF',
          sunken: '#EFECE6',
        },
        ink: {
          DEFAULT: '#18181B',
          soft: '#52525B',
          faint: '#8C887B',
        },
        rust: {
          DEFAULT: '#C2410C',
          deep: '#9A3412',
          soft: '#FFF7ED',
        },
        pine: {
          DEFAULT: '#15803D',
          soft: '#F0FDF4',
        },
        ember: {
          DEFAULT: '#B91C1C',
          soft: '#FEF2F2',
        },
        hairline: {
          DEFAULT: '#E4E2DC',
          strong: '#CBC7BD',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0f172a',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        display: [
          'Newsreader',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        tactile: '4px 4px 0 0 #C6BEA8',
        'tactile-sm': '2px 2px 0 0 #C6BEA8',
        'tactile-lg': '6px 6px 0 0 #C6BEA8',
      },
    },
  },
  variants: {},
  plugins: [],
};
