import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
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
      // 두 가지 설정값을 병렬로 가져옵니다.
      const [backupVal, syncVal] = await Promise.all([
        invoke<string | null>("get_setting_command", {
          key: "auto_onedrive_backup",
        }),
        invoke<string | null>("get_setting_command", {
          key: "onedrive_auto_sync", // 우리가 추가한 키
        }),
      ]);

      set({
        autoBackup: backupVal === "true",
        autoSyncEnabled: syncVal === "true", // 이제 인터페이스 에러가 사라집니다.
      });
    } catch (e) {
      console.error("설정을 불러오는 중 오류 발생:", e);
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
      toast.success("설정이 저장되었습니다.");
    } catch (e) {
      console.error(e);
      toast.error("설정 저장 실패");
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
      toast.success("설정이 저장되었습니다.");
    } catch (e) {
      console.error(e);
      toast.error("설정 저장 실패");
      set({ autoSyncEnabled: previous });
    }
  },

  login: async () => {
    set({ isLoading: true });
    try {
      await invoke("onedrive_login");
      toast.success("OneDrive에 연결되었습니다.");
      await get().checkStatus();
    } catch (error) {
      toast.error(`로그인 실패: ${error}`);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await invoke("onedrive_logout");
      toast.success("연결이 해제되었습니다.");
      await get().checkStatus();
    } catch (error) {
      toast.error("로그아웃 실패");
    } finally {
      set({ isLoading: false });
    }
  },

  backup: async () => {
    set({ isLoading: true });
    try {
      await invoke("onedrive_backup");
      toast.success("백업이 완료되었습니다.");
      await get().checkStatus();
    } catch (error) {
      toast.error(`백업 실패: ${error}`);
    } finally {
      set({ isLoading: false });
    }
  },

  restore: async () => {
    set({ isLoading: true });
    try {
      await invoke("onedrive_restore");
      toast.success("복구가 완료되었습니다.");
      window.location.reload();
    } catch (error) {
      toast.error(`복구 실패: ${error}`);
      set({ isLoading: false });
    }
  },
}));
