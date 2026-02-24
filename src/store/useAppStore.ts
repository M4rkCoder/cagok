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
  categoryList: Category[];
  isLoading: boolean;

  // Actions
  setAppName: (name: string) => void;
  initApp: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
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
      // 2. OneDrive 동기화 확인 (커스텀 컨펌 스토어 사용)
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

                // DB 파일이 물리적으로 교체되었으므로 앱 재시작
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

  // 2. 설정값 변경 액션 (DB 업데이트 + 스토어 업데이트)
  updateSetting: async (key, value) => {
    try {
      await invoke("set_setting_command", { key, value });

      if (key === "app_name") set({ appName: value });
      if (key === "language") {
        set({ language: value });
        i18n.changeLanguage(value);
      }
      // 만약 sync 관련 설정을 여기서 변경한다면 syncStore도 업데이트
      if (key === "onedrive_auto_sync") {
        useSyncStore.setState({ autoSyncEnabled: value === "true" });
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
