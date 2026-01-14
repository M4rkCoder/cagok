import { getCurrentWindow } from "@tauri-apps/api/window";
import FinanceModeRounded from "@/components/FinanceModeRounded";

export default function TitleBar() {
  const window = getCurrentWindow();
  return (
    <div
      data-tauri-drag-region
      className="h-12 flex items-center justify-between bg-blue-600 text-white px-4"
    >
      <FinanceModeRounded className="w-10 h-10" />{" "}
      <span className="font-bold">FINKRO</span>
      <div className="flex gap-2">
        <button
          data-tauri-drag-region="false"
          onClick={() => window.minimize()}
        >
          ─
        </button>
        <button
          data-tauri-drag-region="false"
          onClick={() => window.toggleMaximize()}
        >
          ▢
        </button>
        <button data-tauri-drag-region="false" onClick={() => window.close()}>
          ✕
        </button>
      </div>
    </div>
  );
}
