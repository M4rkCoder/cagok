import { DiffBadge } from "./DiffBadge";
import { CurrencyIcon } from "@/components/ui/CurrencyIcon";
import CountUp from "@/components/CoutUp";
import { ComparisonMetric, MonthlyOverview, ComparisonType } from "@/types";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";

interface SummaryItemRowProps {
  overview: MonthlyOverview;
  comparisons: Record<ComparisonType, ComparisonMetric | null>;
  lang: "ko" | "en";
}

export function SummaryItemRow({
  overview,
  comparisons,
  lang,
}: SummaryItemRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {[
        {
          label: "수입",
          value: overview.total_income,
          metric: comparisons.Income,
        },
        {
          label: "순수입",
          value: overview.net_income,
          metric: comparisons.NetIncome,
        },
        {
          label: "고정비",
          value: overview.fixed_expense,
          metric: comparisons.Fixed,
          ratio: overview.fixed_expense_ratio,
        },
      ].map((item, idx) => (
        <div
          key={idx}
          // justify-between으로 왼쪽 컨텐츠와 오른쪽 배지를 양 끝으로 밀어냅니다.
          className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md h-[52px]"
        >
          {/* 왼쪽 영역: 제목 + 금액 */}
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-sm font-bold text-slate-400 whitespace-nowrap min-w-[42px]">
              {item.label}
            </span>

            <div className="flex items-center gap-1 font-bold">
              <CurrencyIcon
                lang={lang}
                className="w-3.5 h-3.5 text-slate-300"
              />
              <div className="text-lg tracking-tight text-slate-800">
                <CountUp end={item.value} />
              </div>

              {/* 고정비 비중 (Badge와 겹치지 않게 작게 배치) */}
              {item.ratio !== undefined && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-0.5 text-[10px] font-medium text-slate-400 bg-slate-50 px-1 py-0.5 rounded border border-slate-100 cursor-help">
                      {item.ratio.toFixed(0)}%
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="text-[10px] bg-slate-800"
                  >
                    지출액 대비 고정 지출 비중
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* 오른쪽 영역: 배지 (같은 줄 끝 배치) */}
          <div className="flex-shrink-0 scale-90 origin-right">
            <DiffBadge metric={item.metric} />
          </div>
        </div>
      ))}
    </div>
  );
}
