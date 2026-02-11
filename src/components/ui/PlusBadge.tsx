import { Zap } from "lucide-react";

export const PlusBadge = () => {
  return (
    <div
      className="inline-flex items-center justify-center px-1 
                    bg-black border border-yellow-600/50 rounded-md shadow-[0_0_8px_rgba(217,119,6,0.2)]"
    >
      <span
        className="text-[10px] font-extrabold tracking-tighter text-transparent bg-clip-text 
                       bg-gradient-to-tr from-yellow-400 to-yellow-600"
      >
        PLUS
      </span>
    </div>
  );
};

export const ProIcon = () => {
  return (
    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 group-hover:border-amber-500/50 transition-colors">
      <Zap size={10} className="text-amber-500 fill-amber-500" />
    </div>
  );
};
