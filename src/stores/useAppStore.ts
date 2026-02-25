import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { Category, SyncCheckResult } from "@/types";
import i18n from "@/i18n";
import { toast } from "sonner";
import { useSyncStore } from "./useSyncStore";
import { useConfirmStore } from "./useConfirmStore";

interface AppState {
  appName: string;
  language: string;
  currency: string;
  categoryList: Category[];
  isLoading: boolean;

  // Actions
  setAppName: (name: string) => void;
  setCurrency: (currency: string) => void; // 다른 스토어에서 연동하기 위해 추가
  initApp: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  appName: "C'agok",
  language: "ko", // 기본값 통일
  currency: "KRW", // 기본값 통일
  categoryList: [],
  isLoading: true,

  setAppName: (name: string) => set({ appName: name }),
  setCurrency: (currency: string) => set({ currency }), // 추가된 액션

  initApp: async () => {
    set({ isLoading: true });
    try {
      // 1. 설정값들을 병렬로 깔끔하게 가져옵니다. (IIFE 제거)
      const [name, lang, currency] = await Promise.all([
        invoke<string | null>("get_setting_command", { key: "app_name" }),
        invoke<string | null>("get_setting_command", { key: "language" }),
        invoke<string | null>("get_setting_command", { key: "currency" }),
        useSyncStore.getState().checkStatus(),
        useSyncStore.getState().loadSettings(),
      ]);

      if (lang) i18n.changeLanguage(lang);

      // 가져온 값들을 상태에 반영 (null일 경우 기본값 사용)
      set({
        appName: name || "C'agok",
        language: lang || "ko",
        currency: currency || "KRW",
      });

      await get().fetchCategories();

      // 2. OneDrive 동기화 확인
      const syncStore = useSyncStore.getState();
      const { confirm, closeConfirm } = useConfirmStore.getState();

      if (syncStore.status.is_connected && !syncStore.autoSyncEnabled) {
        const syncStatus = await invoke<SyncCheckResult>(
          "check_onedrive_sync_status"
        );

        if (syncStatus.needs_update) {
          confirm({
            title: i18n.t("sync.title", "데이터 동기화 알림"),
            description: i18n.t(
              "sync.confirm_description",
              "클라우드에 더 최신 데이터가 있습니다. 지금 동기화하여 데이터를 업데이트하시겠습니까?"
            ),
            confirmText: i18n.t("common.sync_now", "지금 동기화"),
            cancelText: i18n.t("common.later", "나중에"),
            onConfirm: async () => {
              try {
                set({ isLoading: true });
                await invoke("onedrive_restore");
                toast.success(
                  i18n.t("sync.success", "동기화가 완료되었습니다.")
                );

                // DB 파일 교체 후 재시작
                setTimeout(() => {
                  window.location.reload();
                }, 800);
              } catch (err) {
                toast.error(
                  i18n.t("sync.fail", "동기화 중 오류가 발생했습니다.")
                );
                console.error(err);
              } finally {
                closeConfirm();
              }
            },
          });
        }
      }
    } catch (error) {
      console.error("앱 초기화 실패:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateSetting: async (key, value) => {
    try {
      await invoke("set_setting_command", { key, value });

      if (key === "app_name") set({ appName: value });
      if (key === "language") {
        set({ language: value });
        i18n.changeLanguage(value);
      }
      if (key === "currency") set({ currency: value });

      if (key === "onedrive_auto_sync") {
        useSyncStore.setState({ autoSyncEnabled: value === "true" });
      }
    } catch (error) {
      toast.error(`${key} 저장 실패`);
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
