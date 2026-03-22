import Link from "next/link";
import { authOptions } from "./lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl -ml-48 -mb-48"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-2xl text-center space-y-8">
          {/* Badge */}
          <div className="inline-block">
            <span className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
              ✨ Análise Inteligente de Arquitetura
            </span>
          </div>

          {/* Main Heading */}
          <div>
            <h1 className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent leading-tight mb-4">
              Entenda sua Arquitetura de Código
            </h1>
          </div>

          {/* Description */}
          <p className="text-lg max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--foreground)' }}>
            Com ArchLens, você pode visualizar, analisar e identificar e melhorar a qualidade da arquitetura do seu projeto com inteligência artificial. Identifique problemas antes que virem débito técnico.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/login"
              className="group relative px-8 py-4 rounded-lg text-white font-semibold overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 group-hover:from-blue-500 group-hover:to-blue-400 transition-all duration-300"></div>
              <div className="relative flex items-center gap-2 justify-center">
                Começar Agora →
              </div>
            </Link>
            <Link
              href="#features"
              className="group relative px-8 py-4 rounded-lg font-semibold overflow-hidden transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white/50 group-hover:bg-white/60 backdrop-blur-xl border border-slate-300 rounded-lg transition-all"></div>
              <div className="relative text-slate-900">
                Saiba Mais
              </div>
            </Link>
          </div>

          {/* Features Grid */}
          <div id="features" className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12">
            <div className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
              <div className="relative rounded-xl border border-blue-200/50 backdrop-blur-xl p-6 hover:border-blue-400/50 transition-all text-left h-full flex flex-col" style={{ backgroundColor: 'color-mix(in srgb, var(--background) 95%, #3b82f6 5%)' }}>
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-bold mb-2 text-lg" style={{ color: 'var(--foreground)' }}>Análises Profundas</h3>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>Avaliação automática de saúde da arquitetura</p>
              </div>
            </div>

            <div className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
              <div className="relative rounded-xl border border-red-200/50 backdrop-blur-xl p-6 hover:border-red-400/50 transition-all text-left h-full flex flex-col" style={{ backgroundColor: 'color-mix(in srgb, var(--background) 95%, #ef4444 5%)' }}>
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-bold mb-2 text-lg" style={{ color: 'var(--foreground)' }}>Detecção de Problemas</h3>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>Identifique padrões ruins, dependências circulares e problemas de design</p>
              </div>
            </div>

            <div className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
              <div className="relative rounded-xl border border-purple-200/50 backdrop-blur-xl p-6 hover:border-purple-400/50 transition-all text-left h-full flex flex-col" style={{ backgroundColor: 'color-mix(in srgb, var(--background) 95%, #a855f7 5%)' }}>
                <div className="text-3xl mb-3">📈</div>
                <h3 className="font-bold mb-2 text-lg" style={{ color: 'var(--foreground)' }}>Acompanhamento de Trend</h3>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>Monitore a evolução da qualidade da sua arquitetura ao longo do tempo</p>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <div className="pt-8" style={{ borderTopColor: 'var(--border-color)', borderTopWidth: '1px' }}>
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              Conecte seus repositórios GitHub e comece a analisar arquitetura em segundos
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
