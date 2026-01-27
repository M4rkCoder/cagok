import { DollarSign } from "lucide-react";

interface Props {
  lang: "ko" | "en";
  className?: string;
}

export function CurrencyIcon({ lang, className = "w-4 h-4" }: Props) {
  if (lang === "en") {
    return <DollarSign className={className} />;
  }

  // 원화 전용 아이콘 (Lucide 스타일과 맞춤)
  return (
    <span
      className={`font-bold inline-flex items-center justify-center select-none ${className}`}
      style={{ lineHeight: 1 }}
    >
      ₩
    </span>
  );
}
