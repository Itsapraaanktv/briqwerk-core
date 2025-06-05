/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0D3B66",
        "primary-foreground": "#FFFFFF",
        secondary: "#3B82F6",
        "secondary-foreground": "#FFFFFF",
        destructive: "#ef4444",
        "destructive-foreground": "#FFFFFF",
        muted: "#F3F4F6",
        accent: "#F3F4F6",
        background: "#FFFFFF",
        foreground: "#1F2937",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1F2937",
        },
        input: "#E5E7EB",
        ring: "#3B82F6",
        border: "#E5E7EB",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
      },
      spacing: {
        4.5: "1.125rem",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      },
    },
  },
  plugins: [],
} 