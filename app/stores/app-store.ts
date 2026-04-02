import { create } from "zustand";

type AppUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

type AppState = {
  user: AppUser;
  setUser: (user: AppUser) => void;
  setSelectedProjectId: (projectId: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
    selectedProjectId: string | null;
  sidebarOpen: boolean;
};



export const useAppStore = create<AppState>((set) => ({
  user: null,
  selectedProjectId: null,
  sidebarOpen: true,
  setUser: (user) => set({ user }),
  setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));