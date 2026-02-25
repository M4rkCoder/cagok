import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { useAppStore } from "./useAppStore";

interface SettingState {
  // DB Settings
  dbPath: string;
  exportPath: string;
  backups: string[];
  autoBackupEnabled: boolean;
  lastAutoBackupDate: string | null;

  // General Settings
  appName: string;
  currency: string;
  defaultView: string;

  // Actions - DB
  fetchDbPaths: () => Promise<void>;
  fetchBackups: () => Promise<void>;
  fetchAutoBackupSettings: () => Promise<void>;
  toggleAutoBackup: (enabled: boolean) => Promise<void>;
  createBackup: () => Promise<void>;
  restoreBackup: (filename: string) => Promise<void>;
  deleteBackup: (filename: string) => Promise<void>;
  openFolder: (type: "db" | "export" | "backup") => Promise<void>;
  exportCsv: () => Promise<void>;
  restartApp: () => Promise<void>;

  // Actions - General
  fetchGeneralSettings: () => Promise<void>;
  saveGeneralSettings: (settings: {
    appName: string;
    currency: string;
    defaultView: string;
    language: string;
  }) => Promise<void>;
}

export const useSettingStore = create<SettingState>((set, get) => ({
  // Initial State
  dbPath: "",
  exportPath: "",
  backups: [],
  autoBackupEnabled: false,
  lastAutoBackupDate: null,
  appName: "",
  currency: "KRW",
  defaultView: "timeline",

  // --- DB Actions ---

  fetchDbPaths: async () => {
    try {
      const [dbPath, exportPath] = await Promise.all([
        invoke<string>("get_db_path"),
        invoke<string>("get_export_path"),
      ]);
      set({ dbPath, exportPath });
    } catch (error) {
      console.error("Failed to fetch paths", error);
    }
  },

  fetchBackups: async () => {
    try {
      const backups = await invoke<string[]>("list_backups");
      set({ backups });
    } catch (error) {
      toast.error("백업 목록을 불러오지 못했습니다.");
    }
  },

  fetchAutoBackupSettings: async () => {
    try {
      const [enabledStr, lastDate] = await Promise.all([
        invoke<string | null>("get_setting_command", {
          key: "auto_backup_enabled",
        }),
        invoke<string | null>("get_setting_command", {
          key: "last_auto_backup_date",
        }),
      ]);
      set({
        autoBackupEnabled: enabledStr === "true",
        lastAutoBackupDate: lastDate,
      });
    } catch (error) {
      console.error("Failed to fetch auto backup settings", error);
    }
  },

  toggleAutoBackup: async (enabled: boolean) => {
    const originalState = get().autoBackupEnabled;
    set({ autoBackupEnabled: enabled });
    try {
      await invoke("set_setting_command", {
        key: "auto_backup_enabled",
        value: enabled ? "true" : "false",
      });
      if (enabled) {
        toast.success("자동 백업이 활성화되었습니다.");
      } else {
        toast.info("자동 백업이 비활성화되었습니다.");
      }
    } catch (error) {
      toast.error("설정 저장 실패");
      set({ autoBackupEnabled: originalState }); // Revert on failure
    }
  },

  createBackup: async () => {
    try {
      await invoke("backup_db");
      toast.success("백업이 성공적으로 생성되었습니다.");
      await get().fetchBackups();
    } catch (error) {
      toast.error(`백업 실패: ${error}`);
    }
  },

  restoreBackup: async (filename: string) => {
    try {
      await invoke("restore_backup", { filename });
      return Promise.resolve();
    } catch (error) {
      toast.error("복원 실패");
      return Promise.reject(error);
    }
  },

  deleteBackup: async (filename: string) => {
    try {
      await invoke("delete_backup", { filename });
      toast.success("백업 삭제 완료");
      await get().fetchBackups();
    } catch (error) {
      toast.error("삭제 실패");
    }
  },

  openFolder: async (type) => {
    try {
      let command = "";
      switch (type) {
        case "db":
          command = "open_db_folder";
          break;
        case "export":
          command = "open_export_folder";
          break;
        case "backup":
          command = "open_backup_folder";
          break;
      }
      if (command) await invoke(command);
    } catch (error) {
      console.error(`Failed to open ${type} folder`, error);
    }
  },

  exportCsv: async () => {
    try {
      await invoke("export_transactions_csv");
      toast.success("CSV 추출 완료");
      await get().openFolder("export");
    } catch (error) {
      toast.error("CSV 추출 실패");
    }
  },

  restartApp: async () => {
    await invoke("restart_app");
  },

  // --- General Actions ---

  fetchGeneralSettings: async () => {
    try {
      const [appName, currency, defaultView] = await Promise.all([
        invoke<string | null>("get_setting_command", { key: "app_name" }),
        invoke<string | null>("get_setting_command", { key: "currency" }),
        invoke<string | null>("get_setting_command", { key: "default_view" }),
      ]);
      set({
        appName: appName || "C'agok",
        currency: currency || "KRW",
        defaultView: defaultView || "timeline",
      });
    } catch (error) {
      console.error("Failed to fetch general settings", error);
    }
  },

  saveGeneralSettings: async ({ appName, currency, defaultView, language }) => {
    try {
      await Promise.all([
        invoke("set_setting_command", { key: "app_name", value: appName }),
        invoke("set_setting_command", { key: "currency", value: currency }),
        invoke("set_setting_command", {
          key: "default_view",
          value: defaultView,
        }),
        invoke("set_setting_command", { key: "language", value: language }),
      ]);

      // 1. SettingStore 로컬 상태 업데이트
      set({ appName, currency, defaultView });

      // 2. AppStore 글로벌 상태 업데이트 (중요!)
      const appStore = useAppStore.getState();
      appStore.setAppName(appName);
      appStore.setCurrency(currency); // 새로 추가한 액션 호출

      // 언어 변경 처리
      if (appStore.language !== language) {
        appStore.updateSetting("language", language);
      }

      toast.success("설정이 저장되었습니다.");
    } catch (error) {
      console.error("Settings save failed", error);
      toast.error("설정 저장에 실패했습니다.");
    }
  },
}));
