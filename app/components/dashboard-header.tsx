"use client";

import Link from "next/link";
import { LogoutButton } from "./auth/logout-button";
import { ThemeToggle } from "./theme-toggle";
import { usePathname } from "next/navigation";

interface DashboardHeaderProps {
  userName?: string;
  userEmail?: string;
  showWelcome?: boolean;
}

export function DashboardHeader({
  userName,
  showWelcome = true,
}: DashboardHeaderProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  const navLinks = [
    { href: "/dashboard/trends", label: "📈 Tendências", color: "purple" },
    { href: "/dashboard/problems", label: "🚨 Problemas", color: "red" },
    { href: "/dashboard/analyses", label: "📊 Análises", color: "orange" },
  ];

  return (
    <div className="flex items-center justify-between pt-2 pb-2">
      <Link
        href="/dashboard"
        className="group flex items-center gap-3 hover:opacity-80 transition-opacity duration-200"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg blur-sm group-hover:blur-md opacity-60 group-hover:opacity-100 transition-all duration-300"></div>
          <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg p-2 text-white text-xl font-black">
            🔍
          </div>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-400 dark:via-blue-200 dark:to-cyan-300 bg-clip-text text-transparent">
            ArchLens
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Análise de Arquitetura
          </p>
        </div>
      </Link>

      {showWelcome && userName && (
        <div className="flex-1 ml-8">
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            Bem-vindo,{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent font-bold">
              {userName}
            </span>
          </p>
        </div>
      )}

      <div className="flex gap-2 sm:gap-3 items-center">
        {navLinks.map((link) => {
          const colorMap: {
            [key: string]: {
              border: string;
              hover: string;
              shadow: string;
              darkBorder: string;
              darkHover: string;
            };
          } = {
            purple: {
              border: "border-purple-300/30 dark:border-purple-500/30",
              hover: "hover:border-purple-400/60 dark:hover:border-purple-500/60",
              shadow: "hover:shadow-purple-500/20 dark:hover:shadow-purple-500/10",
              darkBorder: "dark:border-purple-500/30",
              darkHover: "dark:hover:border-purple-500/60",
            },
            red: {
              border: "border-red-300/30 dark:border-red-500/30",
              hover: "hover:border-red-400/60 dark:hover:border-red-500/60",
              shadow: "hover:shadow-red-500/20 dark:hover:shadow-red-500/10",
              darkBorder: "dark:border-red-500/30",
              darkHover: "dark:hover:border-red-500/60",
            },
            orange: {
              border: "border-orange-300/30 dark:border-orange-500/30",
              hover: "hover:border-orange-400/60 dark:hover:border-orange-500/60",
              shadow: "hover:shadow-orange-500/20 dark:hover:shadow-orange-500/10",
              darkBorder: "dark:border-orange-500/30",
              darkHover: "dark:hover:border-orange-500/60",
            },
          };

          const colors = colorMap[link.color] || colorMap.purple;
          const active = isActive(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group relative px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 overflow-hidden transition-all duration-300 ${
                active ? "shadow-lg shadow-blue-500/25" : ""
              } ${colors.shadow}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-blue-500/5 group-hover:to-blue-500/0 transition-all duration-300"></div>
              <div
                className={`relative border rounded-lg absolute inset-0 transition-all duration-300 ${colors.border} ${colors.hover}`}
              ></div>
              <span className="relative">{link.label}</span>
            </Link>
          );
        })}

        <div className="inline-block border-l border-slate-300 dark:border-slate-600 h-6 mx-1"></div>

        <ThemeToggle />
        <LogoutButton />
      </div>
    </div>
  );
}
