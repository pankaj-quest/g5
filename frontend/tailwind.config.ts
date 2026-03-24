import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        '2xl': '16px',
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      // Surface backgrounds
      addUtilities({
        '.bg-surface': { 'background-color': 'var(--surface-0)' },
        '.bg-surface-1': { 'background-color': 'var(--surface-1)' },
        '.bg-surface-2': { 'background-color': 'var(--surface-2)' },
        '.bg-surface-3': { 'background-color': 'var(--surface-3)' },
        '.bg-surface-4': { 'background-color': 'var(--surface-4)' },
        '.bg-surface\\/50': { 'background-color': 'color-mix(in srgb, var(--surface-0) 50%, transparent)' },

        // Border colors
        '.border-border': { 'border-color': 'var(--border)' },
        '.border-border-subtle': { 'border-color': 'var(--border-subtle)' },
        '.border-border-strong': { 'border-color': 'var(--border-strong)' },

        // Text colors
        '.text-text-primary': { 'color': 'var(--text-primary)' },
        '.text-text-secondary': { 'color': 'var(--text-secondary)' },
        '.text-text-tertiary': { 'color': 'var(--text-tertiary)' },
        '.text-text-quaternary': { 'color': 'var(--text-quaternary)' },

        // Accent
        '.bg-accent-muted': { 'background-color': 'var(--accent-muted)' },
        '.bg-accent-hover': { 'background-color': 'var(--accent-hover)' },

        // Buttons
        '.bg-btn-bg': { 'background-color': 'var(--btn-bg)' },
        '.text-btn-text': { 'color': 'var(--btn-text)' },
        '.bg-btn-hover': { 'background-color': 'var(--btn-hover)' },

        // Bg for text-quaternary used on loading dots
        '.bg-text-quaternary': { 'background-color': 'var(--text-quaternary)' },
        '.bg-border-strong': { 'background-color': 'var(--border-strong)' },

        // Dividers
        '.divide-border > :not([hidden]) ~ :not([hidden])': { 'border-color': 'var(--border)' },

        // Hover states
        '.hover\\:bg-accent-muted:hover': { 'background-color': 'var(--accent-muted)' },
        '.hover\\:bg-btn-hover:hover': { 'background-color': 'var(--btn-hover)' },
        '.hover\\:text-text-primary:hover': { 'color': 'var(--text-primary)' },
        '.hover\\:text-text-secondary:hover': { 'color': 'var(--text-secondary)' },
        '.hover\\:border-border-strong:hover': { 'border-color': 'var(--border-strong)' },

        // Focus states
        '.focus\\:ring-accent-hover:focus': { '--tw-ring-color': 'var(--accent-hover)' },
        '.focus\\:border-border-strong:focus': { 'border-color': 'var(--border-strong)' },

        // Placeholder
        '.placeholder\\:text-text-quaternary::placeholder': { 'color': 'var(--text-quaternary)' },
        '.placeholder-text-quaternary::placeholder': { 'color': 'var(--text-quaternary)' },

        // Decoration
        '.decoration-border-strong': { 'text-decoration-color': 'var(--border-strong)' },

        // Radix UI data-attribute states
        '[data-highlighted].data-highlighted\\:bg-accent-muted, .data-highlighted\\:bg-accent-muted[data-highlighted]': { 'background-color': 'var(--accent-muted)' },
        '[data-highlighted].data-highlighted\\:text-text-primary, .data-highlighted\\:text-text-primary[data-highlighted]': { 'color': 'var(--text-primary)' },
        '[data-placeholder].data-placeholder\\:text-text-quaternary, .data-placeholder\\:text-text-quaternary[data-placeholder]': { 'color': 'var(--text-quaternary)' },
        '[data-state="checked"].data-state-checked\\:text-text-primary': { 'color': 'var(--text-primary)' },

        // Surface hover/bg variants
        '.bg-surface-4': { 'background-color': 'var(--surface-4)' },
        '.hover\\:bg-surface-4:hover': { 'background-color': 'var(--surface-4)' },
      })
    }),
  ],
} satisfies Config
