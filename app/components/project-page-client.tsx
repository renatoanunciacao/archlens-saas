"use client";

import { AnalysisModal } from "@/app/components/modals/analysis-modal";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProjectPageClientProps {
  projectId: string;
  projectName: string;
}

export function ProjectPageClient({ projectId, projectName }: ProjectPageClientProps) {
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const router = useRouter();

  const handleAnalysisSuccess = () => {
    router.refresh();
    setTimeout(() => {
      router.push("/dashboard/analyses");
    }, 1000);
  };

  return (
    <>
      <button
        onClick={() => setIsAnalysisModalOpen(true)}
        className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-200 cursor-pointer"
      >
        📊 Analisar Arquitetura
      </button>

      <AnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        projectId={projectId}
        projectName={projectName}
        onSuccess={handleAnalysisSuccess}
      />
    </>
  );
}
