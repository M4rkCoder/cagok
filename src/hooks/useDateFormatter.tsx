// src/hooks/useDateFormatter.ts
import { useAppStore } from "@/stores/useAppStore"; // language 설정이 포함된 스토어

export const useDateFormatter = () => {
  const { language } = useAppStore();

  /**
   * @param dateString "YYYY-MM-DD" 형식의 날짜 문자열
   */
  const formatDate = (dateString: string) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    // 날짜 객체 생성 실패 시 원본 반환
    if (isNaN(date.getTime())) return dateString;

    if (language === "ko") {
      // 한국어 설정: yyyy.mm.dd
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}.${month}.${day}`;
    } else {
      // 그 외(en 등): 로케일에 따른 국제 표준 형식 (예: en-US는 MM/DD/YYYY)
      return new Intl.DateTimeFormat(language === "en" ? "en-US" : language, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    }
  };

  /**
   * 요일을 포함한 긴 날짜 형식 (예: 2026.02.25 (수))
   */
  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat(language === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    }).format(date);
  };

  return { formatDate, formatFullDate };
};
