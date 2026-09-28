/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Node-inspired brand ramp anchored on #5FA04E. The key names are
        // deliberately unchanged from the previous ramp so every existing
        // `accent-*` class across the content pages keeps resolving - only the
        // values move.
        accent: {
          50: '#F2F8F1',
          100: '#E0EFE0',
          200: '#C2DFC1',
          300: '#9BC79A',
          400: '#74AC73',
          500: '#5FA04E',
          600: '#4A8A3C',
          700: '#3A6B30',
          800: '#2D5227',
          900: '#244020',
          950: '#121D0F'
        },
        // Neutral surface family. Repointed to grays so it reads as "ink" on a
        // light page rather than the warm near-black the dark code blocks used.
        ink: {
          DEFAULT: '#1a1a1a',
          50: '#F7F7F7',
          700: '#e5e5e5',
          800: '#f0f0f0',
          900: '#fafafa',
          950: '#1a1a1a'
        }
      },
      fontFamily: {
        heading: ['"Open Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Open Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },
      maxWidth: {
        '8xl': '88rem'
      }
    }
  },
  plugins: []
}
