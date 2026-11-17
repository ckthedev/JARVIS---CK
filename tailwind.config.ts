import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080D16",
        foreground: "#F5F7FA",
        sidebar: {
          DEFAULT: "#0D1421",
          foreground: "#F5F7FA",
          muted: "#94A3B8",
          border: "#1E293B",
          accent: "#162235",
        },
        card: {
          DEFAULT: "#111B2B",
          foreground: "#F5F7FA",
          border: "#1E2A3F",
          hover: "#162338",
        },
        popover: {
          DEFAULT: "#111B2B",
          foreground: "#F5F7FA",
        },
        primary: {
          DEFAULT: "#00D4FF",
          foreground: "#080D16",
          hover: "#22ddff",
          muted: "rgba(0, 212, 255, 0.15)",
        },
        secondary: {
          DEFAULT: "#7A3FFF",
          foreground: "#F5F7FA",
          hover: "#8E5AFF",
          muted: "rgba(122, 63, 255, 0.15)",
        },
        muted: {
          DEFAULT: "#162235",
          foreground: "#94A3B8",
        },
        accent: {
          DEFAULT: "#00D4FF",
          foreground: "#080D16",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#F5F7FA",
        },
        border: "#1E2A3F",
        input: "#1E2A3F",
        ring: "#00D4FF",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      boxShadow: {
        jarvis: "0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(30, 42, 63, 0.6)",
        "jarvis-glow": "0 0 15px -3px rgba(0, 212, 255, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
