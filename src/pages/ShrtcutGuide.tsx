import React, { useState, useEffect, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Command } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";

interface ShortcutGuideProps {
  children?: ReactNode; // 🔹 외부에서 버튼을 주입받을 수 있도록 추가
}

export function ShortcutGuide({ children }: ShortcutGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement instanceof HTMLElement &&
          activeElement.isContentEditable);

      if (isTyping) return;

      if (e.key === "?") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const shortcutGroups = [
    {
      title: "전역 단축키 (어디서나)",
      shortcuts: [
        { keys: ["N", "또는", "Ctrl", "+", "N"], description: "새 거래 입력" },
        {
          keys: ["E", "또는", "Ctrl", "+", "E"],
          description: "빠른 / 대량 입력",
        },
        { keys: ["?"], description: "단축키 안내 보기" },
      ],
    },
    {
      title: "창 및 폼 제어",
      shortcuts: [
        { keys: ["Ctrl", "+", "Enter"], description: "내역 저장" },
        { keys: ["Esc"], description: "열린 창 닫기" },
      ],
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* 🔹 외부에서 전달된 버튼(children)이 있으면 그것을 트리거로 사용 */}
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white">
        <DialogHeader className="p-6 pb-4 bg-slate-50/50 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2.5 text-xl font-black text-slate-800">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-md">
              <Command className="w-5 h-5" />
            </div>
            키보드 단축키
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 flex flex-col gap-8">
          {shortcutGroups.map((group, idx) => (
            <div key={idx} className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                {group.title}
              </h3>
              <div className="flex flex-col gap-1">
                {group.shortcuts.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-semibold text-slate-700">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.keys.map((key, ki) =>
                        key === "또는" || key === "+" ? (
                          <span
                            key={ki}
                            className="text-[11px] font-bold text-slate-400 px-0.5"
                          >
                            {key}
                          </span>
                        ) : (
                          <Kbd
                            key={ki}
                            className="bg-white border-slate-200 text-slate-700 shadow-sm text-[11px] px-2 py-1"
                          >
                            {key}
                          </Kbd>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
