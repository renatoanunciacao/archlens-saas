import { analyses, projects, subscriptions, usageLimits } from "../db/schema";
import { desc, eq } from "drizzle-orm";

import { DashboardClientWrapper } from "../components/dashboard-client";
import { DashboardHeader } from "../components/dashboard-header";
import Link from "next/link";
import { NewProjectButton } from "../components/new-project-button";
import { RunAnalysisButton } from "../components/run-analysis-button";
import { StartProjectButton } from "../components/start-project-button";
import { authOptions } from "../lib/auth";
import { db } from "../db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch user data
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  const [usage] = await db
    .select()
    .from(usageLimits)
    .where(eq(usageLimits.userId, userId));

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));

  // Fetch latest analysis for each project
  const projectsWithAnalyses = await Promise.all(
    userProjects.map(async (project) => {
      const projectAnalyses = await db
        .select()
        .from(analyses)
        .where(eq(analyses.projectId, project.id))
        .orderBy(desc(analyses.createdAt))
        .limit(1);

      return {
        ...project,
        latestAnalysis: projectAnalyses[0] || null,
      };
    })
  );

  const planLabel =
    {
      free: "Gratuito",
      pro: "Profissional",
      enterprise: "Enterprise",
    }[subscription?.plan || "free"] || "Gratuito";

  return (
    <DashboardClientWrapper>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-300/20 dark:bg-purple-500/10 rounded-full blur-3xl -ml-48 -mb-48"></div>
      </div>

      <div className="relative z-10 p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Header with enhanced elegance */}
          <DashboardHeader
            userName={session.user.name ?? session.user.email ?? undefined}
            userEmail={session.user.email ?? undefined}
            showWelcome={true}
          />

          {/* Stats Cards Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* User Card */}
            <div className="group relative h-56">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative rounded-2xl border border-blue-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl p-6 hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all duration-200 shadow-sm hover:shadow-lg h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="inline-block bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                      👤 Usuário
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {session.user.name?.split(" ")[0] || "Usuário"}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 text-sm break-all">{session.user.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Card */}
            <div className="group relative h-56">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative rounded-2xl border border-purple-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl p-6 hover:border-purple-400/50 dark:hover:border-purple-500/50 transition-all duration-200 shadow-sm hover:shadow-lg h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="inline-block bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-medium">
                    ⭐ Plano
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{planLabel}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 capitalize font-medium">
                        {subscription?.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Card */}
            <div className="group relative h-56">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative rounded-2xl border border-orange-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl p-6 hover:border-orange-400/50 dark:hover:border-orange-500/50 transition-all duration-200 shadow-sm hover:shadow-lg h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="inline-block bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-medium">
                    📊 Uso
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-600 dark:text-slate-400">Projetos</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {usage?.projectsCount || 0}/<span className="text-slate-600 dark:text-slate-400">{usage?.maxProjects}</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all"
                          style={{
                            width: `${((usage?.projectsCount || 0) / (usage?.maxProjects || 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-600 dark:text-slate-400">Análises/mês</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {usage?.analysesCountMonth || 0}/<span className="text-slate-600 dark:text-slate-400">{usage?.maxAnalysesPerMonth}</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-400 h-full transition-all"
                          style={{
                            width: `${((usage?.analysesCountMonth || 0) / (usage?.maxAnalysesPerMonth || 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div className="rounded-2xl border border-blue-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl overflow-hidden shadow-lg">
            <div className="border-b border-blue-200/50 dark:border-slate-700/50 px-8 py-6 flex items-center justify-between bg-gradient-to-r from-blue-50/50 dark:from-transparent to-transparent">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Seus Projetos</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Gerencie todos os seus projetos em um único lugar</p>
              </div>
              <NewProjectButton />
            </div>

            <div className="p-8">
              {userProjects.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-xl text-gray-700 dark:text-slate-300 font-medium">
                    Nenhum projeto ainda
                  </p>
                  <p className="text-gray-600 dark:text-slate-500 mt-2 mb-6">
                    Crie seu primeiro projeto para começar a análise de código
                  </p>
                  <StartProjectButton />
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {projectsWithAnalyses.map((project) => {
                    const analysis = project.latestAnalysis;
                    const hasAnalysis = !!analysis;
                    
                    // Determine grade color
                    const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
                      A: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-300 dark:border-emerald-700" },
                      B: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700" },
                      C: { bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-300 dark:border-yellow-700" },
                      D: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700" },
                      F: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-300", border: "border-red-300 dark:border-red-700" },
                    };
                    
                    const gradeColor = gradeColors[analysis?.structuralHealthGrade || "C"] || gradeColors.C;
                    
                    return (
                      <div key={project.id} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                        <div className="relative rounded-xl border border-blue-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-700/30 hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:bg-white dark:hover:bg-slate-700/50 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden flex flex-col h-full">
                          {/* Header */}
                          <div className="px-6 py-4 border-b border-blue-100/50 dark:border-slate-600/50">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/dashboard/projects/${project.id}`}
                                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                >
                                  <span className="text-2xl flex-shrink-0">📁</span>
                                  <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-2">
                                    {project.name}
                                  </h3>
                                </Link>
                              </div>
                              {hasAnalysis && (
                                <div className={`flex-shrink-0 px-3 py-1 rounded-lg text-sm font-bold ${gradeColor.bg} ${gradeColor.text}`}>
                                  {analysis.structuralHealthGrade}
                                </div>
                              )}
                            </div>
                            {project.repoUrl && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 ml-8 line-clamp-1">
                                <span className="text-blue-600 dark:text-blue-400 capitalize font-medium">{project.provider}</span> • {project.repoName}
                              </p>
                            )}
                          </div>

                          {/* Analysis Info or Empty State */}
                          {hasAnalysis ? (
                            <div className={`flex-1 px-6 py-4 space-y-4 ${gradeColor.bg}`}>
                              <div className="space-y-2">
                                <div className="flex items-end justify-between">
                                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Saúde da Arquitetura</p>
                                  <p className={`text-3xl font-bold ${gradeColor.text}`}>
                                    {analysis.structuralHealthScore}
                                  </p>
                                </div>
                                <div className="w-full bg-slate-300 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${analysis.structuralHealthGrade === 'A' ? 'bg-emerald-500' : analysis.structuralHealthGrade === 'B' ? 'bg-blue-500' : analysis.structuralHealthGrade === 'C' ? 'bg-yellow-500' : analysis.structuralHealthGrade === 'D' ? 'bg-orange-500' : 'bg-red-500'}`}
                                    style={{ width: `${analysis.structuralHealthScore}%` }}
                                  ></div>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Analisado em {new Date(analysis.createdAt!).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          ) : (
                            <div className="flex-1 px-6 py-6 flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
                              <p className="text-sm">Nenhuma análise realizada</p>
                              <p className="text-xs mt-1 opacity-75">Clique em &quot;Analisar&quot; para começar</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="px-6 py-3 border-t border-blue-100/50 dark:border-slate-600/50 flex gap-2">
                            <Link
                              href={`/dashboard/projects/${project.id}`}
                              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-center"
                            >
                              📊 Detalhes
                            </Link>
                            <RunAnalysisButton projectId={project.id} />
                            {hasAnalysis && (
                              <Link
                                href={`/dashboard/analyses/html/${analysis.id}`}
                                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-center"
                              >
                                📄 Relatório
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
    </DashboardClientWrapper>
  );
}