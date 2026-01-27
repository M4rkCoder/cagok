import { DiffBadge } from "./DiffBadge";
import { CurrencyIcon } from "@/components/ui/CurrencyIcon";
import CountUp from "@/components/CoutUp";
import { ComparisonMetric, MonthlyOverview, ComparisonType } from "@/types";

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 수입 아이템 */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-400 mb-1">수입</span>
          <div className="flex items-baseline gap-1 font-bold text-slate-800">
            <CurrencyIcon lang={lang} className="w-4 h-4 text-slate-300" />
            <div className="text-xl">
              <CountUp end={overview.total_income} />
            </div>
          </div>
        </div>
        <DiffBadge metric={comparisons.Income} />
      </div>

      {/* 순수입 아이템 */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-400 mb-1">순수입</span>
          <div className="flex items-baseline gap-1 font-bold text-slate-800">
            <CurrencyIcon lang={lang} className="w-4 h-4 text-slate-300" />
            <div className="text-xl">
              <CountUp end={overview.net_income} />
            </div>
          </div>
        </div>
        <DiffBadge metric={comparisons.NetIncome} />
      </div>

      {/* 고정비 아이템 */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-bold text-slate-400">고정비</span>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
              비율
            </span>
          </div>
          <div className="flex items-baseline gap-1 font-bold text-slate-800">
            <CurrencyIcon lang={lang} className="w-4 h-4 text-slate-300" />
            <div className="text-xl flex items-baseline gap-1.5">
              <CountUp end={overview.fixed_expense} />
              <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                <CountUp
                  end={Number(overview.fixed_expense_ratio.toFixed(1))}
                />
                %
              </span>
            </div>
          </div>
        </div>
        <DiffBadge metric={comparisons.Fixed} />
      </div>
    </div>
  );
}
