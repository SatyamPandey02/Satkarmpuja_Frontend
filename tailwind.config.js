import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
        saffron: {
          50: "oklch(0.985 0.015 75)",
          100: "oklch(0.96 0.04 72)",
          200: "oklch(0.92 0.08 68)",
          300: "oklch(0.85 0.13 62)",
          400: "oklch(0.76 0.17 57)",
          500: "oklch(0.66 0.20 53)",
          600: "oklch(0.57 0.20 50)",
          700: "oklch(0.47 0.17 46)",
          800: "oklch(0.37 0.13 42)",
          900: "oklch(0.27 0.09 38)",
        },
        gold: {
          50: "oklch(0.99 0.01 90)",
          100: "oklch(0.97 0.03 87)",
          200: "oklch(0.93 0.07 85)",
          300: "oklch(0.88 0.11 82)",
          400: "oklch(0.82 0.14 78)",
          500: "oklch(0.74 0.14 74)",
          600: "oklch(0.62 0.12 68)",
          700: "oklch(0.52 0.10 62)",
          800: "oklch(0.40 0.08 55)",
          900: "oklch(0.30 0.06 48)",
        },
        maroon: {
          50: "oklch(0.97 0.01 30)",
          100: "oklch(0.93 0.03 30)",
          200: "oklch(0.85 0.07 28)",
          300: "oklch(0.74 0.11 26)",
          400: "oklch(0.58 0.15 24)",
          500: "oklch(0.43 0.17 22)",
          600: "oklch(0.35 0.16 20)",
          700: "oklch(0.27 0.13 18)",
          800: "oklch(0.20 0.10 16)",
          900: "oklch(0.14 0.07 14)",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        serif: ["Instrument Serif", "Georgia", "serif"],
        body: ["Outfit", "system-ui", "sans-serif"],
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
        "glow-saffron": "0 0 30px oklch(0.66 0.20 53 / 0.3)",
        "glow-gold": "0 0 30px oklch(0.74 0.14 74 / 0.25)",
        "card-warm": "0 4px 24px oklch(0.66 0.20 53 / 0.12), 0 1px 4px oklch(0.27 0.09 38 / 0.08)",
        "card-warm-hover": "0 16px 48px oklch(0.66 0.20 53 / 0.22), 0 4px 12px oklch(0.27 0.09 38 / 0.12)",
        nav: "0 2px 20px oklch(0.27 0.09 38 / 0.08)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
