"use client";

import { useEffect, useState } from "react";

interface Repository {
  id: number;
  name: string;
  url: string;
  owner: string;
}

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewProjectModal({ isOpen, onClose, onSuccess }: NewProjectModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    repoUrl: "",
    provider: "github",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [showRepoList, setShowRepoList] = useState(false);

  // Fetch repositories when component mounts
  useEffect(() => {
    if (isOpen && repositories.length === 0) {
      fetchRepositories();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchRepositories = async () => {
    try {
      setLoadingRepos(true);
      const response = await fetch("/api/github/repositories");
      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);
      }
    } catch (err) {
      console.error("Erro ao buscar repositórios:", err);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectRepository = (repo: Repository) => {
    setFormData({
      ...formData,
      name: formData.name || repo.name,
      repoUrl: repo.url,
    });
    setShowRepoList(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar projeto");
      }

      setFormData({ name: "", repoUrl: "", provider: "github" });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar projeto");
    } finally {
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
      <div className="relative z-[10000] mx-4 w-full max-w-lg rounded-2xl border border-gray-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/95 backdrop-blur-xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
        >
          <span className="text-2xl">✕</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-block mb-3">
            <span className="text-4xl">📁</span>
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-2">
            Novo Projeto
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Conecte um repositório para análise
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-400 font-medium">⚠️ {error}</p>
            </div>
          )}

          {/* Project Name */}
          <div className="space-y-3">
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-gray-900 dark:text-white"
            >
              Nome do Projeto
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-lg">📝</span>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Meu SaaS..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-700/30 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-gray-100 dark:focus:bg-slate-700/50 focus:outline-none transition-all text-sm font-medium"
                required
              />
            </div>
          </div>

          {/* Provider */}
          <div className="space-y-3">
            <label
              htmlFor="provider"
              className="block text-sm font-semibold text-gray-900 dark:text-white"
            >
              Provedor
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-lg">🔗</span>
              <select
                id="provider"
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-700/30 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-gray-100 dark:focus:bg-slate-700/50 focus:outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
              >
                <option value="github" className="bg-white dark:bg-slate-800">
                  GitHub
                </option>
                <option value="gitlab" className="bg-white dark:bg-slate-800">
                  GitLab
                </option>
                <option value="bitbucket" className="bg-white dark:bg-slate-800">
                  Bitbucket
                </option>
              </select>
              <span className="absolute right-4 top-3.5 text-gray-500 dark:text-slate-500 pointer-events-none">⌄</span>
            </div>
          </div>

          {/* Repository URL */}
          <div className="space-y-3">
            <label
              htmlFor="repoUrl"
              className="block text-sm font-semibold text-gray-900 dark:text-white"
            >
              Repositório
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-lg">🌐</span>
              <input
                type="url"
                id="repoUrl"
                name="repoUrl"
                value={formData.repoUrl}
                onChange={handleChange}
                onFocus={() => setShowRepoList(true)}
                placeholder="https://github.com/usuario/repo"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-700/30 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-500/50 focus:bg-gray-100 dark:focus:bg-slate-700/50 focus:outline-none transition-all text-sm font-medium"
                required
              />
            </div>

            {/* Repository List */}
            {showRepoList && repositories.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-gray-300 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-700/30 divide-y divide-gray-200 dark:divide-slate-700/50">
                {loadingRepos ? (
                  <div className="p-3 text-center text-gray-600 dark:text-slate-400 text-sm">
                    Carregando repositórios...
                  </div>
                ) : (
                  repositories.map((repo) => (
                    <button
                      key={repo.id}
                      type="button"
                      onClick={() => handleSelectRepository(repo)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span>📦</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {repo.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-slate-400 truncate">
                            {repo.owner}/{repo.name}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
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
                  <span className="animate-spin">⚙️</span> Criando...
                </span>
              ) : (
                <span>✨ Criar Projeto</span>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 rounded-xl border border-gray-300 dark:border-slate-700/50 bg-gray-100 dark:bg-slate-700/30 text-gray-900 dark:text-slate-300 font-semibold hover:bg-gray-200 dark:hover:bg-slate-700/50 hover:border-gray-400 dark:hover:border-slate-600 transition-all duration-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
