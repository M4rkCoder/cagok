import React from "react";

interface TitleProps {
  title: React.ReactNode;
}

export const TitleText = ({ title }: TitleProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1 h-4 rounded-full bg-slate-400 shrink-0" />
      <div className="text-lg font-semibold text-slate-400 tracking-widest uppercase flex items-center gap-1">
        {title}
      </div>
    </div>
  );
};
