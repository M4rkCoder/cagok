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
  setCurrency: (currency: string) => void;
  initApp: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  appName: "C'agok",
  language: "ko-KR", // JSON의 lang 설정에 맞춤
  currency: "KRW",
  categoryList: [],
  isLoading: true,

  setAppName: (name: string) => set({ appName: name }),
  setCurrency: (currency: string) => set({ currency }),

  initApp: async () => {
    set({ isLoading: true });
    try {
      const [name, lang, currency] = await Promise.all([
        invoke<string | null>("get_setting_command", { key: "app_name" }),
        invoke<string | null>("get_setting_command", { key: "language" }),
        invoke<string | null>("get_setting_command", { key: "currency" }),
        useSyncStore.getState().checkStatus(),
        useSyncStore.getState().loadSettings(),
      ]);

      if (lang) i18n.changeLanguage(lang);

      set({
        appName: name || "C'agok",
        language: lang || "ko-KR",
        currency: currency || "KRW",
      });

      await get().fetchCategories();

      // OneDrive 동기화 확인 로직
      const syncStore = useSyncStore.getState();
      const { confirm, closeConfirm } = useConfirmStore.getState();

      if (syncStore.status.is_connected && !syncStore.autoSyncEnabled) {
        const syncStatus = await invoke<SyncCheckResult>(
          "check_onedrive_sync_status"
        );

        if (syncStatus.needs_update) {
          confirm({
            title: i18n.t("settings.sync.title"), // "클라우드 동기화"
            description: i18n.t("settings.sync.restore_confirm_desc"), // "OneDrive에서 데이터를 가져와..."
            confirmText: i18n.t("settings.sync.restore_from_cloud"), // "클라우드에서 복구"
            cancelText: i18n.t("common.cancel"), // "취소"
            onConfirm: async () => {
              try {
                set({ isLoading: true });
                await invoke("onedrive_restore");
                toast.success(
                  i18n.t("settings.database.restore_complete_title")
                ); // "복원 완료"

                setTimeout(() => {
                  window.location.reload();
                }, 800);
              } catch (err) {
                toast.error(i18n.t("settings.sync.syncing_desc")); // 오류 시 적절한 메시지 매핑
                console.error(err);
              } finally {
                closeConfirm();
              }
            },
          });
        }
      }
    } catch (error) {
      console.error("App Initialization Failed:", error);
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
      toast.error(i18n.t("toast.save_transaction_failed"));
      console.error(`${key} save failed:`, error);
    }
  },

  fetchCategories: async () => {
    try {
      const fetched = await invoke<Category[]>("get_categories");
      set({ categoryList: fetched });
    } catch (error) {
      toast.error(i18n.t("toast.fetch_categories_failed"));
    }
  },
}));
