"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    repoUrl: "",
    provider: "github",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao criar projeto"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-300/20 dark:bg-purple-500/10 rounded-full blur-3xl -ml-48 -mb-48"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-lg">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 font-medium mb-8 transition-colors"
        >
          <span>←</span> Voltar ao Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="inline-block mb-3">
            <span className="text-4xl">📁</span>
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent mb-2">
            Novo Projeto
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Conecte um repositório para análise de arquitetura
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-blue-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-red-300/50 dark:border-red-500/30 bg-red-100/50 dark:bg-red-500/10 p-4 animate-pulse">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">⚠️ {error}</p>
              </div>
            )}

            {/* Project Name */}
            <div className="space-y-3">
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-slate-900 dark:text-white"
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
                  placeholder="Ex: Meu SaaS, API Rest..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-700/50 bg-slate-700/30 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-slate-700/50 focus:outline-none focus:ring-0 transition-all text-sm font-medium"
                  required
                />
              </div>
              <p className="text-xs text-slate-500">Escolha um nome descritivo para seu projeto</p>
            </div>

            {/* Provider */}
            <div className="space-y-3">
              <label
                htmlFor="provider"
                className="block text-sm font-semibold text-white"
              >
                Provedor de Repositório
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-lg">🔗</span>
                <select
                  id="provider"
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-700/50 bg-slate-700/30 text-white focus:border-blue-500/50 focus:bg-slate-700/50 focus:outline-none focus:ring-0 transition-all text-sm font-medium appearance-none cursor-pointer"
                >
                  <option value="github" className="bg-slate-800">
                    GitHub
                  </option>
                  <option value="gitlab" className="bg-slate-800">
                    GitLab
                  </option>
                  <option value="bitbucket" className="bg-slate-800">
                    Bitbucket
                  </option>
                </select>
                <span className="absolute right-4 top-3.5 text-slate-500 pointer-events-none">⌄</span>
              </div>
              <p className="text-xs text-slate-500">Selecione o provedor do seu repositório</p>
            </div>

            {/* Repository URL */}
            <div className="space-y-3">
              <label
                htmlFor="repoUrl"
                className="block text-sm font-semibold text-white"
              >
                URL do Repositório
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-lg">🌐</span>
                <input
                  type="url"
                  id="repoUrl"
                  name="repoUrl"
                  value={formData.repoUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/usuario/projeto"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-700/50 bg-slate-700/30 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-slate-700/50 focus:outline-none focus:ring-0 transition-all text-sm font-medium"
                  required
                />
              </div>
              <p className="text-xs text-slate-500">URL completa do seu repositório público</p>
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
              <Link
                href="/dashboard"
                className="flex-1 px-6 py-3.5 rounded-xl border border-slate-700/50 bg-slate-700/30 text-slate-300 font-semibold hover:bg-slate-700/50 hover:border-slate-600 transition-all duration-200 text-center"
              >
                Cancelar
              </Link>
            </div>

            {/* Info Box */}
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <p className="text-xs text-slate-400 mb-3 font-semibold">💡 PRECISA DE AJUDA?</p>
              <p className="text-sm text-slate-500 leading-relaxed">
                A URL deve ser pública. Você pode encontrá-la clicando em &quot;Code&quot; no seu repositório e copiando a URL HTTPS.
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
