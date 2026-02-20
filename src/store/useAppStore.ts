import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { Category } from "@/types";
import i18n from "@/i18n";
import { toast } from "sonner";
import { useSyncStore } from "./useSyncStore";

interface AppState {
  appName: string;
  language: string;
  categoryList: Category[];
  isLoading: boolean;

  // Actions
  setAppName: (name: string) => void;
  initApp: () => Promise<void>;
  updateSetting: (key: "app_name" | "language", value: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  appName: "C'agok",
  language: "ko",
  categoryList: [],
  isLoading: true,
  setAppName: (name: string) => set({ appName: name }),
  initApp: async () => {
    set({ isLoading: true });
    try {
      await Promise.all([
        (async () => {
          const name = await invoke<string>("get_setting_command", {
            key: "app_name",
          });
          const lang = await invoke<string>("get_setting_command", {
            key: "language",
          });
          if (lang) i18n.changeLanguage(lang);
          set({ appName: name || "C'agok", language: lang || "ko" });
        })(),
        useSyncStore.getState().checkStatus(), // 타이틀바 상태용
        useSyncStore.getState().loadSettings(), // 자동 백업 설정용
      ]);

      await get().fetchCategories();
    } catch (error) {
      console.error("앱 초기화 실패:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  // 2. 설정값 변경 액션 (DB 업데이트 + 스토어 업데이트)
  updateSetting: async (key, value) => {
    try {
      await invoke("set_setting_command", { key, value });

      if (key === "app_name") set({ appName: value });
      if (key === "language") {
        set({ language: value });
        i18n.changeLanguage(value);
      }
    } catch (error) {
      toast.error(`${key} 저장 실패:`, error);
      console.error(`${key} 저장 실패:`, error);
    }
  },

  fetchCategories: async () => {
    try {
      const fetched = await invoke<Category[]>("get_categories");
      set({ categoryList: fetched });
    } catch (error) {
      toast.error("카테고리를 불러오는데 실패했습니다.");
    }
  },
}));
