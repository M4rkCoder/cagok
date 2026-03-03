import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface EmptyStateProps {
  loading?: boolean;
  message?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ 
  loading, 
  message, 
  className,
  icon 
}: EmptyStateProps) {
  const { t } = useTranslation();
  
  const displayMessage = message || (loading 
    ? t("dashboard.cards.analyzing_data") 
    : t("dashboard.comparison.no_data"));

  return (
    <div className={cn(
      "flex h-full min-h-[200px] flex-col items-center justify-center text-slate-400 text-sm font-medium italic gap-2",
      className
    )}>
      {!loading && icon && <div className="opacity-20 mb-2">{icon}</div>}
      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
          <span>{displayMessage}</span>
        </div>
      ) : (
        <span>{displayMessage}</span>
      )}
    </div>
  );
}
