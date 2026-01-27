import { cn } from "@/lib/utils";

interface CategoryIconProps {
  icon: string;
  type: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export const CategoryIcon = ({
  icon,
  type,
  size = "md",
  className,
}: CategoryIconProps) => {
  const colors: Record<number, { bg: string; text: string }> = {
    // 0: 에메랄드 (초록 계열) - 배경은 약간 더 진하게, 글자는 진한 녹색으로
    0: { bg: "#ECFDF5", text: "#10B981" },

    // 1: 연한 인디고 (Indigo 100 & 800) - 0번과 구분되는 약간 보라빛 블루
    1: { bg: "#E0E7FF", text: "#3730A3" },
  };

  const selected = colors[type] || colors[1];

  // 각 사이즈별 박스 크기와 이모지 폰트 크기 비율 최적화
  const sizeClasses = {
    xs: "w-5 h-5 text-[11px]",
    sm: "w-9 h-9 text-[1.25rem]", // 20px 정도의 이모지
    md: "w-11 h-11 text-[1.5rem]", // 24px 정도의 이모지
    lg: "w-24 h-24 text-[3.5rem]", // 56px 정도의 이모지
  };

  return (
    <div
      className={cn(
        // rounded-full로 완전한 원형 구현
        "rounded-full flex items-center justify-center shrink-0 transition-all duration-300 overflow-hidden",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: selected.bg }}
    >
      <span
        className="inline-flex items-center justify-center leading-none native-emoji"
        style={{
          // 이모지의 텍스트 박스 자체를 정사각으로 강제하여 치우침 방지
          width: "1em",
          height: "1em",
          // 브라우저별 Baseline 차이를 보정하기 위한 최후의 수단 (선택 사항)
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </span>
    </div>
  );
};
