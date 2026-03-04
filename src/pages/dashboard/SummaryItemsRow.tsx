import { DiffBadge } from "./components/DiffBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDashboardStore } from "@/stores/useDashboardStore";
import AnimatedAmount from "@/components/AnimatedAmount";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function SummaryItemRow() {
  const { t } = useTranslation();
  const { formatAmount } = useCurrencyFormatter();
  const { overview, comparisons } = useDashboardStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
      {[
        {
          label: t("common.income"),
          value: overview?.total_income ?? 0,
          metric: comparisons.Income,
        },
        {
          label: t("common.net_income"),
          value: overview?.net_income ?? 0,
          metric: comparisons.NetIncome,
        },
        {
          label: t("common.fixed"),
          value: overview?.fixed_expense ?? 0,
          metric: comparisons.Fixed,
          ratio: overview?.fixed_expense_ratio,
        },
      ].map((item, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md h-[52px]"
        >
          {/* 왼쪽 영역: 제목 + (금액 또는 데이터 없음) */}
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-sm font-bold text-slate-400 whitespace-nowrap min-w-[32px] md:min-w-[42px] uppercase">
              {item.label}
            </span>

            {/* 🔹 값이 0이 아닐 때만 데이터 렌더링, 0이면 '데이터 없음' 표시 */}
            {item.value !== 0 ? (
              <div className="flex items-center gap-1 font-bold">
                <div
                  className={cn(
                    "text-lg tracking-tight",
                    item.value < 0 ? "text-rose-500" : "text-slate-800"
                  )}
                >
                  <AnimatedAmount
                    value={item.value}
                    formatter={formatAmount}
                    duration={1.2}
                  />
                </div>

                {/* 고정비 비중 (데이터가 있을 때만 노출) */}
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
                      {t("dashboard.fixed_expense_ratio")}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            ) : (
              <div className="text-slate-400 text-sm font-medium italic">
                ---
              </div>
            )}
          </div>

          {/* 오른쪽 영역: 배지 (데이터가 있을 때만 렌더링) */}
          {item.value !== 0 && (
            <div className="flex-shrink-0 scale-90 origin-right">
              <DiffBadge metric={item.metric} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
