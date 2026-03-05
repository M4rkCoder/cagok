import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import i18n from "@/i18n"; // i18n 임포트 추가
import { useAppStore } from "./useAppStore";

interface SettingState {
  dbPath: string;
  exportPath: string;
  backups: string[];
  autoBackupEnabled: boolean;
  lastAutoBackupDate: string | null;
  appName: string;
  currency: string;
  defaultView: string;
  dateFormat: string;

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
  fetchGeneralSettings: () => Promise<void>;
  saveGeneralSettings: (settings: {
    appName: string;
    currency: string;
    defaultView: string;
    language: string;
    dateFormat: string;
  }) => Promise<void>;
}

export const useSettingStore = create<SettingState>((set, get) => ({
  dbPath: "",
  exportPath: "",
  backups: [],
  autoBackupEnabled: false,
  lastAutoBackupDate: null,
  appName: "",
  currency: "KRW",
  defaultView: "timeline",
  dateFormat: "yyyy/MM/dd",

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
      toast.error(i18n.t("settings.database.no_backups")); //
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
      // 활성화/비활성화 상태 알림
      if (enabled) {
        toast.success(i18n.t("settings.database.auto_backup_label"));
      } else {
        toast.info(i18n.t("recurring.status.paused"));
      }
    } catch (error) {
      toast.error(i18n.t("toast.save_transaction_failed")); //
      set({ autoBackupEnabled: originalState });
    }
  },

  createBackup: async () => {
    try {
      await invoke("backup_db");
      toast.success(i18n.t("notifications.types.backup")); // "자동 백업 완료" (또는 적절한 백업 성공 키)
      await get().fetchBackups();
    } catch (error) {
      toast.error(i18n.t("toast.save_transaction_failed")); //
    }
  },

  restoreBackup: async (filename: string) => {
    try {
      await invoke("restore_backup", { filename });
      return Promise.resolve();
    } catch (error) {
      toast.error(
        i18n.t("settings.database.restore_dialog_title") +
          " " +
          i18n.t("common.cancel")
      );
      return Promise.reject(error);
    }
  },

  deleteBackup: async (filename: string) => {
    try {
      await invoke("delete_backup", { filename });
      toast.success(i18n.t("settings.database.delete_backup_title")); //
      await get().fetchBackups();
    } catch (error) {
      toast.error(i18n.t("common.delete") + " " + i18n.t("common.cancel"));
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
      toast.success(i18n.t("settings.database.download_title")); //
      await get().openFolder("export");
    } catch (error) {
      toast.error(i18n.t("quick_entry.toasts.template_error")); //
    }
  },

  restartApp: async () => {
    await invoke("restart_app"); //
  },

  // --- General Actions ---

  fetchGeneralSettings: async () => {
    try {
      const [appName, currency, defaultView, dateFormat] = await Promise.all([
        invoke<string | null>("get_setting_command", { key: "app_name" }),
        invoke<string | null>("get_setting_command", { key: "currency" }),
        invoke<string | null>("get_setting_command", { key: "default_view" }),
        invoke<string | null>("get_setting_command", { key: "date_format" }),
      ]);
      set({
        appName: appName || "C'agok",
        currency: currency || "KRW",
        defaultView: defaultView || "timeline",
        dateFormat: dateFormat || "yyyy/MM/dd",
      });
    } catch (error) {
      console.error("Failed to fetch general settings", error);
    }
  },

  saveGeneralSettings: async ({
    appName,
    currency,
    defaultView,
    language,
    dateFormat,
  }) => {
    try {
      await Promise.all([
        invoke("set_setting_command", { key: "app_name", value: appName }),
        invoke("set_setting_command", { key: "currency", value: currency }),
        invoke("set_setting_command", {
          key: "default_view",
          value: defaultView,
        }),
        invoke("set_setting_command", { key: "language", value: language }),
        invoke("set_setting_command", {
          key: "date_format",
          value: dateFormat,
        }),
      ]);

      set({ appName, currency, defaultView, dateFormat });

      const appStore = useAppStore.getState();
      appStore.setAppName(appName);
      appStore.setCurrency(currency);

      if (appStore.language !== language) {
        appStore.updateSetting("language", language); // 여기서 i18n.changeLanguage 처리됨
      }

      toast.success(i18n.t("settings.general.save_button")); // "설정 저장하기" 완료 피드백
    } catch (error) {
      console.error("Settings save failed", error);
      toast.error(i18n.t("toast.save_transaction_failed")); //
    }
  },
}));
