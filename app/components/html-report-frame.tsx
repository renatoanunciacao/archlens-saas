"use client";

export function HtmlReportFrame({ analysisId }: { analysisId: string }) {
  return (
    <iframe
      src={`/api/analyses/html?id=${analysisId}`}
      className="w-full h-full border-none"
      title="ArchLens HTML Report"
      sandbox="allow-same-origin allow-scripts"
    />
  );
}
