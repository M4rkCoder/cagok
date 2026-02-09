import { DailySummary } from "@/types";
import { ExpenseBadge, IncomeBadge, TrendBadge } from "./TransactionBadge";

interface Props {
  summary: DailySummary;
  isSelected: boolean;
  onClick: () => void;
}

export function DailySummaryCard({ summary, isSelected, onClick }: Props) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const formatted = new Intl.DateTimeFormat("ko-KR", {
      day: "numeric",
      weekday: "short",
    }).format(date);
    return formatted;
  };

  return (
    <div
      className="flex gap-4 group cursor-pointer items-start"
      onClick={onClick}
    >
      {/* 타임라인 도트 영역 */}
      <div className="flex flex-col items-center flex-shrink-0 w-10">
        <div
          className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-500 z-10 ${
            isSelected
              ? "bg-slate-900 border-slate-900 scale-125 shadow-[0_0_0_4px_rgba(15,23,42,0.1)]"
              : "bg-white border-slate-300 group-hover:border-slate-400"
          } mt-[22px]`}
        />
      </div>

      {/* 카드 본체 */}
      <div
        className={`flex-1 flex items-center justify-between py-3 px-5 rounded-xl border transition-all duration-300 ${
          isSelected
            ? "bg-white shadow-md border-slate-900 translate-x-1"
            : "bg-white/40 border-slate-200 hover:border-slate-300 hover:bg-white/80 shadow-sm"
        }`}
      >
        {/* 왼쪽: 날짜와 건수 */}
        <div className="flex items-center gap-4">
          <span
            className={`text-sm font-bold tabular-nums transition-colors ${
              isSelected ? "text-slate-900" : "text-slate-600"
            }`}
          >
            {formatDate(summary.date)}
          </span>

          <div className="h-3 w-[1px] bg-slate-200" />

          <span className="text-xs font-medium text-slate-500">
            <span className="text-slate-700">{summary.total_count}</span>건
          </span>
        </div>

        {/* 오른쪽: 요약 금액 (배지 + 금액 인라인 배치) */}
        <div className="flex items-center gap-5 shrink-0 ml-auto">
          {summary.income_total > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendBadge
                type="income"
                amount={summary.income_total}
                isSimple={true}
              />
            </div>
          )}

          {summary.expense_total > 0 && (
            <div className="flex items-center gap-1.5">
              <TrendBadge
                type="expense"
                amount={summary.expense_total}
                isSimple={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
