"use client";

export function HtmlReportDownload({ analysisId }: { analysisId: string }) {
  return (
    <button
      onClick={async () => {
        try {
          const response = await fetch(`/api/analyses/html?id=${analysisId}`);
          if (!response.ok) throw new Error("Failed to generate report");

          const html = await response.text();
          const blob = new Blob([html], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `archlens-report-${analysisId.slice(0, 8)}.html`;
          link.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Download failed:", error);
          alert("Erro ao baixar relatório");
        }
      }}
      className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
    >
      ⬇️ Download
    </button>
  );
}
