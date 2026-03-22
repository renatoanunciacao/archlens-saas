import { HtmlReportDownload } from "@/app/components/html-report-download";
import { HtmlReportFrame } from "@/app/components/html-report-frame";
import Link from "next/link";
import { authOptions } from "@/app/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function HtmlReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-300/20 dark:bg-purple-500/10 rounded-full blur-3xl -ml-48 -mb-48"></div>
      </div>

      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <div className="border-b border-blue-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/30 backdrop-blur-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/analyses"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              ← Voltar aos Relatórios
            </Link>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
            <Link
              href={`/dashboard/analyses/${id}`}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              📈 Ver Análise Completa
            </Link>
          </div>

          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent flex items-center gap-2 flex-1 text-center">
            📊 Relatório HTML do ArchLens
          </h1>

          <div className="w-32 text-right">
            <HtmlReportDownload analysisId={id} />
          </div>
        </div>

        {/* HTML Report Iframe */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full rounded-xl border border-blue-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800/30 shadow-lg overflow-hidden">
            <HtmlReportFrame analysisId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
