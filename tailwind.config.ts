import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

/**
 * NOTE:
 * - Màu "primary" được làm theo CSS variable để mỗi trang có thể override (vd trang chủ dùng vàng).
 * - Mặc định (toàn site) primary = xanh 25Zone.
 */
const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary (CSS variables -> set ở globals.css / từng page)
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-dark": "rgb(var(--color-primary-dark) / <alpha-value>)",
        "primary-hover": "rgb(var(--color-primary-hover) / <alpha-value>)",

        navy: "#003366",
        "navy-light": "#004080",
        "navy-dark": "#002244",

        secondary: "#00468C",
        "secondary-dark": "#003366",

        "accent-blue": "#33B1FA",
        "accent-dark": "#0d161c",

        "background-light": "#FFFFFF",
        "background-alt": "#F5F7FA",
        "background-dark": "#0f1c23",
        "surface-light": "#F5F7FA",

        "text-main": "#1A1A1A",
        "text-muted": "#666666",
        "dark-text": "#0f172a",
      },
      backgroundImage: {
        "gold-linear": "linear-gradient(90deg, #FFFF00 0%, #FADE7D 100%)",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      maxWidth: {
        container: "1320px",
        content: "1440px",
        "full-hd": "1920px",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0, 0, 0, 0.03)",
        card: "0 4px 20px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 4px 20px rgba(0, 0, 0, 0.08)",
        float: "0 10px 40px rgba(0, 51, 102, 0.2)",
        glow: "0 0 20px rgba(0, 102, 204, 0.4)",
        "glow-blue": "0 0 20px rgba(51, 177, 250, 0.35)",
        neon: "0 0 10px #FFD700, 0 0 20px #FFD700",
        heavy: "0 20px 50px -12px rgba(0, 0, 0, 0.5)",
        "text-glow": "0 0 10px rgba(255,255,255,0.8)",
      },
      borderRadius: {
        DEFAULT: "4px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
        full: "9999px",
      },
    },
  },
  plugins: [forms, containerQueries],
};

export default config;
