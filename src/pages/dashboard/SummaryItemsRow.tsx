import { DiffBadge } from "./components/DiffBadge";
import { CurrencyIcon } from "@/components/ui/CurrencyIcon";
import CountUp from "@/components/CountUp";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useDashboardStore } from "@/stores/useDashboardStore";
import AnimatedAmount from "@/components/AnimatedAmount";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

import { useTranslation } from "react-i18next";

export function SummaryItemRow() {
  const { t } = useTranslation();
  const { formatAmount } = useCurrencyFormatter();
  const { overview, comparisons } = useDashboardStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
      {[
        {
          label: t("common.income"),
          value: overview.total_income,
          metric: comparisons.Income,
        },
        {
          label: t("common.net_income"),
          value: overview.net_income,
          metric: comparisons.NetIncome,
        },
        {
          label: t("common.fixed_expense"),
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
            <span className="text-sm font-bold text-slate-400 whitespace-nowrap min-w-[32px] md:min-w-[42px]">
              {item.label}
            </span>

            <div className="flex items-center gap-1 font-bold">
              <div className="text-lg tracking-tight text-slate-800">
                <AnimatedAmount
                  value={item.value}
                  formatter={formatAmount}
                  duration={1.2}
                />
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
                    {t("dashboard.fixed_expense_ratio")}
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
