import { analyses, projects } from "@/app/db/schema";
import { desc, eq, inArray } from "drizzle-orm";

import { DashboardHeader } from "@/app/components/dashboard-header";
import { HealthTrendChart } from "@/app/components/charts/health-trend-chart";
import Link from "next/link";
import { authOptions } from "@/app/lib/auth";
import { db } from "@/app/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

interface TrendData {
  date: string;
  score: number;
  grade: string;
}

export default async function DashboardV3Page() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user's projects
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id));

  if (userProjects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 mx-auto max-w-6xl">
          <Link
            href="/dashboard"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 mb-4 inline-flex items-center gap-2"
          >
            ← Voltar
          </Link>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">📊 Tendências</h1>
          <div className="rounded-2xl border border-blue-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/30 backdrop-blur-xl p-12 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Nenhum projeto encontrado. Crie um projeto no dashboard para ver as tendências.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition-all"
            >
              Ir para Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get analyses for all user projects
  const userProjectIds = userProjects.map((p) => p.id);
  const allAnalyses = await db
    .select()
    .from(analyses)
    .where(inArray(analyses.projectId, userProjectIds))
    .orderBy(desc(analyses.createdAt));

  // Group analyses by project and prepare trend data
  const projectTrends: Record<string, TrendData[]> = {};

  for (const project of userProjects) {
    const projectAnalyses = allAnalyses.filter(
      (a) => a.projectId === project.id
    );

    projectTrends[project.id] = projectAnalyses
      .reverse() // Show oldest first
      .map((analysis) => ({
        date: analysis.createdAt.toISOString(),
        score: analysis.structuralHealthScore,
        grade: analysis.structuralHealthGrade,
      }));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-300/20 dark:bg-purple-500/10 rounded-full blur-3xl -ml-48 -mb-48"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <DashboardHeader
          userName={session.user.name ?? session.user.email ?? undefined}
          userEmail={session.user.email ?? undefined}
          showWelcome={false}
        />

        {/* Header */}
        <div className="mb-12 mt-8">
          <Link
            href="/dashboard"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 mb-4 inline-flex items-center gap-2"
          >
            ← Voltar
          </Link>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent mb-2">
            📊 Tendências de Saúde
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Visualize a evolução da saúde da arquitetura dos seus projetos
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-12">
          <div className="rounded-2xl border border-blue-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/30 backdrop-blur-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Total de Projetos
            </h3>
            <p className="text-4xl font-black text-blue-600 dark:text-blue-400">
              {userProjects.length}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/30 backdrop-blur-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Total de Análises
            </h3>
            <p className="text-4xl font-black text-cyan-400">
              {allAnalyses.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-2">
              Score Médio
            </h3>
            <p className="text-4xl font-black text-green-400">
              {allAnalyses.length > 0
                ? Math.round(
                    allAnalyses.reduce((sum, a) => sum + a.structuralHealthScore, 0) /
                      allAnalyses.length
                  )
                : 0}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-2">
              Última Análise
            </h3>
            <p className="text-xl font-semibold text-slate-300">
              {allAnalyses.length > 0
                ? new Date(allAnalyses[0].createdAt).toLocaleDateString("pt-BR")
                : "—"}
            </p>
          </div>
        </div>

        {/* Trend Charts */}
        <div className="space-y-8">
          {userProjects.length > 0 ? (
            userProjects.map((project) => (
              <div key={project.id}>
                {projectTrends[project.id] && projectTrends[project.id].length > 0 ? (
                  <HealthTrendChart
                    data={projectTrends[project.id]}
                    projectName={project.name}
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-8 text-center">
                    <p className="text-slate-400 mb-4">
                      {project.name} - Sem análises realizadas ainda
                    </p>
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition-all"
                    >
                      Realizar Análise
                    </Link>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-12 text-center">
              <p className="text-slate-400 mb-4">
                Nenhum projeto encontrado. Crie um projeto no dashboard.
              </p>
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                Ir para Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
