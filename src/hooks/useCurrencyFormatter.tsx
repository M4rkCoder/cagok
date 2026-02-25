import { useAppStore } from "@/stores/useAppStore";

export const useCurrencyFormatter = () => {
  // app_settings에서 언어와 통화 설정을 가져옵니다.
  const { language, currency } = useAppStore();

  const formatAmount = (amount: number) => {
    if (language === "ko") {
      const formattedNumber = new Intl.NumberFormat("ko-KR").format(amount);
      return `${formattedNumber}원`;
    } else {
      return new Intl.NumberFormat(language === "en" ? "en-US" : language, {
        style: "currency",
        currency: currency || "USD", // 설정된 통화가 없으면 기본값 USD
        minimumFractionDigits: 0,
      }).format(amount);
    }
  };

  return { formatAmount };
};
