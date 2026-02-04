import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useDashboardStore } from "@/store/useDashboardStore";
import { TransactionListDialog } from "@/pages/dashboard/TransactionListDialog";
import {
  DialogState,
  TransactionWithCategory,
  CategoryExpense,
  FinancialSummaryStats,
  MonthlyFinancialSummaryItem,
  MetricStats,
  Category,
  CategoryMonthlyAmount,
} from "@/types";
import DailyTransactionsDialog from "@/components/DailyTransactionsDialog";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CalendarIcon } from "lucide-react";
import { YearPicker } from "@/components/YearPicker";
import { useHeaderStore } from "@/store/useHeaderStore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SummaryCards } from "./SummaryCard";
import { YearlyTrendChart } from "./YearlyTrendChart";
import { CategoryMonthlyTrendSection } from "./CategoryMonthlyTrendSection";
import { CategoryRatioChart } from "./CategoryRatioCharts";
import { CategoryYearlyTreemap } from "./CategoryYearlyTreemap";

const COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#6366f1",
];

// Default empty MetricStats for safe access
const emptyMetricStats: MetricStats = {
  total: 0,
  average: 0,
  max: 0,
  min: 0,
};

// Default empty FinancialSummaryStats for safe access
const emptyFinancialSummaryStats: FinancialSummaryStats = {
  income: emptyMetricStats,
  expense: emptyMetricStats,
  netIncome: emptyMetricStats,
  fixedExpense: emptyMetricStats,
};

