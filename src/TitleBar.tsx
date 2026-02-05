import { useEffect, useState } from "react";
import { getCurrentWindow, Window } from "@tauri-apps/api/window";
import FinanceModeRounded from "@/components/FinanceModeRounded";
import { Minus, Minimize2, Square, X } from "lucide-react";

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [window, setWindow] = useState<Window | null>(null);

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

  const handleLogoDoubleClick = async () => {
    toggleMax();
  };

  const minimizeWindow = async () => {
    if (!window) return;
    await window.minimize();
  };

  const closeWindow = async () => {
    if (!window) return;
    await window.close();
  };

  return (
    <div
      data-tauri-drag-region
      className="h-full flex items-center justify-between bg-blue-600 text-white px-4 select-none"
      onDoubleClick={toggleMax}
    >
      {/* 로고 + 제목 */}
      <div className="flex items-center gap-2 cursor-default pointer-events-none">
        <FinanceModeRounded className="w-8 h-8" />
        <span className="font-bold no-drag select-none">FINKRO</span>
      </div>

      {/* 최소화/최대화/닫기 버튼 */}
      <div className="flex gap-2" onDoubleClick={(e) => e.stopPropagation()}>
        <button
          className="no-drag w-9 h-9 flex items-center justify-center hover:bg-slate-700 transition-colors"
          data-tauri-drag-region="false"
          onClick={minimizeWindow}
        >
          <Minus size={16} />
        </button>

        <button
          className="no-drag w-9 h-9 flex items-center justify-center hover:bg-slate-700 transition-colors"
          data-tauri-drag-region="false"
          onClick={toggleMax}
        >
          {isMaximized ? <Minimize2 size={16} /> : <Square size={16} />}
        </button>

        <button
          className="no-drag w-9 h-9 flex items-center justify-center hover:bg-red-600 transition-colors"
          data-tauri-drag-region="false"
          onClick={closeWindow}
        >
          <X />
        </button>
      </div>
    </div>
  );
}
