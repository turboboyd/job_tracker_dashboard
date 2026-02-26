/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      maxWidth: {
        container: "1280px",
        "container-2xl": "1440px",
      },

      spacing: {
        sm: "var(--space-sm)",
        md: "var(--space-md)",
        lg: "var(--space-lg)",
      },

      colors: {
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",

        card: "rgb(var(--card))",
        "card-foreground": "rgb(var(--card-foreground))",

        primary: "rgb(var(--primary))",
        "primary-foreground": "rgb(var(--primary-foreground))",

        secondary: "rgb(var(--secondary))",
        "secondary-foreground": "rgb(var(--secondary-foreground))",

        muted: "rgb(var(--muted))",
        "muted-foreground": "rgb(var(--muted-foreground))",

        border: "rgb(var(--border))",
        input: "rgb(var(--input))",
        ring: "rgb(var(--ring))",

        accent: "rgb(var(--accent))",
        "accent-foreground": "rgb(var(--accent-foreground))",

        popover: "rgb(var(--popover))",
        "popover-foreground": "rgb(var(--popover-foreground))",

        destructive: "rgb(var(--destructive))",
        "destructive-foreground": "rgb(var(--destructive-foreground))",

        success: "rgb(var(--success))",
        "success-foreground": "rgb(var(--success-foreground))",

        warning: "rgb(var(--warning))",
        "warning-foreground": "rgb(var(--warning-foreground))",

        info: "rgb(var(--info))",
        "info-foreground": "rgb(var(--info-foreground))",

        // Application statuses (single source of truth via CSS vars in globals.css)
        // Column/Stage mapping:
        // ACTIVE -> status.info
        // INTERVIEW -> status.purple
        // OFFER -> status.warning
        // HIRED -> status.success
        // REJECTED -> status.danger
        // NO_RESPONSE -> status.neutral
        status: {
          neutral: "rgb(var(--status-neutral))", // NO_RESPONSE / unknown / inactive
          info: "rgb(var(--status-info))", // ACTIVE
          warning: "rgb(var(--status-warning))", // OFFER
          success: "rgb(var(--status-success))", // HIRED
          danger: "rgb(var(--status-danger))", // REJECTED
          purple: "rgb(var(--status-purple))", // INTERVIEW
        },
      },

      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },

      fontFamily: {
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
      },
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        md: "var(--text-md)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
      },
      lineHeight: {
        tight: "var(--line-tight)",
        normal: "var(--line-normal)",
        relaxed: "var(--line-relaxed)",
      },
      fontWeight: {
        regular: "var(--font-regular)",
        medium: "var(--font-medium)",
        semibold: "var(--font-semibold)",
      },

      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },

      transitionTimingFunction: {
        "ease-out": "var(--ease-out)",
        "ease-in-out": "var(--ease-in-out)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
      },

      borderWidth: {
        DEFAULT: "var(--border-width)",
      },

      zIndex: {
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        modal: "var(--z-modal)",
        popover: "var(--z-popover)",
        toast: "var(--z-toast)",
      },
    },
  },
  plugins: [],
};
