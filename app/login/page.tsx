import { LoginButtons } from "../components/auth/login-buttons";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Gradient blobs for light mode */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-indigo-200/20 dark:bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-blue-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-800/95 backdrop-blur-xl p-8 sm:p-10 shadow-xl dark:shadow-2xl">
          <div className="space-y-3 text-center mb-8">
            <div className="flex justify-center mb-4">
              <span className="text-6xl drop-shadow-lg">🔐</span>
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
              ArchLens
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Analise a arquitetura do seu código com inteligência
            </p>
          </div>

          <div className="mt-8">
            <LoginButtons />
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/50 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Usa GitHub OAuth para segurança máxima
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}