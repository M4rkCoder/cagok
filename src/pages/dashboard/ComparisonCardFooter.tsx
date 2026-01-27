import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ComparisonMetric } from "@/types/dashboard";
import { CardFooter } from "@/components/ui/card";

interface Props {
  metric: ComparisonMetric | null;
  isPositiveGood?: boolean; // 수입/순수입 = 증가가 좋음
  unit?: "currency" | "percent";
}

export function ComparisonCardFooter({ metric, unit = "currency" }: Props) {
  const isEmpty = !metric || metric.previous === 0;

  const formatValue = () => {
    if (!metric) return "";
    if (unit === "percent") {
      return `${Math.abs(metric.diff).toFixed(1)}%p`;
    }
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(Math.abs(metric.diff));
  };

  const isIncrease = (metric?.diff ?? 0) > 0;
  const isSame = metric?.diff === 0;

  return (
    // min-h-[40px]로 자리 유지, text-muted-foreground로 튀지 않는 색상 설정
    <CardFooter className="pt-2 text-sm min-h-[40px] text-muted-foreground">
      <div
        className={`flex items-center gap-1 ${isEmpty ? "invisible" : "visible"}`}
      >
        {!isEmpty && (
          <span>
            {isSame ? (
              "지난 달과 동일함"
            ) : (
              <>
                지난 달보다 {formatValue()} {isIncrease ? "증가" : "감소"}{" "}
                <span className="text-xs opacity-70"></span>
              </>
            )}
          </span>
        )}
      </div>
    </CardFooter>
  );
}
