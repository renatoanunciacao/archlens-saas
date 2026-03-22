import { analyses, projects } from '@/app/db/schema';
import { desc, eq } from 'drizzle-orm';

import { DashboardHeader } from '@/app/components/dashboard-header';
import Link from 'next/link';
import { authOptions } from '@/app/lib/auth';
import { db } from '@/app/db';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

interface Hotspot {
  module: string;
  in: number;
  out: number;
}

interface ReportJson {
  danger_hotspots?: Hotspot[];
  cycles_count?: number;
  arch_health_score?: number;
  top_fan_in?: Array<{ module: string; count: number }>;
  top_fan_out?: Array<{ module: string; count: number }>;
}

interface AggregatedProblem {
  module: string;
  totalCoupling: number;
  projectId: string;
  projectName: string;
  analysisId: string;
  score: number;
  grade: string;
}

export default async function ProblemsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
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
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
            🚨 Principais Problemas
          </h1>
          <div className="rounded-2xl border border-red-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/30 backdrop-blur-xl p-12 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Nenhum projeto encontrado. Crie um projeto no dashboard para ver os problemas.
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

  // Get latest analysis for each project
  const latestAnalyses = await Promise.all(
    userProjects.map((project) =>
      db
        .select()
        .from(analyses)
        .where(eq(analyses.projectId, project.id))
        .orderBy(desc(analyses.createdAt))
        .limit(1)
    )
  );

  // Aggregate problems
  const hotspotMap = new Map<string, AggregatedProblem>();
  const projectsWithCycles: Array<{
    projectId: string;
    projectName: string;
    cycles: number;
  }> = [];
  const lowHealthProjects: Array<{
    projectId: string;
    projectName: string;
    score: number;
    grade: string;
    analysisId: string;
  }> = [];

  latestAnalyses.forEach((analysisArray, idx) => {
    if (!analysisArray || analysisArray.length === 0) return;

    const analysis = analysisArray[0];
    const report = (analysis.reportJson as ReportJson) || {};
    const project = userProjects[idx];

    // Track hotspots
    if (report.danger_hotspots && Array.isArray(report.danger_hotspots)) {
      report.danger_hotspots.forEach((hotspot) => {
        const coupling = hotspot.in + hotspot.out;
        const key = hotspot.module;

        if (!hotspotMap.has(key)) {
          hotspotMap.set(key, {
            module: hotspot.module,
            totalCoupling: coupling,
            projectId: project.id,
            projectName: project.name,
            analysisId: analysis.id,
            score: report.arch_health_score || 0,
            grade: analysis.structuralHealthGrade,
          });
        } else {
          const existing = hotspotMap.get(key)!;
          if (coupling > existing.totalCoupling) {
            existing.totalCoupling = coupling;
            existing.projectId = project.id;
            existing.projectName = project.name;
            existing.analysisId = analysis.id;
          }
        }
      });
    }

    // Track cycles
    if (report.cycles_count && report.cycles_count > 0) {
      projectsWithCycles.push({
        projectId: project.id,
        projectName: project.name,
        cycles: report.cycles_count,
      });
    }

    // Track low health
    if (
      report.arch_health_score !== undefined &&
      report.arch_health_score < 70
    ) {
      lowHealthProjects.push({
        projectId: project.id,
        projectName: project.name,
        score: report.arch_health_score,
        grade: analysis.structuralHealthGrade,
        analysisId: analysis.id,
      });
    }
  });

  // Sort hotspots by coupling
  const topHotspots = Array.from(hotspotMap.values())
    .sort((a, b) => b.totalCoupling - a.totalCoupling)
    .slice(0, 10);

  // Sort cycles descending
  const topCycleProjects = projectsWithCycles.sort(
    (a, b) => b.cycles - a.cycles
  );

  // Sort low health ascending (worst first)
  const worstHealthProjects = lowHealthProjects.sort(
    (a, b) => a.score - b.score
  );

  const stats = {
    totalProblematicModules: hotspotMap.size,
    projectsWithCycles: projectsWithCycles.length,
    projectsWithLowHealth: lowHealthProjects.length,
    affectedProjects: new Set([
      ...projectsWithCycles.map((p) => p.projectId),
      ...lowHealthProjects.map((p) => p.projectId),
      ...topHotspots.map((h) => h.projectId),
    ]).size,
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHealthBg = (score: number) => {
    if (score >= 80)
      return 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20';
    if (score >= 60)
      return 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/20';
    return 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20';
  };

  const getCouplingColor = (coupling: number) => {
    if (coupling < 5) return 'text-green-600 dark:text-green-400';
    if (coupling < 10) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getCouplingBg = (coupling: number) => {
    if (coupling < 5)
      return 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20';
    if (coupling < 10)
      return 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/20';
    return 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto max-w-6xl">
        <DashboardHeader
          userName={session.user.name ?? session.user.email ?? undefined}
          userEmail={session.user.email ?? undefined}
          showWelcome={false}
        />

        {/* Header */}
        <Link
          href="/dashboard"
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 mb-6 inline-flex items-center gap-2 mt-8"
        >
          ← Voltar
        </Link>
        <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-2">
          🚨 Principais Problemas
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Visão centralizada dos problemas críticos em seus projetos
        </p>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            {
              icon: '🔥',
              label: 'Módulos Críticos',
              value: stats.totalProblematicModules,
              color: 'red',
            },
            {
              icon: '🔄',
              label: 'Projetos com Ciclos',
              value: stats.projectsWithCycles,
              color:
                stats.projectsWithCycles === 0 ? 'green' : 'red',
            },
            {
              icon: '📉',
              label: 'Saúde Baixa',
              value: stats.projectsWithLowHealth,
              color: stats.projectsWithLowHealth === 0 ? 'green' : 'red',
            },
            {
              icon: '⚠️',
              label: 'Projetos Afetados',
              value: stats.affectedProjects,
              color: 'orange',
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`rounded-xl border-2 p-4 ${
                stat.color === 'red'
                  ? 'border-red-300/50 dark:border-red-700/50 bg-red-50/50 dark:bg-red-950/20'
                  : stat.color === 'green'
                    ? 'border-green-300/50 dark:border-green-700/50 bg-green-50/50 dark:bg-green-950/20'
                    : 'border-orange-300/50 dark:border-orange-700/50 bg-orange-50/50 dark:bg-orange-950/20'
              }`}
            >
              <p className="text-2xl mb-2">{stat.icon}</p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase mb-2">
                {stat.label}
              </p>
              <p
                className={`text-3xl font-bold ${stat.color === 'red' ? 'text-red-600 dark:text-red-400' : stat.color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Critical Hotspots */}
        {topHotspots.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              🔥 Módulos com Maior Acoplamento
            </h2>
            <div className="space-y-3">
              {topHotspots.map((hotspot) => (
                <Link
                  key={`${hotspot.module}-${hotspot.projectId}`}
                  href={`/dashboard/analyses/${hotspot.analysisId}`}
                  className={`block rounded-xl border-2 p-6 transition-all hover:shadow-lg hover:shadow-red-500/20 ${getCouplingBg(hotspot.totalCoupling)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono bg-white/50 dark:bg-slate-900/50 px-3 py-1 rounded-lg text-slate-700 dark:text-slate-300">
                          {hotspot.module}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${getCouplingColor(hotspot.totalCoupling)}`}
                        >
                          {hotspot.totalCoupling} ligações
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <span>📦 {hotspot.projectName}</span>
                        <span
                          className={`font-semibold ${getHealthColor(hotspot.score)}`}
                        >
                          {hotspot.score}/100 - Grade {hotspot.grade}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-4 py-2 rounded-lg bg-white/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-semibold">
                        Ver Análise →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Projects with Cycles */}
        {topCycleProjects.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              🔄 Projetos com Ciclos de Dependência
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {topCycleProjects.map((project) => (
                <Link
                  key={project.projectId}
                  href={`/dashboard/projects/${project.projectId}`}
                  className="rounded-xl border-2 border-red-300/50 dark:border-red-700/50 bg-red-50/50 dark:bg-red-950/20 p-6 hover:shadow-lg hover:shadow-red-500/20 transition-all"
                >
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                    ⚠️ {project.cycles}
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {project.projectName}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    ciclo(s) detectado(s)
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Low Health Projects */}
        {worstHealthProjects.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
              📉 Projetos com Saúde Baixa
            </h2>
            <div className="space-y-3">
              {worstHealthProjects.map((project) => (
                <Link
                  key={project.projectId}
                  href={`/dashboard/analyses/${project.analysisId}`}
                  className={`block rounded-xl border-2 p-6 transition-all hover:shadow-lg hover:shadow-yellow-500/20 ${getHealthBg(project.score)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`text-3xl font-bold ${getHealthColor(project.score)}`}
                        >
                          {project.score}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${getHealthColor(project.score)}`}
                        >
                          Grade {project.grade}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        📦 {project.projectName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-4 py-2 rounded-lg bg-white/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-semibold">
                        Melhorar →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {topHotspots.length === 0 &&
          topCycleProjects.length === 0 &&
          worstHealthProjects.length === 0 && (
            <div className="rounded-2xl border border-green-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/30 backdrop-blur-xl p-12 text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
                ✅ Excelente!
              </p>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Todos os seus projetos estão saudáveis! Nenhum problema crítico detectado.
              </p>
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                Voltar para Dashboard
              </Link>
            </div>
          )}
      </div>
    </div>
  );
}
