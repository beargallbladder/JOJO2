import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gravity: {
          bg: '#08090C',
          surface: '#0E1117',
          elevated: '#151921',
          border: '#1E2330',
          text: '#F0F2F5',
          'text-secondary': '#8B92A5',
          'text-whisper': '#4A5168',
          accent: '#3B82F6',
        },
        risk: {
          critical: '#EF4444',
          'critical-deep': '#DC2626',
          high: '#EAB308',
          'high-amber': '#F59E0B',
          medium: '#22C55E',
          'medium-lime': '#84CC16',
          low: '#3B82F6',
          'low-deep': '#2563EB',
        },
        pillar: {
          present: '#22C55E',
          absent: '#EF4444',
          unknown: '#4A5168',
        },
        score: {
          c: '#A78BFA',
          s: '#2DD4BF',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fade-in 0.4s ease-out',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.005)', opacity: '0.95' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
