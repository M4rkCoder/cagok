import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { Category } from "@/types";
import i18n from "@/i18n";
import { toast } from "sonner";

interface AppState {
  appName: string;
  language: string;
  categories: Category[];
  isLoading: boolean;

  // Actions
  setAppName: (name: string) => void;
  initApp: () => Promise<void>;
  updateSetting: (key: "app_name" | "language", value: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  appName: "Finkro",
  language: "ko",
  categories: [],
  isLoading: true,
  setAppName: (name: string) => set({ appName: name }),
  initApp: async () => {
    set({ isLoading: true });
    try {
      // 설정값 병렬 로드
      const [name, lang] = await Promise.all([
        invoke<string>("get_setting_command", { key: "app_name" }),
        invoke<string>("get_setting_command", { key: "language" }),
      ]);

      // i18next 언어 적용
      if (lang) {
        i18n.changeLanguage(lang);
      }

      set({
        appName: name || "Finkro",
        language: lang || "ko",
      });

      // 카테고리 로드도 함께 수행
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
      set({ categories: fetched });
    } catch (error) {
      toast.error("카테고리를 불러오는데 실패했습니다.");
    }
  },
}));
