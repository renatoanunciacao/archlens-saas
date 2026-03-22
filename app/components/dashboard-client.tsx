"use client";

import { createContext, useContext } from "react";

import { NewProjectModal } from "./modals/new-project-modal";
import { useState } from "react";

interface DashboardClientWrapperProps {
  children: React.ReactNode;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

export function DashboardClientWrapper({ children }: DashboardClientWrapperProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalSuccess = () => {
    // Reload the page to show new project
    setTimeout(() => window.location.reload(), 500);
  };

  // Create a context-like provider to pass modal control
  return (
    <DashboardContext.Provider value={{ isModalOpen, setIsModalOpen }}>
      {children}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </DashboardContext.Provider>
  );
}


interface DashboardContextType {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboardModal() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardModal must be used within DashboardClientWrapper");
  }
  return context;
}
