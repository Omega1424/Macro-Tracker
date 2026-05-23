import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        // Semantic design tokens — reference CSS variables
        bg:              "var(--color-bg)",
        surface:         "var(--color-surface)",
        "surface-2":     "var(--color-surface-2)",
        border:          "var(--color-border)",
        "border-soft":   "var(--color-border-soft)",
        text:            "var(--color-text)",
        "text-2":        "var(--color-text-2)",
        "text-muted":    "var(--color-text-muted)",
        accent:          "var(--color-accent)",
        "accent-hover":  "var(--color-accent-hover)",
        "accent-surface":"var(--color-accent-surface)",
        danger:          "var(--color-danger)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        "fade-in": "fadeIn 200ms cubic-bezier(0.16,1,0.3,1)",
        "slide-up": "slideUp 250ms cubic-bezier(0.16,1,0.3,1)",
        "slide-in-right": "slideInRight 280ms cubic-bezier(0.16,1,0.3,1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
