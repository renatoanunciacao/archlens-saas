"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface PageHeaderProps {
  userName?: string;
  showNav?: boolean;
}

export function PageHeader({
  userName,
  showNav = true,
}: PageHeaderProps) {
  const pathname = usePathname();
  
  const isDashboard = pathname.startsWith("/dashboard");

  const navLinks = [
    { href: "/dashboard/trends", label: "📈 Tendências" },
    { href: "/dashboard/problems", label: "🚨 Problemas" },
    { href: "/dashboard/analyses", label: "📊 Análises" },
  ];

  return (
    <div className="flex items-center justify-between pt-2 pb-2">
      {/* Logo */}
      <Link
        href={isDashboard ? "/dashboard" : "/"}
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
          <p className="text-xs text-slate-500 dark:text-slate-400">Análise de Arquitetura</p>
        </div>
      </Link>

      {/* Welcome Message */}
      {userName && (
        <div className="flex-1 ml-8">
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            Bem-vindo,{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent font-bold">
              {userName}
            </span>
          </p>
        </div>
      )}

      {/* Right Section - Navigation and Controls */}
      <div className="flex gap-2 sm:gap-3 items-center">
        {showNav && isDashboard && (
          <>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 overflow-hidden transition-all duration-300 hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-blue-500/5 group-hover:to-blue-500/0 transition-all duration-300"></div>
                <div className="relative border border-blue-300/30 dark:border-blue-500/30 group-hover:border-blue-400/60 dark:group-hover:border-blue-500/60 rounded-lg absolute inset-0 transition-all duration-300"></div>
                <span className="relative">{link.label}</span>
              </Link>
            ))}
            <div className="inline-block border-l border-slate-300 dark:border-slate-600 h-6 mx-1"></div>
          </>
        )}

        {/* Theme Toggle + Logout will be added via layout */}
        <slot />
      </div>
    </div>
  );
}
