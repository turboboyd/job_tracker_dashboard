/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,js,jsx}", "./public/index.html"],
  theme: {
    extend: {
      maxWidth: {
        container: "1280px",
        "container-2xl": "1440px",
      },

      colors: {
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",

        card: "rgb(var(--card))",
        "card-foreground": "rgb(var(--card-foreground))",

        primary: "rgb(var(--primary))",
        "primary-foreground": "rgb(var(--primary-foreground))",

        muted: "rgb(var(--muted))",
        "muted-foreground": "rgb(var(--muted-foreground))",

        border: "rgb(var(--border))",

        accent: "rgb(var(--accent))",
        "accent-foreground": "rgb(var(--accent-foreground))",

        popover: "rgb(var(--card))",
        "popover-foreground": "rgb(var(--card-foreground))",

        destructive: "rgb(var(--destructive))",
        "destructive-foreground": "rgb(var(--destructive-foreground))",
      },

      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
    },
  },
  plugins: [],
};
