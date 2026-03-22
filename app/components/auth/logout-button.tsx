"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-xl border border-gray-300 dark:border-slate-700/50 bg-gray-100 dark:bg-slate-700/30 px-4 py-2 text-sm font-medium text-gray-900 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700/50 hover:border-gray-400 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer"
    >
      Sair
    </button>
  );
}
