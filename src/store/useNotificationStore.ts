import { create } from "zustand";
import { persist } from "zustand/middleware";

// 1. 기본 데이터 구조 정의
export interface Notification {
  id: string;
  count: number;
  message: string;
  timestamp: string;
  isRead: boolean;
  type?: "recurring" | "backup" | "info";
  link?: string;
}

// 새로운 알림을 받을 때의 타입 (id와 isRead는 제외)
export type NewNotification = Omit<Notification, "id" | "isRead">;

interface NotificationState {
  notifications: Notification[];
  addNotification: (notif: NewNotification) => boolean; // 반환 타입 명시
  markAsRead: (id: string) => void;
  clearAll: () => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notif: NewNotification) => {
        const { notifications } = get();

        // 1. 중복 체크 (최근 3초 내 동일 메시지)
        const isDuplicate = notifications.some((n) => {
          const timeDiff =
            new Date().getTime() - new Date(n.timestamp).getTime();
          return n.message === notif.message && timeDiff < 3000;
        });

        if (isDuplicate) return false;

        // 2. 새 객체 생성 (notif를 명시적으로 복사)
        const newNotif: Notification = {
          id: crypto.randomUUID(),
          count: notif.count,
          message: notif.message,
          timestamp: notif.timestamp,
          isRead: false,
          type: notif.type || "info",
          link: notif.link,
        };

        // 3. 상태 업데이트
        set((state) => ({
          notifications: [newNotif, ...state.notifications].slice(0, 20),
        }));

        return true;
      },

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),

      clearAll: () => set({ notifications: [] }),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            isRead: true,
          })),
        })),
    }),
    {
      name: "notification", // localStorage 저장 키 이름
    }
  )
);
