"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Watch for theme changes and update the HTML element
  useEffect(() => {
    console.log("[ThemeToggle] resolvedTheme changed:", resolvedTheme);
    console.log("[ThemeToggle] Current HTML classes:", document.documentElement.className);
    
    const applyTheme = (newTheme: string | undefined) => {
      const htmlElement = document.documentElement;
      console.log("[ThemeToggle] applyTheme called with:", newTheme);
      if (newTheme === "dark") {
        htmlElement.classList.add("dark");
        console.log("[ThemeToggle] Added 'dark' class. New classes:", htmlElement.className);
      } else {
        htmlElement.classList.remove("dark");
        console.log("[ThemeToggle] Removed 'dark' class. New classes:", htmlElement.className);
      }
    };

    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const handleThemeChange = () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    console.log(`[ThemeToggle] Button clicked. Changing theme from ${resolvedTheme} to ${newTheme}`);
    console.log(`[ThemeToggle] localStorage before:`, localStorage.getItem("archlens-theme"));
    setTheme(newTheme);
    console.log(`[ThemeToggle] setTheme called with: ${newTheme}`);
  };

  return (
    <button
      onClick={handleThemeChange}
      className="relative inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/30 px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-200 cursor-pointer"
      aria-label="Toggle theme"
      title={`Mudar para modo ${resolvedTheme === "dark" ? "claro" : "escuro"}`}
    >
      {resolvedTheme === "dark" ? (
        <span className="text-lg">☀️</span>
      ) : (
        <span className="text-lg">🌙</span>
      )}
    </button>
  );
}
