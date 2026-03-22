import { analyses, projects } from "@/app/db/schema";
import { and, desc, eq, ne } from "drizzle-orm";

import { DashboardHeader } from "@/app/components/dashboard-header";
import Link from "next/link";
import { authOptions } from "@/app/lib/auth";
import { db } from "@/app/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

interface AnalysisReport {
  arch_health_score?: number;
  arch_health_status?: string;
  architecture_fit_score?: number;
  architecture_fit_status?: string;
  files_analyzed?: number;
  edges?: number;
  cycles_count?: number;
  top_fan_in?: Array<{ module: string; count: number }>;
  top_fan_out?: Array<{ module: string; count: number }>;
  danger_hotspots?: Array<{ module: string; in: number; out: number }>;
  recommended_profile?: string;
  [key: string]: unknown;
}

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  let analysis;
  let project;
  let report;
  let score;
  let previousAnalysis = null;
  let scoreDiff = 0;
  let scoreTrend: 'up' | 'down' | 'same' = 'same';
  let error = false;

  try {
    const [analysisData] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, id));

    if (!analysisData) {
      error = true;
    } else {
      analysis = analysisData;

      const [projectData] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, analysis.projectId));

      if (!projectData || projectData.userId !== session.user.id) {
        error = true;
      } else {
        project = projectData;
        report = (analysis.reportJson || {}) as AnalysisReport;
        score = analysis.structuralHealthScore;

        // Fetch previous analysis for comparison
        const [prevAnalysiData] = await db
          .select()
          .from(analyses)
          .where(and(
            eq(analyses.projectId, analysis.projectId),
            ne(analyses.id, id)
          ))
          .orderBy(desc(analyses.createdAt))
          .limit(1);

        if (prevAnalysiData) {
          previousAnalysis = prevAnalysiData;
          scoreDiff = score - (prevAnalysiData.structuralHealthScore || 0);
          if (scoreDiff > 0) scoreTrend = 'up';
          else if (scoreDiff < 0) scoreTrend = 'down';
        }
      }
    }
  } catch (err) {
    console.error("Error loading analysis:", err);
    error = true;
  }

  const getHealthColor = (s: number) => {
    if (s >= 80) return "text-green-400";
    if (s >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getHealthBgColor = (s: number) => {
    if (s >= 80) return "from-green-600 to-emerald-600";
    if (s >= 60) return "from-yellow-600 to-amber-600";
    return "from-red-600 to-rose-600";
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 mx-auto max-w-6xl">
          <DashboardHeader
            userName={session.user.name ?? session.user.email ?? undefined}
            userEmail={session.user.email ?? undefined}
            showWelcome={false}
          />

          <Link
            href="/dashboard/analyses"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 mb-4 inline-flex items-center gap-2 mt-8"
          >
            ← Voltar
          </Link>
          <div className="rounded-2xl border border-red-300/50 dark:border-red-500/30 bg-red-100/50 dark:bg-red-500/10 backdrop-blur-xl p-8">
            <h1 className="text-2xl font-black text-red-600 dark:text-red-400 mb-4">
              ⚠️ Erro ao carregar análise
            </h1>
            <p className="text-slate-700 dark:text-slate-300 mb-6">
              Não conseguimos carregar os dados da análise. Por favor, tente novamente ou retorne às análises.
            </p>
            <Link
              href="/dashboard/analyses"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition-all"
            >
              Voltar às Análises
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis || !project || !report || score === undefined) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-300/20 dark:bg-purple-500/10 rounded-full blur-3xl -ml-48 -mb-48"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <DashboardHeader
          userName={session.user.name ?? session.user.email ?? undefined}
          userEmail={session.user.email ?? undefined}
          showWelcome={false}
        />

        {/* Header */}
        <div className="mb-8 mt-8">
          <Link
            href="/dashboard/analyses"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 mb-4 inline-flex items-center gap-2"
          >
            ← Voltar
          </Link>
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
                📊 {project.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Análise de {new Date(analysis.createdAt).toLocaleDateString("pt-BR")} às {new Date(analysis.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-4 ml-6">
              <Link
                href={`/dashboard/analyses/html/${analysis.id}`}
                className="flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
              >
                📄 Ver Relatório
              </Link>
              <div className={`text-6xl font-black bg-gradient-to-br ${getHealthBgColor(score)} bg-clip-text text-transparent`}>
                {score}
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Card - Shows improvement/regression */}
        {previousAnalysis && (
          <div className="mb-8 rounded-2xl border border-slate-300/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Comparação com análise anterior
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  {new Date(previousAnalysis.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Score anterior</p>
                  <p className={`text-3xl font-bold ${getHealthColor(previousAnalysis.structuralHealthScore || 0)}`}>
                    {previousAnalysis.structuralHealthScore}
                  </p>
                </div>
                <div className="text-2xl">→</div>
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Score atual</p>
                  <p className={`text-3xl font-bold ${getHealthColor(score)}`}>
                    {score}
                  </p>
                </div>
                <div className={`text-center px-4 py-2 rounded-lg ${
                  scoreTrend === 'up' 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : scoreTrend === 'down' 
                    ? 'bg-red-100 dark:bg-red-900/30' 
                    : 'bg-slate-100 dark:bg-slate-900/30'
                }`}>
                  <p className={`text-sm font-semibold ${
                    scoreTrend === 'up' 
                      ? 'text-green-700 dark:text-green-300' 
                      : scoreTrend === 'down' 
                      ? 'text-red-700 dark:text-red-300' 
                      : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {scoreTrend === 'up' ? '📈 +' : scoreTrend === 'down' ? '📉 ' : '➡️ '}{Math.abs(scoreDiff)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-3 mb-8">
          {/* Health Score Card */}
          <div className="lg:col-span-1 rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-8">
            <h2 className="text-lg font-semibold text-white mb-6">
              📈 Saúde da Arquitetura
            </h2>

            <div className="space-y-6">
              <div>
                <div className="text-4xl font-black text-center mb-2">
                  <span className={getHealthColor(score)}>{score}</span>
                  <span className="text-slate-500 text-2xl">/100</span>
                </div>
                <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getHealthBgColor(score)}`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>

              <div className="border-t border-slate-700/50 pt-4">
                <p className="text-sm text-slate-400 mb-2">Status</p>
                <p className="text-lg font-semibold text-white">
                  {analysis.structuralHealthGrade}
                </p>
              </div>

              {report.files_analyzed && (
                <div className="border-t border-slate-700/50 pt-4">
                  <p className="text-sm text-slate-400 mb-2">Arquivos Analisados</p>
                  <p className="text-lg font-semibold text-white">
                    {report.files_analyzed}
                  </p>
                </div>
              )}

              {report.edges && (
                <div className="border-t border-slate-700/50 pt-4">
                  <p className="text-sm text-slate-400 mb-2">Dependências</p>
                  <p className="text-lg font-semibold text-white">{report.edges}</p>
                </div>
              )}

              {report.recommended_profile && (
                <div className="border-t border-slate-700/50 pt-4">
                  <p className="text-sm text-slate-400 mb-2">Perfil Recomendado</p>
                  <p className="text-lg font-semibold text-blue-300">
                    {report.recommended_profile}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cycles & Problems */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  🔄 Ciclos Detectados
                </h3>
                <div className="text-4xl font-black">
                  <span
                    className={
                      report.cycles_count === 0 ? "text-green-400" : "text-red-400"
                    }
                  >
                    {report.cycles_count ?? 0}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  {report.cycles_count === 0
                    ? "Excelente! Nenhum ciclo detectado"
                    : "Ciclos podem comprometer a manutenção"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  🔥 Hotspots de Acoplamento
                </h3>
                <div className="text-4xl font-black text-amber-400">
                  {report.danger_hotspots?.length ?? 0}
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  Módulos críticos com acoplamento alto
                </p>
              </div>
            </div>

            {/* Top Fan-In */}
            {report.top_fan_in && report.top_fan_in.length > 0 && (
              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  ↙ Top Fan-In (Módulos Críticos)
                </h3>
                <div className="space-y-3">
                  {report.top_fan_in.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-blue-500/20"
                    >
                      <p className="text-sm font-medium text-white truncate">
                        {item.module}
                      </p>
                      <p className="text-lg font-bold text-blue-400 ml-2">
                        {item.count}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Fan-Out */}
            {report.top_fan_out && report.top_fan_out.length > 0 && (
              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  ↗ Top Fan-Out (Módulos Instáveis)
                </h3>
                <div className="space-y-3">
                  {report.top_fan_out.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-yellow-500/20"
                    >
                      <p className="text-sm font-medium text-white truncate">
                        {item.module}
                      </p>
                      <p className="text-lg font-bold text-yellow-400 ml-2">
                        {item.count}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Danger Hotspots */}
            {report.danger_hotspots && report.danger_hotspots.length > 0 && (
              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  🚨 Hotspots Críticos
                </h3>
                <div className="space-y-3">
                  {report.danger_hotspots.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-red-500/20"
                    >
                      <p className="text-sm font-medium text-white truncate">
                        {item.module}
                      </p>
                      <p className="text-xs text-slate-400 ml-2">
                        <span className="text-red-400 font-bold">{item.in}</span>↙{" "}
                        <span className="text-orange-400 font-bold">{item.out}</span>↗
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            💡 Recomendações
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {score < 60 && (
              <div className="rounded-xl border border-red-300/50 dark:border-red-700/50 bg-red-50/50 dark:bg-red-900/20 p-4">
                <p className="font-semibold text-red-900 dark:text-red-200 mb-2">🚨 Saúde crítica</p>
                <p className="text-sm text-red-800 dark:text-red-300">
                  Considere refatorar módulos críticos e reduzir dependências circulares.
                </p>
              </div>
            )}
            {(report.danger_hotspots?.length || 0) > 3 && (
              <div className="rounded-xl border border-orange-300/50 dark:border-orange-700/50 bg-orange-50/50 dark:bg-orange-900/20 p-4">
                <p className="font-semibold text-orange-900 dark:text-orange-200 mb-2">🔥 Muitos hotspots</p>
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  Priorize resolver os {report.danger_hotspots?.length} pontos críticos de acoplamento.
                </p>
              </div>
            )}
            {(report.cycles_count || 0) > 0 && (
              <div className="rounded-xl border border-yellow-300/50 dark:border-yellow-700/50 bg-yellow-50/50 dark:bg-yellow-900/20 p-4">
                <p className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">⚠️ Ciclos detectados</p>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  {report.cycles_count} ciclo(s) encontrado(s). Remova dependências circulares para melhorar.
                </p>
              </div>
            )}
            {score >= 80 && (
              <div className="rounded-xl border border-green-300/50 dark:border-green-700/50 bg-green-50/50 dark:bg-green-900/20 p-4">
                <p className="font-semibold text-green-900 dark:text-green-200 mb-2">✅ Excelente estrutura</p>
                <p className="text-sm text-green-800 dark:text-green-300">
                  sua arquitetura está saudável! Mantenha as boas práticas.
                </p>
              </div>
            )}
            {report.top_fan_out && report.top_fan_out.length > 0 && (
              <div className="rounded-xl border border-blue-300/50 dark:border-blue-700/50 bg-blue-50/50 dark:bg-blue-900/20 p-4">
                <p className="font-semibold text-blue-900 dark:text-blue-200 mb-2">📦 Módulos instáveis</p>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  {report.top_fan_out.length} módulo(s) com alta saída. Considere refatorar ou documentar.
                </p>
              </div>
            )}
            {report.recommended_profile && (
              <div className="rounded-xl border border-purple-300/50 dark:border-purple-700/50 bg-purple-50/50 dark:bg-purple-900/20 p-4">
                <p className="font-semibold text-purple-900 dark:text-purple-200 mb-2">🎯 Padrão recomendado</p>
                <p className="text-sm text-purple-800 dark:text-purple-300">
                  Considere adotar o padrão <span className="font-mono font-bold">{report.recommended_profile}</span> para este projeto.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
