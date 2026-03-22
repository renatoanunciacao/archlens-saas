"use client";

import { AnalysisJobTracker } from "@/app/components/analysis-job-tracker";
import { useState } from "react";

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onSuccess: () => void;
}

export function AnalysisModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onSuccess,
}: AnalysisModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Queue the analysis job
      const response = await fetch("/api/analyses/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao executar análise");
      }

      const data = await response.json();
      setJobId(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao executar análise");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative z-[10000] mx-4 w-full max-w-lg rounded-2xl border border-slate-700/50 bg-slate-800/95 backdrop-blur-xl p-8 shadow-2xl pointer-events-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-300 transition-colors"
        >
          <span className="text-2xl">✕</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-block mb-3">
            <span className="text-4xl">{jobId ? "⏳" : "📊"}</span>
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-2">
            {jobId ? "Processando Análise" : "Analisar Arquitetura"}
          </h1>
          <p className="text-slate-400">
            {jobId
              ? "Acompanhe o progresso da análise em tempo real"
              : "Analise a arquitetura automaticamente com ArchLens"}
          </p>
        </div>

        {/* Content */}
        {jobId ? (
          <AnalysisJobTracker
            jobId={jobId}
            projectName={projectName}
            onComplete={() => {
              onSuccess();
              setTimeout(onClose, 2000);
            }}
            onError={() => {
              setJobId(null);
              setError(
                "Erro ao processar análise. Tente novamente."
              );
            }}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-sm text-red-400 font-medium">⚠️ {error}</p>
              </div>
            )}

            {/* Project Name Display */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white">
                Projeto
              </label>
              <div className="rounded-xl border border-slate-700/50 bg-slate-700/30 p-3">
                <p className="text-white font-medium">{projectName}</p>
                <p className="text-xs text-slate-500">#{projectId.slice(0, 8)}</p>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-400 mb-3 font-semibold">
                🤖 PROCESSO AUTOMÁTICO
              </p>
              <div className="space-y-2 text-sm text-slate-500">
                <div className="flex gap-2">
                  <span className="text-blue-400">▸</span>
                  <span>Clone automático do repositório</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400">▸</span>
                  <span>Instalação de dependências</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400">▸</span>
                  <span>Análise completa da arquitetura</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-blue-400">▸</span>
                  <span>Limpeza automática dos arquivos</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-3">
                Pode levar 1-5 minutos dependendo do tamanho do projeto
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚙️</span> Analisando...
                  </span>
                ) : (
                  <span>✨ Iniciar Análise</span>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3.5 rounded-xl border border-slate-700/50 bg-slate-700/30 text-slate-300 font-semibold hover:bg-slate-700/50 hover:border-slate-600 transition-all duration-200"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
