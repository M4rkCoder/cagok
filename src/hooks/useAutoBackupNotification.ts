import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNotificationStore } from "@/store/useNotificationStore";

export function useAutoBackupNotification() {
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    const checkNotification = async () => {
      try {
        const pending = await invoke<string | null>("get_setting_command", {
          key: "backup_notification_pending",
        });

        if (pending === "true") {
          addNotification({
            count: 1,
            message: "자동 백업이 성공적으로 완료되었습니다.",
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
  }, [addNotification]);
}
