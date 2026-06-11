import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        sidebar: {
          DEFAULT: 'rgb(var(--sidebar) / <alpha-value>)',
          foreground: 'rgb(var(--sidebar-foreground) / <alpha-value>)',
          primary: {
            DEFAULT: 'rgb(var(--sidebar-primary) / <alpha-value>)',
            foreground: 'rgb(var(--sidebar-primary-foreground) / <alpha-value>)',
          },
          accent: {
            DEFAULT: 'rgb(var(--sidebar-accent) / <alpha-value>)',
            foreground: 'rgb(var(--sidebar-accent-foreground) / <alpha-value>)',
          },
          border: 'rgb(var(--sidebar-border) / <alpha-value>)',
        },
        forest: 'rgb(var(--forest) / <alpha-value>)',
        'off-white': 'rgb(var(--off-white) / <alpha-value>)',
        sacramento: 'rgb(var(--sacramento) / <alpha-value>)',
        onyx: 'rgb(var(--onyx) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}

export default config
