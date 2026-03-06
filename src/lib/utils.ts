import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";
import { RecurringTransaction } from "@/types";

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
  const maxL = type === "income" ? 60 : 80;
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

  const clean = input.replace(/[^0-9]/g, "");
  const today = new Date();
  const year = today.getFullYear();
  const currentYearPrefix = Math.floor(year / 100) * 100;

  let res: Date | null = null;

  if (clean.length === 8) {
    res = new Date(
      parseInt(clean.slice(0, 4)),
      parseInt(clean.slice(4, 6)) - 1,
      parseInt(clean.slice(6, 8))
    );
  } else if (clean.length === 6) {
    res = new Date(
      currentYearPrefix + parseInt(clean.slice(0, 2)),
      parseInt(clean.slice(2, 4)) - 1,
      parseInt(clean.slice(4, 6))
    );
  } else if (clean.length === 5 && parseInt(clean) > 30000) {
    const excelBase = new Date(1899, 11, 30);
    excelBase.setDate(excelBase.getDate() + parseInt(clean));
    return format(excelBase, "yyyy-MM-dd");
  } else if (clean.length === 4 || clean.length === 3) {
    // "0213" 또는 "213" 처리
    const padded = clean.padStart(4, "0");
    const m = parseInt(padded.slice(0, 2));
    const d = parseInt(padded.slice(2, 4));
    res = new Date(year, m - 1, d);
  }
  // 5. 구분자 포함 (2026.2.13, 2/13 등)
  else {
    const parts = input.split(/[-./]/).filter((p) => p !== "");
    if (parts.length === 3) {
      const yStr = parts[0].trim();
      const y =
        yStr.length === 2 ? currentYearPrefix + parseInt(yStr) : parseInt(yStr);
      res = new Date(y, parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else if (parts.length === 2) {
      // "2/13" 같은 형태 대응
      res = new Date(year, parseInt(parts[0]) - 1, parseInt(parts[1]));
    }
  }

  if (res && !isNaN(res.getTime())) {
    return format(res, "yyyy-MM-dd");
  }

  return input;
};

//사칙연산 셀
export const evaluateExpression = (input: string): string => {
  // 1. 숫자, 연산자, 소수점 외의 문자 제거 (콤마 등 제거)
  const cleanInput = input.replace(/[^0-9+\-*/.]/g, "").trim();

  // 입력값이 없거나 마지막이 연산자로 끝나는 경우 (예: "100+")
  // 계산을 시도하면 에러가 나거나 NaN이 될 수 있으므로 빈 문자열 혹은 원본 반환
  if (!cleanInput || /[+\-*/.]$/.test(cleanInput)) {
    return "";
  }

  try {
    // 2. 수식 계산
    const result = new Function(`return ${cleanInput}`)();

    // 3. 결과가 숫자이고, NaN이 아니며, 유한한 값인지 체크
    if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
      return String(result);
    }

    return "";
  } catch {
    // 계산 도중 문법 오류 발생 시 (예: "100++5") 빈 문자열 반환
    return "";
  }
};

export const getFrequencyText = (frequency: string, t?: any) => {
  if (t) {
    return t(`recurring.form.frequencies.${frequency}`);
  }
  return (
    ({ daily: "매일", weekly: "매주", monthly: "매월", yearly: "매년" } as any)[
      frequency
    ] || frequency
  );
};

export const getDayText = (recurring: RecurringTransaction, t?: any) => {
  if (recurring.frequency === "weekly" && recurring.day_of_week != null) {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    if (t) {
      // Use Intl.DateTimeFormat via a trick or just simple keys
      // Since we already have formatDayIndex in useDateFormatter,
      // but this is a util, we'll use a simple approach or let the caller handle it.
      // For now, let's just return the day name if t is provided we could use keys.
      return t(`common.days.${recurring.day_of_week}`, {
        defaultValue: days[recurring.day_of_week] + "요일",
      });
    }
    return days[recurring.day_of_week] + "요일";
  }
  if (recurring.frequency === "monthly" && recurring.day_of_month) {
    if (t)
      return t("common.count_day", {
        count: recurring.day_of_month,
        defaultValue: `${recurring.day_of_month}일`,
      });
    return recurring.day_of_month + "일";
  }
  return "";
};
