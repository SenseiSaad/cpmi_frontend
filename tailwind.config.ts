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
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
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
