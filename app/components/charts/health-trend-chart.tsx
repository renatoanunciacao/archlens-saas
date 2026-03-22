"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendData {
  date: string;
  score: number;
  grade: string;
}

interface HealthTrendChartProps {
  data: TrendData[];
  projectName: string;
}

export function HealthTrendChart({ data, projectName }: HealthTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-800/30 backdrop-blur-xl p-8 text-center">
        <p className="text-gray-600 dark:text-slate-400">Sem dados de tendência disponíveis</p>
      </div>
    );
  }

  // Prepare data for chart
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("pt-BR"),
  }));

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-800/30 backdrop-blur-xl p-8">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        📈 Evolução da Saúde - {projectName}
      </h3>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis
              dataKey="date"
              stroke="rgb(148, 163, 184)"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="rgb(148, 163, 184)"
              domain={[0, 100]}
              style={{ fontSize: "12px" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgb(30, 41, 59)",
                border: "1px solid rgb(71, 85, 105)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "rgb(226, 232, 240)" }}
              formatter={(value: number) => [`${value}/100`, "Score"]}
            />
            <Legend wrapperStyle={{ color: "rgb(148, 163, 184)" }} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="rgb(59, 130, 246)"
              strokeWidth={3}
              dot={{
                fill: "rgb(59, 130, 246)",
                r: 5,
              }}
              activeDot={{
                r: 7,
              }}
              isAnimationActive={true}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="bg-gray-100 dark:bg-slate-700/30 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Última análise</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {chartData[chartData.length - 1].score}
          </p>
        </div>
        <div className="bg-gray-100 dark:bg-slate-700/30 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Melhor score</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {Math.max(...chartData.map((d) => d.score))}
          </p>
        </div>
        <div className="bg-gray-100 dark:bg-slate-700/30 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Análises</p>
          <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{chartData.length}</p>
        </div>
      </div>
    </div>
  );
}
