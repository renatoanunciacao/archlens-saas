"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RunAnalysisButton({ projectId }: { projectId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyses/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha ao iniciar análise");
      }

      const data = await response.json();
      
      // Redirect to the analysis HTML report
      if (data.analysisId) {
        router.push(`/dashboard/analyses/html/${data.analysisId}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleRunAnalysis}
        disabled={isLoading}
        className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-center"
      >
        {isLoading ? "🔄 Analisando..." : "🚀 Analisar"}
      </button>
      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 mt-2 text-center">
          {error}
        </div>
      )}
    </>
  );
}
