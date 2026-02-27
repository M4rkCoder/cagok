import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { DiffBadge } from "./components/DiffBadge";
import { CurrencyIcon } from "@/components/ui/CurrencyIcon";
import CountUp from "@/components/CountUp";
import { ComparisonCardFooter } from "./components/ComparisonCardFooter";
import { cn } from "@/lib/utils";
import TransactionSheet from "../transactions/TrasactionSheet";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { DashboardTitle } from "./components/DashboardTitle";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import AnimatedAmount from "@/components/AnimatedAmount";
import { useDateFormatter } from "@/hooks/useDateFormatter";

interface MainExpenseCardProps {
  lang: "ko" | "en";
}

export function MainExpenseCard({ lang }: MainExpenseCardProps) {
  const { formatAmount } = useCurrencyFormatter();
  const { formatDay } = useDateFormatter();
  const { overview, comparisons, recentTransactions } = useDashboardStore();
  const comparison = comparisons.Expense;
  const quickCategories = useMemo(() => {
    if (!recentTransactions || recentTransactions.length === 0) return [];

    const counts: Record<
      string,
      { id: number; name: string; icon: string; count: number }
    > = {};

    recentTransactions.forEach((tx) => {
      if (!counts[tx.category_id]) {
        counts[tx.category_id] = {
          id: tx.category_id,
          name: tx.category_name,
          icon: tx.category_icon,
          count: 0,
        };
      }
      counts[tx.category_id].count += 1;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [recentTransactions]);

  const expenseRate = useMemo(() => {
    if (!overview) return 0;
    const rate =
      overview.total_income > 0
        ? Math.round((overview.total_expense / overview.total_income) * 100)
        : null;
    return rate;
  }, [overview]);

  return (
    <Card className="overflow-hidden border-none shadow-md bg-white mb-2">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* 1. 지출 요약부 (좌측) */}
        <div className="lg:col-span-4 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-8">
              <div className="flex items-center gap-2">
                <DashboardTitle
                  title={lang === "ko" ? "이달의 지출" : "Monthly Expense"}
                />
              </div>
              <DiffBadge metric={comparison} />
            </div>
            <div className="text-5xl font-extrabold tracking-tighter text-slate-900">
              <AnimatedAmount
                value={overview.total_expense}
                formatter={formatAmount}
                duration={1.2}
              />
            </div>
          </div>
          <div className="mt-3 pb-5">
            <ComparisonCardFooter
              metric={comparison}
              expenseRate={expenseRate}
              dailyAverage={overview.daily_average}
            />
          </div>
        </div>
        {/* 2. 상세 정보부 (우측) */}
        <div className="lg:col-span-8 p-4 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 2-1. 최근 지출 내역 리스트 (초슬림 & 컴팩트 버전) */}
            <div className="flex flex-col">
              <DashboardTitle title={"최근 지출"} />

              <div className="flex-1 min-h-0 mt-2">
                {/* max-h를 조절하고 내부 여백을 줄였습니다 */}
                <div className="divide-y divide-slate-100/50 overflow-y-auto max-h-[160px] custom-scrollbar pr-3">
                  {recentTransactions && recentTransactions.length > 0 ? (
                    recentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className={cn(
                          "flex items-center justify-between py-1 px-2 transition-all duration-200 ease-out",
                          "hover:bg-white hover:scale-[1.03] hover:shadow-sm hover:z-10 hover:rounded-md",
                          "group cursor-default"
                        )}
                      >
                        {/* 왼쪽: 날짜 + 이모지 + 설명 (gap을 2로 축소) */}
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[11px] font-bold text-slate-600 tabular-nums shrink-0 uppercase group-hover:text-black">
                            {formatDay(tx.date)}
                          </span>
                          <span className="text-[14px] leading-none shrink-0 native-emoji">
                            {tx.category_icon}
                          </span>
                          <span className="text-[13px] font-semibold text-slate-700 truncate max-w-[80px] sm:max-w-[120px]">
                            {tx.description || tx.category_name}
                          </span>
                        </div>

                        {/* 오른쪽: CurrencyIcon + 금액 (간격 최소화) */}
                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                          <span className="text-[13px] font-black text-slate-900 tabular-nums tracking-tighter">
                            {formatAmount(tx.amount)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-300 text-[10px] font-medium italic">
                      내역 없음
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* 2-2. 바로 입력 부분 */}
            <div className="space-y-4 flex flex-col">
              <DashboardTitle title={"바로 입력"} />
              <div className="flex-1 min-h-[150px] w-full flex flex-col items-center justify-center gap-6">
                {/* 상단: 메인 입력 버튼 */}
                <TransactionSheet />

                {/* 하단: 퀵 카테고리 칩 섹션 */}
                <div className="w-full flex flex-col items-center gap-1">
                  <div className="flex flex-wrap justify-center gap-2">
                    {quickCategories.length > 0 ? (
                      quickCategories.map((cat) => (
                        <TransactionSheet
                          key={cat.id}
                          defaultCategoryId={cat.id}
                        >
                          <div className="flex items-center">
                            <Badge
                              key={cat.id}
                              variant="secondary"
                              className="text-[11px] gap-1 cursor-pointer hover:bg-slate-600 hover:text-white"
                            >
                              <span className="native-emoji">{cat.icon}</span>
                              {cat.name}
                              <Plus className="h-3 w-3" />
                            </Badge>
                          </div>
                        </TransactionSheet>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        {lang === "ko"
                          ? "최근 내역이 없습니다"
                          : "No recent data"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
