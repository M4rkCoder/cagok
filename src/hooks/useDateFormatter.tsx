import { useAppStore } from "@/stores/useAppStore";

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
  const locale = language === "ko" ? "ko-KR" : "en-US";

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    if (language === "ko") {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}.${month}.${day}`;
    } else {
      return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    }
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    if (language === "en") {
      // 영어일 경우: Feb 25th, 2026 형식으로 조합
      const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
        date
      );
      const day = getEnglishOrdinal(date.getDate());
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    }

    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    }).format(date);
  };

  const formatMonth = (
    dateString: string,
    format: "short" | "long" = "short"
  ) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(locale, { month: format }).format(date);
  };

  /**
   * '일' 포매팅 (ko: "25일", en: "25th")
   */
  const formatDay = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const day = date.getDate();

    if (language === "en") {
      return getEnglishOrdinal(day); // 1st, 2nd, 3rd...
    }

    return new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date);
  };

  const formatWeekday = (
    dateString: string,
    format: "short" | "long" | "narrow" = "short"
  ) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(locale, { weekday: format }).format(date);
  };

  /**
   * 월, 일, 요일을 한 번에 객체로 반환
   */
  const getDateParts = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { month: "", day: "", weekday: "" };

    const dayNumber = date.getDate();

    return {
      month: new Intl.DateTimeFormat(locale, { month: "short" }).format(date),
      day:
        language === "en"
          ? getEnglishOrdinal(dayNumber)
          : new Intl.DateTimeFormat(locale, { day: "numeric" }).format(date),
      weekday: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
        date
      ),
    };
  };

  /**
   * 백엔드에서 오는 요일 인덱스(0: 일요일 ~ 6: 토요일)를 다국어 요일 문자열로 변환
   */
  const formatDayIndex = (
    dayIndex: number,
    format: "short" | "long" | "narrow" = "short"
  ) => {
    // 1970년 1월 4일은 '일요일'입니다. 여기에 dayIndex를 더해 요일을 맞춥니다.
    const date = new Date(1970, 0, 4 + dayIndex);
    return new Intl.DateTimeFormat(locale, { weekday: format }).format(date);
  };

  return {
    formatDate,
    formatFullDate,
    formatMonth,
    formatDay,
    formatWeekday,
    getDateParts,
    formatDayIndex,
  };
};
