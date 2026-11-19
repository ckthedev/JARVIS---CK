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
        background: "var(--background)",
        foreground: "var(--foreground)",
        workspace: "var(--workspace)",
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--foreground)",
          muted: "var(--secondary-text)",
          border: "var(--border)",
          accent: "var(--subtle-accent)",
        },
        header: {
          DEFAULT: "var(--header)",
          border: "var(--border)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--foreground)",
          border: "var(--border)",
          elevated: "var(--card-elevated)",
          hover: "var(--card-hover)",
        },
        popover: {
          DEFAULT: "var(--card)",
          foreground: "var(--foreground)",
          border: "var(--border)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "#FFFFFF",
          hover: "var(--primary-hover)",
          muted: "var(--subtle-accent)",
        },
        secondary: {
          DEFAULT: "var(--secondary-accent)",
          foreground: "#FFFFFF",
          muted: "var(--subtle-accent)",
        },
        accent: {
          DEFAULT: "var(--primary-accent)",
          secondary: "var(--secondary-accent)",
          subtle: "var(--subtle-accent)",
          purple: "#8B5CF6",
          green: "#22C55E",
          orange: "#F59E0B",
          pink: "#EC4899",
          blue: "#3B82F6",
          red: "#EF4444",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--secondary-text)",
        },
        border: "var(--border)",
        "border-light": "var(--border-light)",
        "border-subtle": "var(--border-subtle)",
        input: "var(--input)",
        ring: "var(--primary)",
        success: {
          DEFAULT: "var(--success)",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "#FFFFFF",
        },
        danger: {
          DEFAULT: "var(--danger)",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "#FFFFFF",
        },
        info: {
          DEFAULT: "var(--info)",
          foreground: "#FFFFFF",
        },
        pink: {
          DEFAULT: "var(--pink)",
          foreground: "#FFFFFF",
        },
        "primary-text": "var(--primary-text)",
        "secondary-text": "var(--secondary-text)",
        "muted-text": "var(--muted-text)",
        dark: {
          bg: "#101010",
          sidebar: "#141414",
          workspace: "#181818",
          card: "#202020",
          elevated: "#262626",
          hover: "#2C2C2C",
          border: "#303030",
          borderLight: "#383838",
          primaryText: "#F5F5F5",
          secondaryText: "#A3A3A3",
          mutedText: "#737373",
          purple: "#8B5CF6",
          green: "#22C55E",
          orange: "#F59E0B",
          pink: "#EC4899",
          blue: "#3B82F6",
          red: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
        card: "0 2px 4px 0 rgba(0, 0, 0, 0.3)",
        elevated: "0 4px 12px 0 rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
