import { useAppStore } from "@/stores/useAppStore";
import { useSettingStore } from "@/stores/useSettingStore";
import { format, parseISO } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useCallback, useMemo } from "react";

const getEnglishOrdinal = (day: number) => {
  const pr = new Intl.PluralRules("en-US", { type: "ordinal" });
  const rule = pr.select(day);

  const suffixes: Record<string, string> = {
    one: "st",
    two: "nd",
    few: "rd",
    other: "th",
  };

  return `${day}${suffixes[rule]}`;
};

export const useDateFormatter = () => {
  const { language } = useAppStore();
  const { dateFormat } = useSettingStore();

  // 의존성 변수들을 memoize 하여 불필요한 재계산 방지
  const { dateLocale, intlLocale } = useMemo(
    () => ({
      dateLocale: language === "ko" ? ko : enUS,
      intlLocale: language === "ko" ? "ko-KR" : "en-US",
    }),
    [language]
  );

  const formatDate = useCallback(
    (dateString: string) => {
      if (!dateString) return "";
      try {
        const parsedDate = parseISO(dateString);
        if (isNaN(parsedDate.getTime())) return dateString;
        return format(parsedDate, dateFormat || "yyyy.MM.dd", {
          locale: dateLocale,
        });
      } catch (e) {
        return dateString.replace(/-/g, ".");
      }
    },
    [dateFormat, dateLocale]
  );

  const formatFullDate = useCallback(
    (dateString: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      if (language === "en") {
        const monthStr = new Intl.DateTimeFormat("en-US", {
          month: "short",
        }).format(date);
        const dayStr = getEnglishOrdinal(date.getDate());
        const year = date.getFullYear();
        return `${monthStr} ${dayStr}, ${year}`;
      }

      return new Intl.DateTimeFormat(intlLocale, {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      }).format(date);
    },
    [language, intlLocale]
  );

  const formatMonth = useCallback(
    (dateString: string, formatType: "short" | "long" = "short") => {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return new Intl.DateTimeFormat(intlLocale, { month: formatType }).format(
        date
      );
    },
    [intlLocale]
  );

  const formatDay = useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const day = date.getDate();
      return language === "en" ? getEnglishOrdinal(day) : `${day}일`;
    },
    [language]
  );

  // 🔹 새롭게 추가된 formatWeekday 훅
  const formatWeekday = useCallback(
    (dateString: string, formatType: "short" | "long" | "narrow" = "short") => {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return new Intl.DateTimeFormat(intlLocale, {
        weekday: formatType,
      }).format(date);
    },
    [intlLocale]
  );

  const formatYearMonth = useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      if (language === "ko") {
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
      }
      return new Intl.DateTimeFormat(intlLocale, {
        year: "numeric",
        month: "long",
      }).format(date);
    },
    [language, intlLocale]
  );

  const formatYear = useCallback(
    (dateOrYear: string | number) => {
      let year: number;
      if (typeof dateOrYear === "string") {
        const date = new Date(dateOrYear);
        year = date.getFullYear();
      } else {
        year = dateOrYear;
      }
      return language === "ko" ? `${year}년` : `${year}`;
    },
    [language]
  );

  const formatDayIndex = useCallback(
    (dayIndex: number, formatType: "short" | "long" | "narrow" = "short") => {
      const date = new Date(1970, 0, 4 + dayIndex);
      return new Intl.DateTimeFormat(intlLocale, {
        weekday: formatType,
      }).format(date);
    },
    [intlLocale]
  );

  const getDateParts = useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return { month: "", day: "", weekday: "" };
      const dayNumber = date.getDate();
      return {
        month: new Intl.DateTimeFormat(intlLocale, { month: "short" }).format(
          date
        ),
        day:
          language === "en" ? getEnglishOrdinal(dayNumber) : `${dayNumber}일`,
        weekday: new Intl.DateTimeFormat(intlLocale, {
          weekday: "short",
        }).format(date),
      };
    },
    [language, intlLocale]
  );

  // 모든 함수를 안정적인 객체 형태로 반환
  return useMemo(
    () => ({
      formatDate,
      formatFullDate,
      formatYearMonth,
      formatMonth,
      formatDay,
      formatWeekday, // 🔹 반환 객체에 추가
      formatYear,
      formatDayIndex,
      getDateParts,
    }),
    [
      formatDate,
      formatFullDate,
      formatYearMonth,
      formatMonth,
      formatDay,
      formatWeekday, // 🔹 의존성 배열에 추가
      formatYear,
      formatDayIndex,
      getDateParts,
    ]
  );
};
