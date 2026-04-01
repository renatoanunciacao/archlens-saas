'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

interface JobProgress {
  step: number;
  stepName: string;
  progress: number;
  message: string;
}

interface JobStatus {
  id: string;
  projectId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  analysisId?: string;
  error?: string;
  progressHistory: JobProgress[];
}

interface AnalysisJobTrackerProps {
  jobId: string;
  projectName: string;
  onComplete?: (analysisId: string) => void;
  onError?: (error: string) => void;
}

export function AnalysisJobTracker({
  jobId,
  projectName,
  onComplete,
  onError,
}: AnalysisJobTrackerProps) {
  const router = useRouter();
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { name: 'cloning', label: '📥 Clonando repositório', color: 'blue' },
    { name: 'analyzing', label: '🔍 Analisando arquitetura', color: 'purple' },
    { name: 'parsing', label: '📊 Processando resultados', color: 'orange' },
    { name: 'saving', label: '💾 Salvando análise', color: 'green' },
    { name: 'completed', label: '✅ Concluído', color: 'green' },
  ];

  const pollJobStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/analyses/jobs/${jobId}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }

      const data = await response.json();
      setJobStatus(data.job);

      // Stop polling when job is completed or failed
      if (data.job.status === 'completed' || data.job.status === 'failed') {
        setIsPolling(false);

        if (data.job.status === 'completed') {
          onComplete?.(data.job.analysisId);
        } else if (data.job.status === 'failed') {
          setError(data.job.error);
          onError?.(data.job.error);
        }
      }
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any)?.message);
      setIsPolling(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError?.((err as any)?.message);
    }
  }, [jobId, onComplete, onError]);

  // Poll job status
  useEffect(() => {
    if (!isPolling) return;

    // Poll immediately
    pollJobStatus();

    // Then poll every 1 second
    const interval = setInterval(pollJobStatus, 1000);
    return () => clearInterval(interval);
  }, [isPolling, pollJobStatus]);

  if (!jobStatus) {
    return (
      <div className="space-y-4">
        <div className="bg-slate-100 animate-pulse h-64 rounded-xl"></div>
      </div>
    );
  }

  type StepColor = 'blue' | 'purple' | 'orange' | 'green' | 'gray';

  const getStepColor = (stepName: string): StepColor => {
    if (jobStatus.status === 'failed') return 'gray';
    const step = steps.find((s) => s.name === stepName);
    return (step?.color as StepColor) || 'gray';
  };

  const isStepComplete = (stepIndex: number): boolean => {
    if (jobStatus.status === 'failed') return false;
    if (jobStatus.status === 'completed') return true;
    const currentStepIndex = steps.findIndex(
      (s) => s.name === jobStatus.progressHistory[jobStatus.progressHistory.length - 1]?.stepName
    );
    return stepIndex < currentStepIndex;
  };

  const isStepCurrent = (stepIndex: number): boolean => {
    const currentStepIndex = steps.findIndex(
      (s) => s.name === jobStatus.progressHistory[jobStatus.progressHistory.length - 1]?.stepName
    );
    return stepIndex === currentStepIndex;
  };

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Progresso: {jobStatus.progress}%
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-bold ${
              jobStatus.status === 'completed'
                ? 'text-green-600 bg-green-50'
                : jobStatus.status === 'failed'
                  ? 'text-red-600 bg-red-50'
                  : jobStatus.status === 'processing'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-yellow-600 bg-yellow-50'
            }`}
          >
            {jobStatus.status === 'processing' && '⏳ Processando'}
            {jobStatus.status === 'completed' && '✅ Concluído'}
            {jobStatus.status === 'failed' && '❌ Erro'}
            {jobStatus.status === 'pending' && '⏳ Pendente'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              jobStatus.status === 'completed'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : jobStatus.status === 'failed'
                  ? 'bg-gradient-to-r from-red-500 to-rose-500'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
            }`}
            style={{ width: `${jobStatus.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Steps Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Etapas
        </h3>

        <div className="space-y-3">
          {steps.map((step, idx) => {
            const isComplete = isStepComplete(idx);
            const isCurrent = isStepCurrent(idx);
            const color = getStepColor(step.name);

            const colorClasses = {
              blue: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20',
              purple:
                'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/20',
              orange:
                'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20',
              green: 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20',
              gray: 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/20',
            };

            return (
              <div
                key={step.name}
                className={`border-2 rounded-xl p-4 transition-all ${
                  isComplete || isCurrent
                    ? colorClasses[color]
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      isComplete
                        ? 'bg-green-500'
                        : isCurrent
                          ? `bg-${color}-500`
                          : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    {isComplete ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {jobStatus.message}
                      </p>
                    )}
                  </div>
                  {isCurrent && (
                    <div className="flex-shrink-0">
                      <div className="animate-spin">
                        <svg
                          className="w-5 h-5 text-blue-600 dark:text-blue-400"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border-2 border-red-300/50 dark:border-red-700/50 bg-red-50/50 dark:bg-red-950/20 p-4">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
            ❌ Erro
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {jobStatus.status === 'completed' && (
        <div className="rounded-xl border-2 border-green-300/50 dark:border-green-700/50 bg-green-50/50 dark:bg-green-950/20 p-4">
          <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
            ✅ Análise Concluída
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
            A análise de {projectName} foi processada com sucesso!
          </p>
          <button
            onClick={() =>
              router.push(`/dashboard/analyses/${jobStatus.analysisId}`)
            }
            className="inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg transition-all"
          >
            Ver Análise →
          </button>
        </div>
      )}
    </div>
  );
}
