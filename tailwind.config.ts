import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f2f8f1",
          100: "#dcebda",
          200: "#a6c2a2",
          300: "#6b9767",
          400: "#4a7a45",
          500: "#356031",
          600: "#2a5025",
          700: "#234420",
          800: "#1b3519",
          900: "#152a13",
          950: "#0b140a",
        },
        ink: {
          300: "#b8c0bb",
          400: "#98a29c",
          500: "#737d78",
          600: "#55605a",
          700: "#354037",
          900: "#162018",
        },
        brand: {
          50: "#f0f7ef",
          100: "#dceeda",
          200: "#b9ddb5",
          300: "#8fc78a",
          400: "#62aa5c",
          500: "#3f7a39",
          600: "#2e5a29",
          700: "#234420",
          800: "#1c371a",
          900: "#0e1d0d",
        },
        canvas: {
          DEFAULT: "#f8f9fa",
          soft: "#f4f6f4",
        },
        line: "#e3e8e3",
        ok: { DEFAULT: "#1f7a45", bg: "#e8f5ee" },
        warn: { DEFAULT: "#946200", bg: "#fdf4e3" },
        bad: { DEFAULT: "#b42318", bg: "#fdecea" },
        info: { DEFAULT: "#1d5f8a", bg: "#e9f4fb" },
        primary: {
          DEFAULT: "#2A5025",
          50: "#f0f7ef",
          100: "#dceeda",
          200: "#b9ddb5",
          300: "#8fc78a",
          400: "#62aa5c",
          500: "#2A5025",
          600: "#234420",
          700: "#1c371a",
          800: "#152a13",
          900: "#0e1d0d",
          // The landing, sign-in and verification pages use primary-950 (footer, hero gradient, dark text on gold).
          950: "#091408",
        },
        secondary: {
          DEFAULT: "#CFB112",
          50: "#fdfbe8",
          100: "#faf5c5",
          200: "#f4eb8a",
          300: "#eddc4a",
          400: "#e5cc1e",
          500: "#CFB112",
          600: "#b09208",
          700: "#8c710a",
          800: "#725b0e",
          900: "#5f4c11",
        },
        tertiary: {
          DEFAULT: "#738A70",
          500: "#738A70",
        },
        highlight: {
          DEFAULT: "#47D64C",
          500: "#47D64C",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -12px rgba(16,24,40,0.12)",
        lift: "0 24px 60px -24px rgba(11,20,10,0.45)",
        glow: "0 8px 24px -8px rgba(42,80,37,0.5)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        grid: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "28px 28px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
        "count-up": "countUp 1s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
