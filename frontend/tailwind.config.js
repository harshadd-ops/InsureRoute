/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class', // We don't really use this explicitly now, using light by default
  theme: {
    extend: {
      colors: {
        bg:       '#f8fafc', // slate-50
        surface:  '#ffffff', // white
        border:   '#e2e8f0', // slate-200
        primary:  '#eab308', // yellow-500
        success:  '#16a34a', // green-600
        warning:  '#f59e0b', // amber-500
        danger:   '#dc2626', // red-600
        muted:    '#64748b', // slate-500
        text:     '#0f172a', // slate-900
        subtle:   '#94a3b8', // slate-400
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':        '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover':  '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
}
