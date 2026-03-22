"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginButtons() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    await signIn("github", { callbackUrl: "/dashboard" });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="w-full rounded-xl border border-gray-300 dark:border-slate-700/50 bg-gray-100 dark:bg-slate-700/30 px-4 py-3 text-sm font-medium text-gray-900 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700/50 hover:border-gray-400 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-spin">⚙️</span> Conectando...
        </span>
      ) : (
        <span>🔐 Entrar com GitHub</span>
      )}
    </button>
  );
}