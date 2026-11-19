"use client";

import React, { createContext, useContext, useEffect } from "react";

export type Theme = "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Permanently enforce dark theme across document
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
    localStorage.setItem("jarvis-theme", "dark");
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: "dark",
        resolvedTheme: "dark",
        setTheme: () => {},
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
