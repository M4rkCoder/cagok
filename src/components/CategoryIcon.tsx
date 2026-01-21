import { cn } from "@/lib/utils";

interface CategoryIconProps {
  icon: string;
  type: "0" | "1";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const CategoryIcon = ({
  icon,
  type,
  size = "md",
  className,
}: CategoryIconProps) => {
  const colors = {
    "0": { bg: "#ECFDF5", text: "#10B981" },
    "1": { bg: "#FFF1F2", text: "#F43F5E" },
  };

  const selected = colors[type];

  const sizeClasses = {
    sm: "w-9 h-9 text-xl",
    md: "w-11 h-11 text-2xl",
    lg: "w-24 h-24 text-5xl", // 96px 박스에 48px 이모지
  };

  return (
    <div
      className={cn(
        "rounded-[32px] flex items-center justify-center shrink-0 transition-all duration-300",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: selected.bg }}
    >
      {/* 이모지 정렬을 위한 내부 스팬 */}
      <span
        className={cn(
          "native-emoji leading-[1] flex items-center justify-center",
          "-translate-y-[3px]"
        )}
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          // 일부 브라우저에서 이모지가 위로 쏠리는 현상 방지
          paddingTop: "0.1em",
        }}
      >
        {icon}
      </span>
    </div>
  );
};
