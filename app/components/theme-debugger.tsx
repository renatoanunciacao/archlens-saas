"use client";

import { useEffect, useState } from "react";

import { useTheme } from "next-themes";

export function ThemeDebugger() {
  const [status, setStatus] = useState<string>("");
  const { theme, setTheme, resolvedTheme, themes } = useTheme();

  useEffect(() => {
    const updateStatus = () => {
      const htmlClass = document.documentElement.className;
      const storageValue = localStorage.getItem("archlens-theme");
      const hasDarkClass = document.documentElement.classList.contains("dark");

      setStatus(
        `📊 THEME DEBUG:\n` +
        `Storage: ${storageValue}\n` +
        `Theme (hook): ${theme}\n` +
        `ResolvedTheme: ${resolvedTheme}\n` +
        `HTML has "dark" class: ${hasDarkClass ? "✅ YES" : "❌ NO"}\n` +
        `HTML className: ${htmlClass}\n` +
        `Available themes: ${themes?.join(", ")}`
      );
    };

    updateStatus();
    const interval = setInterval(updateStatus, 500);
    return () => clearInterval(interval);
  }, [theme, resolvedTheme, themes]);

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black text-white text-xs p-3 rounded font-mono max-w-xs">
      <pre className="whitespace-pre-wrap break-words">{status}</pre>
      
      {/* Test element to confirm dark mode CSS is working */}
      <div className="mt-2 p-2 rounded border border-yellow-400 space-y-1">
        {/* 1. INLINE Style Test - should ALWAYS work */}
        <div 
          className="p-1 rounded text-xs"
          style={{
            backgroundColor: resolvedTheme === 'dark' ? '#000000' : '#ffffff',
            color: resolvedTheme === 'dark' ? '#ffffff' : '#000000',
          }}
        >
          1️⃣ INLINE: {resolvedTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}
        </div>
        
        {/* 2. CSS Selector Test - tests if html.dark selector works */}
        <div 
          className="p-1 rounded text-xs test-dark-selector"
        >
          2️⃣ CSS: {resolvedTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}
        </div>
        
        {/* 3. Tailwind dark: Test - should change but might not work */}
        <div className="p-1 rounded text-xs bg-white text-black dark:bg-black dark:text-white">
          3️⃣ Tailwind: {resolvedTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}
        </div>
      </div>
      
      <button
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="mt-2 bg-blue-600 px-2 py-1 rounded w-full text-white text-xs hover:bg-blue-700"
      >
        Toggle Theme
      </button>
    </div>
  );
}
