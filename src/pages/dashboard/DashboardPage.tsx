import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { Calendar } from "lucide-react"; // Replaced by DailyExpenseCalendar
import {
  LineChart,
  Line,
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
} from "recharts";
import { useDashboard } from "@/hooks/useDashboard";
import { MainExpenseCard } from "./MainExpenseCard";
import { SummaryItemRow } from "./SummaryItemsRow";
import { TransactionListDialog } from "@/components/dashboard/TransactionListDialog";
import { DialogState, TransactionWithCategory } from "@/types";
import DailyExpenseCalendar from "@/components/DailyExpenseCalendar"; // New import
import DailyTransactionsDialog from "@/components/DailyTransactionsDialog"; // New import
import { CategoryIcon } from "@/components/CategoryIcon";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

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
} satisfies ChartConfig;

const formatDateWithDay = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}.${date.getDate()}(${dayNames[date.getDay()]})`;
};

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
  const {
    loading,
    overview,
    categories,
    dailyExpenses,
    daily7Expenses,
    recentTransactions,
    monthlyExpenses,
    comparisons,
  } = useDashboard(selectedMonth);

  // 현재 연월 가져오기
  useEffect(() => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}`;
    setSelectedMonth(yearMonth);
  }, []);

  const handleDateClick = (date: string) => {
    setSelectedDateForDialog(date);
    setShowDailyTransactionsDialog(true);
  };

  const handlePreviousMonth = () => {
    const currentMonthDate = new Date(`${selectedMonth}-01`);
    const previousMonthDate = subMonths(currentMonthDate, 1);
    setSelectedMonth(format(previousMonthDate, "yyyy-MM"));
  };

  const handleNextMonth = () => {
    const currentMonthDate = new Date(`${selectedMonth}-01`);
    const nextMonthDate = addMonths(currentMonthDate, 1);
    setSelectedMonth(format(nextMonthDate, "yyyy-MM"));
  };

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
    categoryName: string,
  ) => {
    try {
      const transactions = await invoke<TransactionWithCategory[]>(
        "get_transactions_by_month_and_category",
        {
          categoryId,
          yearMonth: selectedMonth,
        },
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

  const dailyChartData = (dailyExpenses || []).map((item) => ({
    ...item,
    displayDate: formatDateWithDay(item.date),
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">대시보드</h1>
          <p className="text-gray-500 mt-1">가계부 분석</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <MonthYearPicker
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
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

      {/* 일별 지출 추이 바 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>일별 지출 추이</CardTitle>
          <CardDescription>{selectedMonth} 일별 지출 내역</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyChartData.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="h-[200px] w-full aspect-none"
            >
              <BarChart
                data={dailyChartData}
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
                <YAxis hide domain={[0, "auto"]} />
                {/* Y축 숨김. 필요시 visible로 변경 */}
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideIndicator />}
                />
                <Bar
                  dataKey="total_amount"
                  radius={[4, 4, 0, 0]}
                  barSize={25}
                  fill="var(--color-total_amount)"
                  fillOpacity={0.6}
                  className="transition-all duration-300 cursor-pointer hover:fill-opacity-100"
                  activeBar={{
                    fillOpacity: 1,
                    stroke: "var(--color-total_amount)",
                    strokeWidth: 1,
                  }}
                  onClick={(data) => handleDateClick(data.date)} // 바 클릭 시 DailyTransactionsDialog 열기
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400">
              데이터가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리별 지출 (파이 차트) */}
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 지출</CardTitle>
            <CardDescription>전체 지출 대비 카테고리별 비율</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="total_amount"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry: any) =>
                      `${entry.category_name} (${entry.percentage.toFixed(1)}%)`
                    }
                  >
                    {categories.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-75 text-gray-400">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>

        {/* 카테고리별 지출 (막대 차트) */}
        <Card>
          <CardHeader>
            <CardTitle>지출 상위 카테고리</CardTitle>
            <CardDescription>카테고리별 지출 금액</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categories.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category_name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="total_amount" fill="#8b5cf6" />
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
            {monthlyExpenses.length > 0 ? (
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
                      category.category_name,
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
