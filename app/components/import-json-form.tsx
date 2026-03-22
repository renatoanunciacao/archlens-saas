"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
}

export function ImportJsonForm({ userProjects }: { userProjects: Project[] }) {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    if (!selectedProject) {
      setError("Selecione um projeto primeiro");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", selectedProject);

      const response = await fetch("/api/analyses/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao importar JSON");
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar JSON");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Project Selection */}
      <div>
        <label htmlFor="project" className="block text-sm font-medium text-slate-300 mb-2">
          Selecione o Projeto
        </label>
        <select
          id="project"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full rounded-lg border border-slate-700/50 bg-slate-700/30 text-white px-4 py-2 focus:border-blue-500/50 focus:outline-none transition-all"
        >
          <option value="">-- Selecione um projeto --</option>
          {userProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload */}
      {selectedProject && (
        <div>
          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              disabled={loading}
              className="hidden"
            />
            <span className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/50 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "📥 Importando..." : "📁 Selecionar Arquivo JSON"}
            </span>
          </label>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-400">⚠️ {error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
          <p className="text-sm text-green-400">✅ Análise importada com sucesso!</p>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-slate-500 pt-2">
        💡 Gere um arquivo JSON com: <code className="bg-slate-900/50 px-2 py-1 rounded text-blue-300">archlens analyze . --format json --output report.json</code>
      </p>
    </div>
  );
}
