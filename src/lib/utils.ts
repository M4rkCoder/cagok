import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ColorType = "expense" | "income" | "total";

export const getThemeColor = (
  type: ColorType = "expense",
  index?: number,
  total?: number
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

export const getFixedColor = (index: number, total: number): string => {
  const hue = 215;
  const saturation = 15; // 회색 느낌을 위해 채도를 낮춤
  const minL = 40; // 진한 회색
  const maxL = 85; // 연한 회색
  const divisor = Math.max(total - 1, 1);
  const lightness = minL + index * ((maxL - minL) / divisor);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// 변동 지출: 옅은 오렌지 계열 (Hue: 35, 전체적으로 밝은 명도 설정)
export const getVariableColor = (index: number, total: number): string => {
  const hue = 35;
  const saturation = 90;
  const minL = 50; // 기본 오렌지
  const maxL = 90; // 아주 옅은 오렌지
  const divisor = Math.max(total - 1, 1);
  const lightness = minL + index * ((maxL - minL) / divisor);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
};

//날짜 변환기
export const smartParseDate = (input: string): string => {
  if (!input) return "";
  const today = new Date();
  const year = today.getFullYear();
  const clean = input.replace(/[^0-9]/g, "");
  let res: Date;
  if (clean.length === 8)
    res = new Date(
      parseInt(clean.slice(0, 4)),
      parseInt(clean.slice(4, 6)) - 1,
      parseInt(clean.slice(6, 8))
    );
  else if (clean.length === 4)
    res = new Date(
      year,
      parseInt(clean.slice(0, 2)) - 1,
      parseInt(clean.slice(2, 4))
    );
  else if (clean.length === 2 || clean.length === 1)
    res = new Date(year, today.getMonth(), parseInt(clean));
  else {
    const p = input.split(/[-./]/);
    if (p.length === 3)
      res = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
    else return input;
  }
  return isNaN(res.getTime()) ? input : format(res, "yyyy-MM-dd");
};

//사칙연산 셀
export const evaluateExpression = (input: string): string => {
  const cleanInput = input.replace(/[^0-9+\-*/.]/g, "");
  if (!cleanInput) return "";

  try {
    const result = new Function(`return ${cleanInput}`)();
    return isFinite(result) ? String(result) : "";
  } catch {
    return input; // 계산 실패 시 원본 반환
  }
};
