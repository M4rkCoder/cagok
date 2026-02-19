import React from "react";

interface DashboardTitleProps {
  title: React.ReactNode;
}

export const DashboardTitle = ({ title }: DashboardTitleProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1 h-3 rounded-full bg-slate-400 shrink-0" />
      <div className="text-sm font-semibold text-slate-400 tracking-widest uppercase flex items-center gap-1">
        {title}
      </div>
    </div>
  );
};
