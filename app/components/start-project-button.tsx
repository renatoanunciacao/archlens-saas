"use client";

import { useDashboardModal } from "./dashboard-client";

export function StartProjectButton() {
  const { setIsModalOpen } = useDashboardModal();

  return (
    <button
      onClick={() => setIsModalOpen(true)}
      className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-200"
    >
      Começar Agora →
    </button>
  );
}
