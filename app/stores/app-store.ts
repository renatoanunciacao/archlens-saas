import { create } from "zustand";

export type AppUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

type AppState = {
  user: AppUser;
  selectedProjectId: string | null;
  sidebarOpen: boolean;
  setUser: (user: AppUser) => void;
  setSelectedProjectId: (projectId: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
};

export const useAppStore = create<AppState>()((set) => ({
  user: null,
  selectedProjectId: null,
  sidebarOpen: true,
  setUser: (user) => set({ user }),
  setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));