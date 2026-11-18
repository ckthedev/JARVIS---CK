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
        background: "#080B10",
        foreground: "#F1F5F9",
        sidebar: {
          DEFAULT: "#0B0F17",
          foreground: "#F1F5F9",
          muted: "#94A3B8",
          border: "#1A2333",
          accent: "#141C2B",
        },
        card: {
          DEFAULT: "#0E131F",
          foreground: "#F1F5F9",
          border: "#1A2333",
          hover: "#141C2B",
        },
        popover: {
          DEFAULT: "#0E131F",
          foreground: "#F1F5F9",
          border: "#1A2333",
        },
        primary: {
          DEFAULT: "#00E599", // Cockpit Neon Mint/Emerald from screenshot
          foreground: "#080B10",
          hover: "#10F0A0",
          muted: "rgba(0, 229, 153, 0.15)",
        },
        secondary: {
          DEFAULT: "#00D4FF", // Cockpit Cyan/Sky
          foreground: "#080B10",
          hover: "#38BDF8",
          muted: "rgba(0, 212, 255, 0.15)",
        },
        muted: {
          DEFAULT: "#141C2B",
          foreground: "#94A3B8",
        },
        accent: {
          DEFAULT: "#00D4FF",
          foreground: "#080B10",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#F1F5F9",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#080B10",
        },
        border: "#1A2333",
        input: "#1A2333",
        ring: "#00E599",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      boxShadow: {
        jarvis: "0 4px 20px -2px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(26, 35, 51, 0.8)",
        "jarvis-glow": "0 0 15px -3px rgba(0, 229, 153, 0.3)",
        "glow-green": "0 0 15px -2px rgba(0, 229, 153, 0.35)",
        "glow-cyan": "0 0 15px -2px rgba(0, 212, 255, 0.35)",
        "glow-amber": "0 0 15px -2px rgba(245, 158, 11, 0.35)",
        "glow-red": "0 0 15px -2px rgba(239, 68, 68, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
