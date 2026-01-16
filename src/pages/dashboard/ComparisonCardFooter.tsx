import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ComparisonMetric } from "@/types/dashboard";
import { CardFooter } from "@/components/ui/card";

interface Props {
  metric: ComparisonMetric | null;
  isPositiveGood?: boolean; // 수입/순수입 = 증가가 좋음
  unit?: "currency" | "percent";
}

export function ComparisonCardFooter({
  metric,
  isPositiveGood = false,
  unit = "currency",
}: Props) {
  if (!metric) return null;

  const isIncrease = metric.diff > 0;
  const isSame = metric.diff === 0;

  const isGood =
    unit === "percent"
      ? !isIncrease // 고정비율은 감소가 좋음
      : isPositiveGood
      ? isIncrease
      : !isIncrease;

  const color = isSame
    ? "text-gray-400"
    : isGood
    ? "text-green-500"
    : "text-red-500";

  const Icon = isSame ? Minus : isIncrease ? TrendingUp : TrendingDown;

  const formatValue = () => {
    if (unit === "percent") {
      return `${metric.diff_rate.toFixed(1)}%`;
    }

    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(Math.abs(metric.diff));
  };

  return (
    <CardFooter className="pt-2 text-sm">
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="w-4 h-4" />
        <span>
          전월 대비{" "}
          {isSame
            ? "변동 없음"
            : `${formatValue()} (${metric.diff_rate.toFixed(1)}%)`}
        </span>
      </div>
    </CardFooter>
  );
}
