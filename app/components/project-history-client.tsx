'use client';

import { HealthTrendChart } from '@/app/components/charts/health-trend-chart';
import Link from 'next/link';
import { useState } from 'react';

interface Analysis {
  id: string;
  projectId: string;
  structuralHealthScore: number | null;
  structuralHealthGrade: string | null;
  createdAt: Date;
}

interface TrendData {
  date: string;
  score: number;
  grade: string;
}

type PeriodFilter = '7d' | '30d' | '90d' | 'all';

interface ProjectHistoryClientProps {
  analyses: Analysis[];
  projectName: string;
}

export function ProjectHistoryClient({
  analyses,
  projectName,
}: ProjectHistoryClientProps) {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');

  const getFilteredAnalyses = () => {
    if (periodFilter === 'all') return analyses;

    const now = new Date();
    const days = periodFilter === '7d' ? 7 : periodFilter === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return analyses.filter((a) => new Date(a.createdAt) >= cutoff);
  };

  const filteredAnalyses = getFilteredAnalyses();

  const trendData: TrendData[] = [...filteredAnalyses]
    .reverse()
    .map((a) => ({
      date: new Date(a.createdAt).toISOString(),
      score: a.structuralHealthScore || 0,
      grade: a.structuralHealthGrade || 'N/A',
    }));

  const stats = {
    total: filteredAnalyses.length,
    latest: filteredAnalyses[0]?.structuralHealthScore || 0,
    best: Math.max(
      ...(filteredAnalyses.length > 0
        ? filteredAnalyses.map((a) => a.structuralHealthScore || 0)
        : [0])
    ),
    worst: Math.min(
      ...(filteredAnalyses.length > 0
        ? filteredAnalyses.map((a) => a.structuralHealthScore || 100)
        : [0])
    ),
    average:
      filteredAnalyses.length > 0
        ? Math.round(
            filteredAnalyses.reduce(
              (acc, a) => acc + (a.structuralHealthScore || 0),
              0
            ) / filteredAnalyses.length
          )
        : 0,
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80)
      return 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20';
    if (score >= 60)
      return 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/20';
    return 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20';
  };

  return (
    <div>
      {/* Period Filter */}
      <div className="mb-8 flex flex-wrap gap-3">
        {(['7d', '30d', '90d', 'all'] as const).map((period) => {
          const labels = {
            '7d': 'Últimos 7 dias',
            '30d': 'Últimos 30 dias',
            '90d': 'Últimos 90 dias',
            all: 'Todo o período',
          };

          return (
            <button
              key={period}
              onClick={() => setPeriodFilter(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                periodFilter === period
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'bg-white/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
            >
              {labels[period]}
            </button>
          );
        })}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        {[
          {
            icon: '📊',
            label: 'Análises',
            value: stats.total,
            color: 'blue',
          },
          {
            icon: '⬆️',
            label: 'Melhor Score',
            value: stats.best,
            color: 'green',
          },
          {
            icon: '⬇️',
            label: 'Pior Score',
            value: stats.worst,
            color: 'red',
          },
          {
            icon: '📈',
            label: 'Score Médio',
            value: stats.average,
            color: 'purple',
          },
          {
            icon: '🎯',
            label: 'Último Score',
            value: stats.latest,
            color:
              stats.latest >= 80
                ? 'green'
                : stats.latest >= 60
                  ? 'yellow'
                  : 'red',
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className={`rounded-xl border-2 p-4 ${
              stat.color === 'blue'
                ? 'border-blue-300/50 dark:border-blue-700/50 bg-blue-50/50 dark:bg-blue-950/20'
                : stat.color === 'green'
                  ? 'border-green-300/50 dark:border-green-700/50 bg-green-50/50 dark:bg-green-950/20'
                  : stat.color === 'yellow'
                    ? 'border-yellow-300/50 dark:border-yellow-700/50 bg-yellow-50/50 dark:bg-yellow-950/20'
                    : stat.color === 'red'
                      ? 'border-red-300/50 dark:border-red-700/50 bg-red-50/50 dark:bg-red-950/20'
                      : 'border-purple-300/50 dark:border-purple-700/50 bg-purple-50/50 dark:bg-purple-950/20'
            }`}
          >
            <p className="text-2xl mb-2">{stat.icon}</p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase mb-2">
              {stat.label}
            </p>
            <p
              className={`text-3xl font-bold ${getScoreColor(typeof stat.value === 'number' ? stat.value : 0)}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      {trendData.length > 0 && (
        <div className="mb-8 rounded-2xl border border-slate-300/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl p-8">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            📊 Evolução do Score
          </h3>
          <HealthTrendChart data={trendData} projectName={projectName} />
        </div>
      )}

      {/* Timeline */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          📅 Timeline de Análises
        </h2>

        {filteredAnalyses.length === 0 ? (
          <div className="rounded-2xl border border-slate-300/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/30 p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              Nenhuma análise no período selecionado
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => (
              <Link
                key={analysis.id}
                href={`/dashboard/analyses/${analysis.id}`}
                className={`block rounded-xl border-2 p-6 transition-all hover:shadow-lg hover:shadow-blue-500/20 ${getScoreBgColor(analysis.structuralHealthScore || 0)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl font-bold">
                        {analysis.structuralHealthScore}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold min-w-fit ${getScoreColor(analysis.structuralHealthScore || 0)}`}
                      >
                        Grade {analysis.structuralHealthGrade}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(analysis.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-4 py-2 rounded-lg bg-white/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-semibold">
                      Ver Detalhes →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
