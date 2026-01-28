import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useDashboard } from "@/hooks/useDashboard";
import { MainExpenseCard } from "./MainExpenseCard";
import { SummaryItemRow } from "./SummaryItemsRow";
import { TransactionListDialog } from "@/components/dashboard/TransactionListDialog";
import { DialogState, TransactionWithCategory, DailyExpense } from "@/types";
import DailyExpenseCalendar from "@/components/DailyExpenseCalendar"; // New import
import DailyTransactionsDialog from "@/components/DailyTransactionsDialog"; // New import
import { CategoryIcon } from "@/components/CategoryIcon";
import ChartCard from "./ChartCard";
import { useHeaderStore } from "@/store/useHeaderStore";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

// 차트 색상
const COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#6366f1",
];
const chartConfig = {
  total_amount: {
    label: "지출액",
    color: "#2563eb", // 단일 브랜드 컬러로 통일 (UX 최적화)
  },
  fixed_expense: {
    label: "고정비",
  },
  variable_expense: {
    label: "변동비",
  },
} satisfies ChartConfig;

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    title: "",
    transactions: [],
    showDate: false,
  });
  const [showDailyTransactionsDialog, setShowDailyTransactionsDialog] =
    useState(false); // New state for daily dialog
  const [selectedDateForDialog, setSelectedDateForDialog] = useState<
    string | null
  >(null); // New state for selected date
  const [isMounted, setIsMounted] = useState(false);
  const {
    loading,
    overview,
    categories,
    daily7Expenses,
    recentTransactions,
    monthlyExpenses,
    comparisons,
  } = useDashboard(selectedMonth);
  const resetHeader = useHeaderStore((state) => state.resetHeader);
  const setHeader = useHeaderStore((state) => state.setHeader);
  useEffect(() => {
    setHeader(
      "대시보드",
      <MonthYearPicker
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />
    );

    return () => resetHeader();
  }, [selectedMonth]);

  // 현재 연월 가져오기
  useEffect(() => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    setSelectedMonth(yearMonth);
    setIsMounted(true);
  }, []);

  const handleDateClick = (date: string) => {
    setSelectedDateForDialog(date);
    setShowDailyTransactionsDialog(true);
  };

  const innerData = useMemo(() => {
    return categories.map((cat, index) => {
      // 카테고리 개수에 따라 명도를 30% ~ 85% 사이로 분할
      // 개수가 많아져도 서로 다른 밝기를 가짐
      const lightness = 30 + index * (55 / Math.max(categories.length - 1, 1));

      return {
        ...cat,
        name: cat.category_name,
        value: cat.total_amount,
        // HSL: 221(메인 블루 색상), 83%(채도), 명도만 가변적 적용
        fill: `hsl(221, 83%, ${lightness}%)`,
        percentage: cat.percentage.toFixed(1),
        type: "category",
        icon: cat.category_icon,
      };
    });
  }, [categories]);

  const outerData = useMemo(() => {
    if (!overview) return [];
    return [
      {
        name: "고정비",
        value: overview.fixed_expense ?? 0,
        fill: "#1e40af", // 깊은 다크 블루 (Blue-800)
        percentage: (overview.fixed_expense_ratio ?? 0).toFixed(1),
        type: "fixed_ratio",
        icon: "📌",
      },
      {
        name: "변동비",
        value: Math.max(
          0,
          (overview.total_expense ?? 0) - (overview.fixed_expense ?? 0)
        ),
        fill: "#dbeafe", // 아주 연한 블루 (Blue-100)
        percentage: (100 - (overview.fixed_expense_ratio ?? 0)).toFixed(1),
        type: "fixed_ratio",
        icon: "💸",
      },
    ];
  }, [overview]);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading || !overview) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  const handleCategoryMonthlyClick = async (
    categoryId: number,
    categoryName: string
  ) => {
    try {
      const transactions = await invoke<TransactionWithCategory[]>(
        "get_transactions_by_month_and_category",
        {
          categoryId,
          yearMonth: selectedMonth,
        }
      );
      console.log("CATEGORY MONTHLY TRANSACTIONS:", transactions);
      setDialogState({
        open: true,
        title: `${categoryName} 내역`,
        transactions,
        showDate: true,
      });
    } catch (e) {
      console.error("카테고리별 거래 조회 실패:", e);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-3">
      {/* 🔹 [분리한 컴포넌트 1] 메인 지출 카드 (지출 요약 + 차트/내역) */}
      <MainExpenseCard
        overview={overview}
        comparison={comparisons.Expense}
        dailyExpenses={daily7Expenses}
        recentTransactions={recentTransactions}
        lang="ko"
      />

      {/* 🔹 [분리한 컴포넌트 2] 하단 요약 아이템 행 (수입, 순수입, 고정비) */}
      <SummaryItemRow overview={overview} comparisons={comparisons} lang="ko" />

      <ChartCard
        selectedMonth={selectedMonth}
        handleDateClick={handleDateClick}
      />
      <div className="w-full">
        <Card className="w-full overflow-hidden">
          <CardHeader>
            <CardTitle>지출 분석 상세</CardTitle>
          </CardHeader>
          <CardContent>
            {/* ✨ Grid를 사용하여 좌우 배치, lg 미만(모바일)에서는 상하 배치 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
              {/* 🔵 왼쪽: 파이 차트 영역 */}
              <div className="w-full flex flex-col items-center">
                <div className="text-sm font-semibold mb-4 text-muted-foreground">
                  지출 상세 구조
                </div>
                {isMounted && overview.total_expense > 0 ? (
                  <ChartContainer
                    config={chartConfig}
                    className="h-[300px] w-full max-w-[400px]"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            formatter={(value, name, item) => (
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2.5 h-2.5 rounded-[2px]"
                                    style={{
                                      backgroundColor: item.payload.fill,
                                    }}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {item.payload.icon} {name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 font-bold text-xs">
                                  {Number(value).toLocaleString()}원
                                  <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded">
                                    {item.payload.percentage}%
                                  </span>
                                </div>
                              </div>
                            )}
                          />
                        }
                      />
                      <Legend
                        verticalAlign="top"
                        align="center"
                        content={() => (
                          <div className="flex justify-center gap-4 text-[10px] font-medium mb-4">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full border border-[#8b5cf6]" />{" "}
                              외부: 고정비
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-slate-400" />{" "}
                              내부: 카테고리
                            </div>
                          </div>
                        )}
                      />
                      <Pie
                        data={innerData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={80}
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {innerData.map((entry, index) => (
                          <Cell key={`inner-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Pie
                        data={outerData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={110}
                        paddingAngle={2}
                      >
                        {outerData.map((entry, index) => (
                          <Cell key={`outer-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                    데이터 없음
                  </div>
                )}
              </div>

              {/* 📊 오른쪽: 막대 차트 영역 */}
              <div className="w-full flex flex-col items-center">
                <div className="text-sm font-semibold mb-4 text-muted-foreground">
                  지출 상위 카테고리
                </div>
                {isMounted && categories.length > 0 ? (
                  <ChartContainer
                    config={chartConfig}
                    className="h-[300px] w-full max-w-[400px]"
                  >
                    <BarChart
                      data={categories.slice(0, 5)}
                      margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="category_name"
                        axisLine={false}
                        tickLine={false}
                        fontSize={11}
                        tick={{ fill: "#64748b" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        fontSize={10}
                        tick={{ fill: "#94a3b8" }}
                        tickFormatter={(val) => `${val / 10000}만`}
                      />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        content={
                          <ChartTooltipContent
                            formatter={(value, name, item) => (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2.5 h-2.5 rounded-[2px]"
                                  style={{ backgroundColor: item.payload.fill }}
                                />
                                <span className="font-bold text-xs">
                                  {Number(value).toLocaleString()}원
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Bar
                        dataKey="total_amount"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      >
                        {categories.slice(0, 5).map((entry, index) => (
                          <Cell
                            key={`bar-${index}`}
                            fill={`hsl(221, 83%, ${35 + index * 10}%)`}
                          />
                        ))}
                        <LabelList
                          dataKey="total_amount"
                          position="top"
                          fontSize={10}
                          fill="#94a3b8"
                          formatter={(val: number) =>
                            `${(val / 1000).toLocaleString()}k`
                          }
                        />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                    데이터 없음
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 일별/월별 추이 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 일별 지출 캘린더 (DailyExpenseCalendar로 대체) */}
        <DailyExpenseCalendar onDateClick={handleDateClick} />

        {/* 월별 지출 추이 */}
        <Card>
          <CardHeader>
            <CardTitle>월별 지출 추이</CardTitle>
            <CardDescription>최근 6개월 지출 내역</CardDescription>
          </CardHeader>
          <CardContent>
            {isMounted && monthlyExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year_month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="total_amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-75 text-gray-400">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 카테고리 상세 리스트 */}
      <Card>
        <CardHeader>
          <CardTitle>카테고리별 상세 내역</CardTitle>
          <CardDescription>전체 카테고리 지출 정보</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="space-y-4">
              {categories.map((category, index) => (
                <div
                  key={category.category_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    handleCategoryMonthlyClick(
                      category.category_id,
                      category.category_name
                    )
                  }
                >
                  <div className="flex items-center gap-4">
                    <CategoryIcon
                      icon={category.category_icon}
                      type={1}
                      size="md"
                    />
                    <div>
                      <div className="font-semibold">
                        {category.category_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {category.transaction_count}건의 거래
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {formatCurrency(category.total_amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {category.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              데이터가 없습니다
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionListDialog
        open={dialogState.open}
        title={dialogState.title}
        transactions={dialogState.transactions}
        showDate={dialogState.showDate}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDialogState({
              open: false,
              title: "",
              transactions: [],
              showDate: false,
            });
          } else {
            setDialogState((prev) => ({ ...prev, open: isOpen }));
          }
        }}
      />
      {/* New DailyTransactionsDialog */}
      <DailyTransactionsDialog
        date={selectedDateForDialog}
        isOpen={showDailyTransactionsDialog}
        onClose={() => setShowDailyTransactionsDialog(false)}
      />
    </div>
  );
}
