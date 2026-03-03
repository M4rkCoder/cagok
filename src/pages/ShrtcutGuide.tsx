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
import { useTranslation } from "react-i18next";

interface ShortcutGuideProps {
  children?: ReactNode; // 🔹 외부에서 버튼을 주입받을 수 있도록 추가
}

export function ShortcutGuide({ children }: ShortcutGuideProps) {
  const { t } = useTranslation();
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
      title: t("shortcut.global_group"),
      shortcuts: [
        {
          keys: ["E", t("shortcut.or"), "Ctrl", "+", "E"],
          description: t("shortcut.new_transaction"),
        },
        {
          keys: ["Q", t("shortcut.or"), "Ctrl", "+", "Q"],
          description: t("shortcut.quick_bulk_entry"),
        },
        { keys: ["?"], description: t("shortcut.view_guide") },
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
            {t("shortcut.title")}
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
                        key === t("shortcut.or") || key === "+" ? (
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
                        ),
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
