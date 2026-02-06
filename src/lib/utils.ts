import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ColorType = "expense" | "income" | "total";

export const getThemeColor = (
  type: ColorType = "expense",
  index?: number,
  total?: number,
): string => {
  const hues: Record<ColorType, number> = {
    expense: 221, // 파란색
    income: 142, // 초록색
    total: 221, // 전체
  };

  // 타입별 대표 명도(Lightness) 설정
  const baseLightness: Record<ColorType, number> = {
    expense: 45,
    income: 30, // 초록색은 더 진하게(낮을수록 진함)
    total: 45,
  };

  const hue = hues[type];
  const saturation = 83;

  // 1. 인덱스나 전체 개수가 없으면 설정된 '대표 명도' 반환
  if (index === undefined || total === undefined) {
    return `hsl(${hue}, ${saturation}%, ${baseLightness[type]}%)`;
  }

  // 2. 인덱스가 있으면 명도(Lightness) 계산 (30% ~ 80%)
  // 너무 밝아지는 것을 방지하기 위해 maxL을 80으로 살짝 낮추는 것을 추천합니다.
  const minL = 30;
  const maxL = 80;
  const divisor = Math.max(total - 1, 1);
  const lightness = minL + index * ((maxL - minL) / divisor);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
