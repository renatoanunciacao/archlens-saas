import { analyses, projects } from "@/app/db/schema";
import { desc, eq } from "drizzle-orm";

import { DashboardHeader } from "@/app/components/dashboard-header";
import Link from "next/link";
import { ProjectHistoryClient } from "@/app/components/project-history-client";
import { ProjectPageClient } from "@/app/components/project-page-client";
import { authOptions } from "@/app/lib/auth";
import { db } from "@/app/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  let project;
  let projectAnalyses;
  let error = false;

  try {
    const [projectData] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));

    if (!projectData || projectData.userId !== session.user.id) {
      redirect("/dashboard");
    }

    project = projectData;

    const analyses_data = await db
      .select()
      .from(analyses)
      .where(eq(analyses.projectId, project.id))
      .orderBy(desc(analyses.createdAt));

    projectAnalyses = analyses_data;
  } catch (err) {
    console.error("Error loading project:", err);
    error = true;
  }

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
            href="/dashboard"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 mb-4 inline-flex items-center gap-2 mt-8"
          >
            ← Voltar
          </Link>
          <div className="rounded-2xl border border-red-300/50 dark:border-red-500/30 bg-red-100/50 dark:bg-red-500/10 backdrop-blur-xl p-8">
            <h1 className="text-2xl font-black text-red-600 dark:text-red-400 mb-4">
              ⚠️ Erro ao carregar projeto
            </h1>
            <p className="text-slate-700 dark:text-slate-300 mb-6">
              Não conseguimos carregar os dados do projeto. Por favor, tente novamente ou retorne ao dashboard.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition-all"
            >
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!project || !projectAnalyses) {
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
        <div className="mb-12 mt-8">
          <Link
            href="/dashboard"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 mb-4 inline-flex items-center gap-2"
          >
            ← Voltar
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                <span>📁</span>
                {project.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {project.provider && (
                  <>
                    <span className="capitalize text-blue-600 dark:text-blue-400">{project.provider}</span> • {project.repoName}
                  </>
                )}
              </p>
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 flex items-center gap-1"
                >
                  🔗 {project.repoUrl}
                </a>
              )}
            </div>
            <ProjectPageClient projectId={project.id} projectName={project.name} />
          </div>
        </div>

        {/* Project Info Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-2">
              ID DO PROJETO
            </h3>
            <p className="text-lg font-mono text-white">{project.id}</p>
          </div>

          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-2">
              CRIADO EM
            </h3>
            <p className="text-lg text-white">
              {new Date(project.createdAt!).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        {/* Analyses History */}
        <ProjectHistoryClient
          analyses={projectAnalyses}
          projectName={project.name}
        />
      </div>
    </div>
  );
}
