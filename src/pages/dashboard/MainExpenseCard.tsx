import { Card } from "@/components/ui/card";
import { DiffBadge } from "./DiffBadge";
import { CurrencyIcon } from "@/components/ui/CurrencyIcon";
import CountUp from "@/components/CoutUp";
import { ComparisonCardFooter } from "./ComparisonCardFooter";
import {
  ComparisonMetric,
  MonthlyOverview,
  DailyExpense,
  TransactionWithCategory,
} from "@/types";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { CategoryIcon } from "@/components/CategoryIcon";
import { cn } from "@/lib/utils";

interface MainExpenseCardProps {
  overview: MonthlyOverview;
  comparison: ComparisonMetric | null;
  dailyExpenses: DailyExpense[];
  recentTransactions: TransactionWithCategory[];
  lang: "ko" | "en";
}

const chartConfig = {
  total_amount: {
    label: "지출액",
    color: "#2563eb", // 단일 브랜드 컬러로 통일 (UX 최적화)
  },
} satisfies ChartConfig;

export function MainExpenseCard({
  overview,
  comparison,
  dailyExpenses,
  recentTransactions,
  lang,
}: MainExpenseCardProps) {
  // 날짜에 요일을 추가하는 헬퍼 함수
  const formatDateWithDay = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const dayNames =
      lang === "ko"
        ? ["일", "월", "화", "수", "목", "금", "토"]
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `${date.getMonth() + 1}.${date.getDate()}(${dayNames[date.getDay()]})`;
  };

  const chartData = (dailyExpenses || []).map((item) => ({
    ...item,
    // X축 및 툴팁용 포맷팅 데이터
    displayDate: formatDateWithDay(item.date),
  }));

  return (
    <Card className="overflow-hidden border-none shadow-md bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* 1. 지출 요약부 (좌측) */}
        <div className="lg:col-span-4 p-8 flex flex-col justify-between border-r border-slate-50">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-400 tracking-widest uppercase">
                {lang === "ko" ? "이번 달 지출" : "Monthly Expense"}
              </span>
              <DiffBadge metric={comparison} />
            </div>
            <div className="flex items-baseline gap-1">
              <CurrencyIcon
                lang={lang}
                className="w-7 h-7 text-slate-300 self-center mb-1"
              />
              <div className="text-5xl font-extrabold tracking-tighter text-slate-900">
                <CountUp end={overview.total_expense} />
              </div>
            </div>
          </div>
          <div className="mt-5">
            <ComparisonCardFooter metric={comparison} isPositiveGood={false} />
          </div>
        </div>

        {/* 2. 상세 정보부 (우측) */}
        <div className="lg:col-span-8 p-6 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            {/* 2-1. 7일 지출 추이 차트 */}
            <div className="space-y-4 flex flex-col">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                7일 지출 추이
              </h4>
              <div className="flex-1 min-h-[180px] w-full flex items-end">
                {chartData.length > 0 ? (
                  <ChartContainer
                    config={chartConfig}
                    className="h-full w-full"
                  >
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="displayDate"
                        tickLine={false}
                        axisLine={false}
                        fontSize={10}
                        tick={{ fill: "#94a3b8", fontWeight: 500 }}
                      />
                      <ChartTooltip
                        cursor={{ fill: "#f1f5f9", opacity: 0.4 }}
                        content={<ChartTooltipContent hideIndicator />}
                      />
                      <Bar
                        dataKey="total_amount"
                        radius={[4, 4, 0, 0]}
                        barSize={25}
                        fill="#2563eb"
                        fillOpacity={0.6}
                        className="transition-all duration-300 cursor-pointer hover:fill-opacity-100"
                        activeBar={{
                          fillOpacity: 1,
                          stroke: "#2563eb",
                          strokeWidth: 1,
                        }}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-medium">
                    데이터 로딩 중...
                  </div>
                )}
              </div>
            </div>
            {/* 2-2. 최근 지출 내역 리스트 (초슬림 & 컴팩트 버전) */}
            <div className="flex flex-col h-full">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                최근 지출
              </h4>

              <div className="flex-1 min-h-0">
                {/* max-h를 조절하고 내부 여백을 줄였습니다 */}
                <div className="divide-y divide-slate-100/50 overflow-y-auto max-h-[200px] custom-scrollbar pr-1">
                  {recentTransactions && recentTransactions.length > 0 ? (
                    recentTransactions.map((tx) => {
                      const [_, month, day] = tx.date.split("-");

                      return (
                        <div
                          key={tx.id}
                          className={cn(
                            "flex items-center justify-between py-1.5 px-2 transition-all duration-200 ease-out",
                            "hover:bg-white hover:scale-[1.03] hover:shadow-sm hover:z-10 hover:rounded-md",
                            "group cursor-default"
                          )}
                        >
                          {/* 왼쪽: 날짜 + 이모지 + 설명 (gap을 2로 축소) */}
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-[11px] font-bold text-slate-400 tabular-nums shrink-0 uppercase group-hover:text-black">
                              {day}일
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
                            <CurrencyIcon
                              lang={lang}
                              className="w-0.5 h-0.5 text-slate-300 pr-2"
                            />
                            <span className="text-[13px] font-black text-slate-900 tabular-nums tracking-tighter">
                              {tx.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-slate-300 text-[10px] font-medium italic">
                      내역 없음
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
