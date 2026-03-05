import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useTranslation } from "react-i18next";

export function useAutoBackupNotification() {
  const { t } = useTranslation();
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  useEffect(() => {
    const checkNotification = async () => {
      try {
        const pending = await invoke<string | null>("get_setting_command", {
          key: "backup_notification_pending",
        });

        if (pending === "true") {
          addNotification({
            count: 1,
            message: t("notifications.types.backup"),
            timestamp: new Date().toISOString(),
            type: "backup",
            link: "/settings/db",
          });

          // Clear the flag
          await invoke("set_setting_command", {
            key: "backup_notification_pending",
            value: "false",
          });
        }
      } catch (error) {
        console.error("Failed to check backup notification:", error);
      }
    };

    checkNotification();
  }, [addNotification, t]);
}
