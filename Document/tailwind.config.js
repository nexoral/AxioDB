/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Bun-inspired brand ramp anchored on #FF2E97 (primary CTA pink),
        // #D60066 (secondary) and a warm near-black surface family.
        accent: {
          50: '#FFF1F7',
          100: '#FFE4EF',
          200: '#FFC9DF',
          300: '#FF9EC5',
          400: '#FF5FA3',
          500: '#FF2E97',
          600: '#D60066',
          700: '#B00054',
          800: '#8A0041',
          900: '#6B0033',
          950: '#45001F'
        },
        ink: {
          DEFAULT: '#0D0A0C',
          50: '#F6F4F5',
          700: '#241C21',
          800: '#1A1418',
          900: '#120E10',
          950: '#0D0A0C'
        }
      },
      fontFamily: {
        heading: [
          'Archivo',
          'ui-sans-serif',
          'system-ui',
          'sans-serif'
        ],
        body: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ]
      },
      maxWidth: {
        '8xl': '88rem'
      }
    }
  },
  plugins: []
}
