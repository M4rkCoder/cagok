import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { DiffBadge } from "./components/DiffBadge";
import { ComparisonCardFooter } from "./components/ComparisonCardFooter";
import { cn } from "@/lib/utils";
import TransactionSheet from "../transactions/TrasactionSheet";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { Badge } from "@/components/ui/badge";
import { Plus, ListPlus } from "lucide-react";
import { DashboardTitle } from "./components/DashboardTitle";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import AnimatedAmount from "@/components/AnimatedAmount";
import { useDateFormatter } from "@/hooks/useDateFormatter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useNavigate } from "react-router-dom"; // 🔹 라우팅을 위해 추가
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // 🔹 툴팁 추가

export function MainExpenseCard() {
  const { t } = useTranslation();
  const navigate = useNavigate(); // 🔹 네비게이트 훅
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
        {/* 1. 지출 요약부 (좌측) 생략 - 기존과 동일 */}
        <div className="lg:col-span-4 p-4 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between pb-8">
              <div className="flex items-center gap-2">
                <DashboardTitle title={t("dashboard.monthly_expense")} />
              </div>
              {overview && overview.total_expense !== 0 && (
                <DiffBadge metric={comparison} />
              )}
            </div>

            {/* 🔹 조건문을 text-5xl 태그 밖으로 분리하여 스타일 간섭(찌그러짐) 방지 */}
            {overview && overview.total_expense !== 0 ? (
              <div className="text-4xl font-extrabold tracking-tighter text-slate-900">
                <AnimatedAmount
                  value={overview.total_expense}
                  formatter={formatAmount}
                  duration={1.2}
                />
              </div>
            ) : (
              <div className="text-slate-400 text-sm font-medium italic tracking-normal p-7 ">
                {t("dashboard.comparison.no_data")}
              </div>
            )}
          </div>

          {/* 🔹 중복된 div 태그 정리 */}
          <div className="mt-3 pb-5">
            {overview && overview.total_expense > 0 && (
              <ComparisonCardFooter
                metric={comparison}
                expenseRate={expenseRate}
                dailyAverage={overview?.daily_average}
              />
            )}
          </div>
        </div>

        {/* 2. 상세 정보부 (우측) */}
        <div className="lg:col-span-8 p-4 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            {/* 2-1. 최근 지출 내역 리스트 생략 - 기존과 동일 */}
            <div className="flex flex-col h-full">
              <DashboardTitle title={t("dashboard.recent_expense")} />
              <div className="flex-1 min-h-0 mt-2">
                <div className="divide-y divide-slate-100/50 overflow-y-auto max-h-[140px] custom-scrollbar pr-3">
                  {recentTransactions && recentTransactions.length > 0 ? (
                    recentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className={cn(
                          "flex items-center justify-between py-0.5 px-2 transition-all duration-200 ease-out",
                          "hover:bg-white hover:scale-[1.01] hover:shadow-sm hover:z-10 hover:rounded-md",
                          "group cursor-default",
                        )}
                      >
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
                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                          <span className="text-[13px] font-black text-slate-900 tabular-nums tracking-tighter">
                            {formatAmount(tx.amount)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-32 items-center justify-center text-slate-400 text-sm font-medium italic">
                      {t("dashboard.comparison.no_data")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2-2. 퀵 엔트리 (수정된 레이아웃) */}
            <div className="flex flex-col h-full">
              <DashboardTitle title={t("dashboard.quick_entry")} />
              <div className="flex-1 flex flex-col justify-center gap-5 mt-2 px-2">
                <TooltipProvider delayDuration={300}>
                  {/* 🔹 메인 액션 버튼 그룹 (가로 2열 배치) */}
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {/* 단건 입력 버튼 */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          {" "}
                          {/* Button을 감싸는 div를 두어 Trigger 역할을 명확히 함 */}
                          <TransactionSheet>
                            <Button
                              variant="default"
                              className="w-full flex items-center justify-center gap-2 shadow-sm bg-slate-600 hover:bg-slate-700 h-10 px-2 cursor-pointer"
                            >
                              <Plus className="h-4 w-4 shrink-0" />
                              <span className="font-semibold truncate">
                                {t("transaction.new")}
                              </span>
                            </Button>
                          </TransactionSheet>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="flex items-center gap-2 text-xs bg-slate-800 text-white border-none z-[100]">
                        {t("dashboard.quick_entry_tooltips.single")}{" "}
                        <KbdGroup>
                          <Kbd className="bg-slate-700 text-white border-slate-600">
                            E
                          </Kbd>{" "}
                          /
                          <Kbd className="bg-slate-700 text-white border-slate-600">
                            Ctrl E
                          </Kbd>
                        </KbdGroup>
                      </TooltipContent>
                    </Tooltip>

                    {/* 빠른 입력 모드 버튼 */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="cursor-pointer w-full flex items-center justify-center gap-2 shadow-sm border-slate-200 h-10 px-2 bg-white hover:bg-slate-50 text-slate-700"
                          onClick={() => navigate("/transactions/quickentry")}
                        >
                          <ListPlus className="h-4 w-4 text-slate-500 shrink-0" />
                          <span className="font-semibold truncate">
                            {t("quick_entry.title")}
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="flex items-center gap-2 text-xs bg-slate-800 text-white border-none">
                        {t("dashboard.quick_entry_tooltips.bulk")}{" "}
                        <Kbd className="bg-slate-700 text-white border-slate-600">
                          Q
                        </Kbd>{" "}
                        /
                        <Kbd className="bg-slate-700 text-white border-slate-600">
                          Ctrl Q
                        </Kbd>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>

                {/* 🔹 퀵 카테고리 칩 섹션 */}
                <div className="w-full mt-1">
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {/* 🔹 간격 축소 gap-2 -> gap-1.5 */}
                    {quickCategories.length > 0 &&
                      quickCategories.map((cat) => (
                        <TransactionSheet
                          key={cat.id}
                          defaultCategoryId={cat.id}
                        >
                          <Badge
                            variant="secondary"
                            // 🔹 px를 줄여 한 줄에 3개가 여유있게 들어가도록 조정
                            className="flex items-center text-[10px] sm:text-[11px] gap-1 cursor-pointer hover:bg-slate-800 hover:text-white transition-colors px-2 py-1.5"
                          >
                            <span className="native-emoji text-[12px] leading-none shrink-0">
                              {cat.icon}
                            </span>
                            <span className="font-medium leading-none mt-px truncate max-w-[40px] sm:max-w-[60px]">
                              {cat.name}
                            </span>
                            <Plus size={10} className="opacity-70 shrink-0" />
                          </Badge>
                        </TransactionSheet>
                      ))}
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
