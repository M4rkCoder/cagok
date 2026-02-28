import { useEffect, useRef } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useTranslation } from "react-i18next";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";

export const useRecurringListener = () => {
  const { t } = useTranslation();
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    let unlistenFn: UnlistenFn | undefined;

    const init = async () => {
      try {
        // 1. 리스너 등록
        unlistenFn = await listen<{ count: number }>(
          "recurring-summary",
          (event) => {
            const { count } = event.payload;
            const message = t("notification.recurring_created", { count });

            const notifData = {
              count,
              message,
              timestamp: new Date().toISOString(),
              type: "recurring" as const,
              link: "/transactions/recurring",
            };

            // 2. 스토어 추가 시도 후 결과에 따라 토스트 실행
            const wasAdded = addNotification(notifData);
            if (wasAdded) {
              toast.success(message);
            }
          }
        ); // 👈 괄호 누락 수정

        // 3. 백엔드 요청
        await invoke("check_recurring");
      } catch (error) {
        console.error("❌ Notification Init Error:", error);
        isInitialized.current = false;
      }
    };

    init();

    return () => {
      if (unlistenFn) unlistenFn();
      isInitialized.current = false;
    };
  }, [t, addNotification]);
};
