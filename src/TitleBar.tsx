import { useEffect, useState } from "react";
import { getCurrentWindow, Window } from "@tauri-apps/api/window";
import FinanceModeRounded from "@/components/FinanceModeRounded";
import { Minus, Minimize2, Square, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/store/useAppStore";
import { NotificationBell } from "./components/NotificationBell";
import { SyncNotifier } from "./components/SyncNotifier";

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [window, setWindow] = useState<Window | null>(null);
  const { i18n } = useTranslation();
  const { language } = useAppStore();

  useEffect(() => {
    const initWindow = async () => {
      const win = await getCurrentWindow();
      setWindow(win);

      // 현재 최대화 상태 가져오기
      const maximized = await win.isMaximized();
      setIsMaximized(maximized);

      // 이벤트 등록
      const unlistenMax = await win.listen("tauri://maximize", () =>
        setIsMaximized(true),
      );
      const unlistenUnmax = await win.listen("tauri://unmaximize", () =>
        setIsMaximized(false),
      );
      const unlistenResize = await win.listen("tauri://resize", async () => {
        const max = await win.isMaximized();
        setIsMaximized(max);
      });

      return () => {
        unlistenMax();
        unlistenUnmax();
        unlistenResize();
      };
    };

    initWindow();
  }, []);

  const toggleMax = async () => {
    if (!window) return;
    await window.toggleMaximize();
    const maximized = await window.isMaximized();
    setIsMaximized(maximized);
  };

  const minimizeWindow = async () => {
    if (!window) return;
    await window.minimize();
  };

  const closeWindow = async () => {
    if (!window) return;
    await window.close();
  };

  const lang = language === "ko" ? "ko-KR" : "en-EN";
  return (
    <div
      data-tauri-drag-region
      className="h-full flex items-center justify-between z-[999] px-4 select-none 
                 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 
                 border-b border-white/10 shadow-lg"
      onDoubleClick={toggleMax}
    >
      {/* 로고 + 제목 */}
      <div className="flex items-center gap-2 cursor-default pointer-events-none">
        <FinanceModeRounded className="w-8 h-8 text-white" />
        <span className="font-bold no-drag select-none tracking-tight text-white">
          C'AGOK
        </span>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 select-none pointer-events-none">
        <span className="text-[12px] tracking-[0.2em] font-semibold text-blue-100/80 uppercase">
          {new Date().toLocaleDateString(lang, {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "short",
          })}
        </span>
      </div>

      {/* 우측 버튼 세트 */}
      <div
        className="flex items-center gap-1"
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <SyncNotifier />
        <NotificationBell />

        <button
          className="no-drag w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-md transition-all active:scale-95"
          onClick={minimizeWindow}
        >
          <Minus size={16} className="text-blue-100" />
        </button>

        <button
          className="no-drag w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-md transition-all active:scale-95"
          onClick={toggleMax}
        >
          {isMaximized ? (
            <Minimize2 size={16} className="text-blue-100" />
          ) : (
            <Square size={14} className="text-blue-100" />
          )}
        </button>

        <button
          className="no-drag w-10 h-10 flex items-center justify-center hover:bg-red-500 rounded-md transition-all active:scale-95"
          onClick={closeWindow}
        >
          <X size={18} className="text-blue-100" />
        </button>
      </div>
    </div>
  );
}
