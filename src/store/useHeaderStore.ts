import { create } from "zustand";
import { ReactNode } from "react";

interface HeaderState {
  title: string;
  actions: ReactNode | null;
  activeSection: string | null;
  setHeader: (title: string, actions?: ReactNode) => void;
  resetHeader: () => void;
  setActiveSection: (section: string) => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
  title: "",
  actions: null,
  activeSection: null,
  setHeader: (title, actions = null) => set({ title, actions }),
  resetHeader: () => set({ title: "", actions: null }),
  setActiveSection: (section) =>
    set({
      activeSection: section,
    }),
}));
