import { Badge } from "@/components/ui/badge";
import { ComparisonMetric } from "@/types/dashboard";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  metric: ComparisonMetric | null;
}

export function DiffBadge({ metric }: Props) {
  // 금액 포맷터 (내부용)
  const formatDiffAmount = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  // 데이터가 없거나 전월 데이터가 없는 경우
  if (!metric || metric.previous === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground gap-1">
        <Minus className="w-3 h-3" />
        <span>-%</span>
      </Badge>
    );
  }

  const isIncrease = metric.diff > 0;
  const isSame = metric.diff === 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="font-medium gap-1 cursor-default transition-colors hover:bg-slate-50"
        >
          {isSame ? (
            <>
              <Minus className="w-3 h-3 text-muted-foreground" />
              <span>0.0%</span>
            </>
          ) : (
            <>
              {isIncrease ? (
                <TrendingUp className="w-3 h-3 text-red-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-blue-500" />
              )}
              <span>
                {isIncrease ? "+" : "-"}
                {Math.abs(metric.diff_rate).toFixed(1)}%
              </span>
            </>
          )}
        </Badge>
      </TooltipTrigger>

      {/* 🔹 배경 투명도(opacity), 블러(backdrop-blur), 여백(px/py) 조정 */}
      <TooltipContent
        side="top"
        className="bg-slate-900/80 backdrop-blur-sm text-white border-none px-2 py-1 text-[11px] animate-in fade-in-0 zoom-in-95"
      >
        <p>
          {isSame ? (
            "지난 달과 동일함"
          ) : (
            <>
              지난 달보다{" "}
              <span className="font-bold">{formatDiffAmount(metric.diff)}</span>{" "}
              {isIncrease ? "증가" : "감소"}
            </>
          )}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
