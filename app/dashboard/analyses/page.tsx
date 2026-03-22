import { analyses, projects } from "@/app/db/schema";
import { desc, eq, inArray } from "drizzle-orm";

import { DashboardHeader } from "@/app/components/dashboard-header";
import { ImportJsonForm } from "@/app/components/import-json-form";
import Link from "next/link";
import { authOptions } from "@/app/lib/auth";
import { db } from "@/app/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

interface AnalysisReport {
  arch_health_score?: number;
  arch_health_status?: string;
  files_analyzed?: number;
  cycles_count?: number;
  top_fan_in?: Array<{ module: string; count: number }>;
  top_fan_out?: Array<{ module: string; count: number }>;
  danger_hotspots?: Array<{ module: string; in: number; out: number }>;
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user's projects with latest analysis
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id));

  // Get IDs of user's projects
  const userProjectIds = userProjects.map((p) => p.id);

  // Get latest analyses from user's projects
  const latestAnalyses =
    userProjectIds.length > 0
      ? await db
          .select()
          .from(analyses)
          .where(inArray(analyses.projectId, userProjectIds))
          .orderBy(desc(analyses.createdAt))
          .limit(5)
      : [];

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10 border-green-500/30";
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  const getHealthTextColor = (score: number) => {
    if (score >= 80) return "text-slate-900 dark:text-slate-100";
    if (score >= 60) return "text-slate-900 dark:text-slate-100";
    return "text-slate-900 dark:text-slate-100";
  };

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
        <div className="mb-12 mt-8">
          <Link href="/dashboard" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 mb-4 inline-flex items-center gap-2">
            ← Voltar
          </Link>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent mb-2">
            📊 Análises
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Visualize as análises de arquitetura dos seus projetos
          </p>
        </div>

        {/* Últimas Análises */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Últimas Análises</h2>
          </div>

          {latestAnalyses.length === 0 ? (
            <div className="rounded-2xl border border-blue-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/30 backdrop-blur-xl p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                Nenhuma análise encontrada. Clique em um projeto no Dashboard para iniciar uma análise.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {latestAnalyses.map((analysis) => {
                const report = (analysis.reportJson || {}) as AnalysisReport;
                const score = analysis.structuralHealthScore;

                return (
                  <Link
                    key={analysis.id}
                    href={`/dashboard/analyses/${analysis.id}`}
                    className={`rounded-xl border p-6 transition-all hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer ${getHealthBgColor(
                      score
                    )}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className={`text-lg font-semibold ${getHealthTextColor(score)}`}>
                          Projeto #{analysis.projectId.slice(0, 8)}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(analysis.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div
                        className={`text-3xl font-black ${getHealthColor(
                          score
                        )}`}
                      >
                        {score}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className={`${getHealthTextColor(score)} opacity-70`}>Saúde:</span>
                        <span className={`font-medium ${getHealthTextColor(score)}`}>
                          {analysis.structuralHealthGrade}
                        </span>
                      </div>

                      {report.files_analyzed && (
                        <div className="flex items-center justify-between text-sm">
                          <span className={`${getHealthTextColor(score)} opacity-70`}>Arquivos:</span>
                          <span className={`font-medium ${getHealthTextColor(score)}`}>
                            {report.files_analyzed}
                          </span>
                        </div>
                      )}

                      {report.cycles_count !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className={`${getHealthTextColor(score)} opacity-70`}>Ciclos:</span>
                          <span
                            className={`font-medium ${
                              report.cycles_count > 0
                                ? "text-red-400"
                                : "text-green-400"
                            }`}
                          >
                            {report.cycles_count}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Problems */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">🚨 Problemas Detectados</h2>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Cycles */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                🔄 Dependências Circulares
              </h3>

              {(latestAnalyses[0]?.reportJson as AnalysisReport)?.cycles_count ? (
                <div className="space-y-2">
                  <p className="text-red-400 text-sm font-medium">
                    ⚠️ {(latestAnalyses[0].reportJson as AnalysisReport).cycles_count}{" "}
                    ciclo(s) detectado(s)
                  </p>
                  <p className="text-slate-400 text-xs">
                    Ciclos de dependência podem dificultar a manutenção e os testes.
                  </p>
                </div>
              ) : (
                <p className="text-green-400 text-sm font-medium">
                  ✅ Nenhum ciclo detectado
                </p>
              )}
            </div>

            {/* Hotspots */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                🔥 Hotspots de Acoplamento
              </h3>

              {(latestAnalyses[0]?.reportJson as AnalysisReport)
                ?.danger_hotspots?.length ? (
                <div className="space-y-3">
                  {(
                    (latestAnalyses[0].reportJson as AnalysisReport)
                      .danger_hotspots || []
                  ).slice(0, 3).map((hotspot, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-slate-700/30 p-3 border border-amber-500/20"
                    >
                      <p className="text-sm font-medium text-white truncate">
                        {hotspot.module}
                      </p>
                      <p className="text-xs text-slate-400">
                        {hotspot.in}↙ / {hotspot.out}↗
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-green-400 text-sm font-medium">
                  ✅ Nenhum hotspot crítico
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Import JSON */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            📥 Importar Análise JSON
          </h3>
          <p className="text-slate-400 mb-6">
            Importe um relatório JSON gerado pelo ArchLens para visualizá-lo no
            Dashboard
          </p>
          
          <ImportJsonForm userProjects={userProjects} />
        </div>
      </div>
    </div>
  );
}
