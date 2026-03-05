import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import i18n from "@/i18n"; // i18n 임포트 추가
import { OneDriveStatus } from "@/types";

interface SyncState {
  status: OneDriveStatus | null;
  isLoading: boolean;
  autoBackup: boolean;
  autoSyncEnabled: boolean;

  // Actions
  checkStatus: () => Promise<void>;
  loadSettings: () => Promise<void>;
  toggleAutoBackup: (checked: boolean) => Promise<void>;
  toggleAutoSync: (checked: boolean) => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  backup: () => Promise<void>;
  restore: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: null,
  isLoading: false,
  autoBackup: false,
  autoSyncEnabled: false,

  checkStatus: async () => {
    try {
      const result = await invoke<OneDriveStatus>("onedrive_check_status");
      set({ status: result });
    } catch (error) {
      console.error("Failed to check status:", error);
    }
  },

  loadSettings: async () => {
    try {
      const [backupVal, syncVal] = await Promise.all([
        invoke<string | null>("get_setting_command", {
          key: "auto_onedrive_backup",
        }),
        invoke<string | null>("get_setting_command", {
          key: "onedrive_auto_sync",
        }),
      ]);

      set({
        autoBackup: backupVal === "true",
        autoSyncEnabled: syncVal === "true",
      });
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  },

  toggleAutoBackup: async (checked: boolean) => {
    const previous = get().autoBackup;
    set({ autoBackup: checked });
    try {
      await invoke("set_setting_command", {
        key: "auto_onedrive_backup",
        value: checked ? "true" : "false",
      });
      toast.success(i18n.t("settings.general.save_button")); // "설정 저장하기" 완료 피드백
    } catch (e) {
      console.error(e);
      toast.error(i18n.t("toast.save_transaction_failed")); // "가계부 저장에 실패했습니다."
      set({ autoBackup: previous });
    }
  },

  toggleAutoSync: async (checked: boolean) => {
    const previous = get().autoSyncEnabled;
    set({ autoSyncEnabled: checked });
    try {
      await invoke("set_setting_command", {
        key: "onedrive_auto_sync",
        value: checked ? "true" : "false",
      });
      toast.success(i18n.t("settings.general.save_button"));
    } catch (e) {
      console.error(e);
      toast.error(i18n.t("toast.save_transaction_failed"));
      set({ autoSyncEnabled: previous });
    }
  },

  login: async () => {
    set({ isLoading: true });
    try {
      await invoke("onedrive_login");
      toast.success(i18n.t("settings.sync.connected")); // "연결됨"
      await get().checkStatus();
    } catch (error) {
      toast.error(
        `${i18n.t("settings.sync.login_button")} ${i18n.t("common.cancel")}: ${error}`
      );
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await invoke("onedrive_logout");
      toast.success(i18n.t("settings.sync.disconnected")); // "미연결" (연결 해제됨)
      await get().checkStatus();
    } catch (error) {
      toast.error(i18n.t("common.cancel"));
    } finally {
      set({ isLoading: false });
    }
  },

  backup: async () => {
    set({ isLoading: true });
    try {
      await invoke("onedrive_backup");
      toast.success(i18n.t("settings.sync.backup_now")); // "지금 백업하기" 완료 피드백
      await get().checkStatus();
    } catch (error) {
      toast.error(`${i18n.t("toast.save_transaction_failed")}: ${error}`);
    } finally {
      set({ isLoading: false });
    }
  },

  restore: async () => {
    set({ isLoading: true });
    try {
      await invoke("onedrive_restore");
      toast.success(i18n.t("settings.database.restore_complete_title")); // "복원 완료"
      window.location.reload();
    } catch (error) {
      toast.error(
        `${i18n.t("settings.database.restore")} ${i18n.t("common.cancel")}: ${error}`
      );
      set({ isLoading: false });
    }
  },
}));
