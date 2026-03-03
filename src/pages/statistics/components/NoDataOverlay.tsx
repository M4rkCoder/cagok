import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { SearchIcon } from "lucide-react";

interface NoDataOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
  children?: React.ReactNode;
}

export const NoDataOverlay: React.FC<NoDataOverlayProps> = ({
  isVisible,
  message,
  className,
  children,
}) => {
  const { t } = useTranslation();

  return (
    <div className={cn("relative", className)}>
      {children}
      {isVisible && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-xl animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-2 p-6 bg-white/80 shadow-sm border border-slate-100 rounded-2xl">
            <SearchIcon className="h-8 w-8 text-slate-300 opacity-50" />
            <p className="text-sm font-bold text-slate-500 italic">
              {message || t("dashboard.comparison.no_data")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