export default function StatisticsPage() {
  const { setHeader, resetHeader } = useHeaderStore();
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    title: "",
    transactions: [],
    showDate: false,
  });
  const [showDailyTransactionsDialog, setShowDailyTransactionsDialog] =
    useState(false);
  const [selectedDateForDialog, setSelectedDateForDialog] = useState<
    string | null
  >(null);

  const {
    loading,
    overview,
    categories,
    categoriesIncome,
    monthlyFinancialSummary,
    financialSummaryStats,
    categoryMonthlyAmounts,
    loadDashboardData,
    loadYearlyDashboardData,
    loadCategoryMonthlyAmounts,
  } = useDashboardStore();

  useEffect(() => {
    setHeader(
      "통계 및 분석",
      <YearPicker selectedYear={selectedYear} onYearChange={setSelectedYear} />,
    );
    return () => resetHeader();
  }, [selectedYear, setHeader, resetHeader]);

  useEffect(() => {
    if (selectedYear) {
      loadYearlyDashboardData(selectedYear);
      const firstMonthOfYear = `${selectedYear}-01`;
      loadDashboardData(firstMonthOfYear);
      console.log("외부컴포넌트");
    }
  }, [selectedYear]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCategoryMonthlyClick = async (
    categoryId: number,
    categoryName: string,
    type: 0 | 1,
  ) => {
    try {
      const transactions = await invoke<TransactionWithCategory[]>(
        "get_transactions_by_month_and_category",
        {
          categoryId,
          yearMonth: `${selectedYear}-01`,
          txType: type,
        },
      );
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

  if (
    loading &&
    !categoryMonthlyAmounts.length &&
    !monthlyFinancialSummary.length
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  // Calculate min and max for net income to center the Y-axis at 0
  const allNetIncomes = monthlyFinancialSummary.map((item) => item.netIncome); // Use camelCase
  const maxNetIncome = Math.max(0, ...allNetIncomes, 1); // Ensure at least 1 to prevent division by zero
  const minNetIncome = Math.min(0, ...allNetIncomes, -1); // Ensure at least -1
  const symmetricMax = Math.max(Math.abs(maxNetIncome), Math.abs(minNetIncome));

  const totalExpense = categories.reduce(
    (sum, cat) => sum + cat.total_amount,
    0,
  );
  const pieChartData = categories.map((cat, index) => ({
    name: cat.category_name,
    value: cat.total_amount,
    color: COLORS[index % COLORS.length],
  }));

  const totalIncome = categoriesIncome.reduce(
    (sum, cat) => sum + cat.total_amount,
    0,
  );
  const pieChartIncomeData = categoriesIncome.map((cat, index) => ({
    name: cat.category_name,
    value: cat.total_amount,
    color: COLORS[index % COLORS.length],
  }));

  // Process categoryMonthlyAmounts for the new stacked bar chart
  const monthlyChartData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const yearMonth = `${selectedYear}-${String(month).padStart(2, "0")}`;
    const dataForMonth: { [key: string]: number | string } = {
      year_month: yearMonth,
      month_short: format(new Date(yearMonth), "M월"),
      total_income: 0,
      total_expense: 0,
      net_income: 0,
    };

    let monthIncome = 0;
    let monthExpense = 0;

    categoryMonthlyAmounts
      .filter((item) => item.year_month === yearMonth)
      .forEach((item) => {
        const key = `${item.category_name}_${item.type === 0 ? "income" : "expense"}`;
        dataForMonth[key] = item.total_amount;

        if (item.type === 0) {
          monthIncome += item.total_amount;
        } else {
          monthExpense += item.total_amount;
        }
      });

    dataForMonth.total_income = monthIncome;
    dataForMonth.total_expense = monthExpense;
    dataForMonth.net_income = monthIncome - monthExpense;

    return dataForMonth;
  });

  // Dynamically generate bars and assign colors
  const uniqueCategoriesInChart = Array.from(
    new Set(categoryMonthlyAmounts.map((item) => item.category_id)),
  ).map((id) => categories.find((cat) => cat.category_id === id));

  const categoryBars = uniqueCategoriesInChart
    .filter(Boolean)
    .flatMap((category, index) => {
      const incomeKey = `${category?.category_name}_income`;
      const expenseKey = `${category?.category_name}_expense`;
      const colorIndex = index % COLORS.length;
      return [
        <Bar
          key={incomeKey}
          yAxisId="left"
          dataKey={incomeKey}
          stackId="category_stack"
          fill={COLORS[colorIndex]}
          name={`${category?.category_name} (수입)`}
        />,
        <Bar
          key={expenseKey}
          yAxisId="left"
          dataKey={expenseKey}
          stackId="category_stack"
          fill={COLORS[colorIndex]} // Use the same color for income/expense of same category
          name={`${category?.category_name} (지출)`}
          opacity={0.7}
        />,
      ];
    });

  const allMonthlyCategoryNetIncomes = monthlyChartData.map(
    (item) => item.net_income as number,
  );
  const maxMonthlyCategoryNetIncome = Math.max(
    0,
    ...allMonthlyCategoryNetIncomes,
    1,
  );
  const minMonthlyCategoryNetIncome = Math.min(
    0,
    ...allMonthlyCategoryNetIncomes,
    -1,
  );
  const symmetricMaxMonthlyCategory = Math.max(
    Math.abs(maxMonthlyCategoryNetIncome),
    Math.abs(minMonthlyCategoryNetIncome),
  );

  return (
    <div className="px-4 py-6 space-y-6">
      {/* 1. 요약 카드 */}
      <SummaryCards
        stats={financialSummaryStats ?? emptyFinancialSummaryStats}
        formatCurrency={formatCurrency}
      />

      {/* 2. 연간 추이 차트 */}
      <YearlyTrendChart
        data={monthlyFinancialSummary}
        symmetricMax={symmetricMax}
        formatCurrency={formatCurrency}
      />

      {/* 3. 월별 카테고리별 상세 추이 (필터 포함 - 분리 권장) */}
      <CategoryMonthlyTrendSection
        selectedYear={selectedYear}
        categories={categories}
        categoriesIncome={categoriesIncome}
        loadCategoryMonthlyAmounts={loadCategoryMonthlyAmounts}
        categoryMonthlyAmounts={categoryMonthlyAmounts}
        formatCurrency={formatCurrency}
      />
      <CategoryYearlyTreemap year={selectedYear} />
      {/* 4. 비율 차트 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CategoryRatioChart
          title="카테고리별 지출 비율"
          data={pieChartData}
          total={totalExpense}
          formatCurrency={formatCurrency}
        />
        <CategoryRatioChart
          title="카테고리별 수입 비율"
          data={pieChartIncomeData}
          total={totalIncome}
          formatCurrency={formatCurrency}
        />
      </div>

      {/* 다이얼로그들 */}
      {/* <TransactionListDialog />
      <DailyTransactionsDialog /> */}

      {/* 5. 카테고리별 연간 지출 트리맵 */}
    </div>
  );
}
