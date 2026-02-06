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
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { useAppStore } from "@/store/useAppStore";
import { useStatisticsStore } from "@/store/useStatisticsStore";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const [viewMode, setViewMode] = useState<"year" | "month">("month");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM"),
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
    monthlyFinancialSummary,
    financialSummaryStats,
    categoryMonthlyAmounts,
    loadYearlyStatistics,
    loadCategoryTrend,
  } = useStatisticsStore();

  const { categories } = useAppStore();

  useEffect(() => {
    setHeader(
      "통계 및 분석",
      <div className="flex items-center gap-2">
        {/* 선택된 모드에 따른 피커 노출 */}
        {viewMode === "year" && (
          <YearPicker
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
        )}
        {/* 모드 전환 토글 (간단한 디자인 예시) */}
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as "month" | "year")}
          className="mr-2"
        >
          <TabsList className="bg-slate-100 h-10 p-1.5 grid w-[180px] grid-cols-2">
            <TabsTrigger
              value="month"
              className={cn(
                "h-full text-xs transition-all",
                "data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm data-[state=active]:font-bold",
                "text-slate-500",
              )}
            >
              이번 달 기준
            </TabsTrigger>
            <TabsTrigger
              value="year"
              className={cn(
                "h-full text-xs transition-all",
                "data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm data-[state=active]:font-bold",
                "text-slate-500",
              )}
            >
              연도별
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>,
    );
    return () => resetHeader();
  }, [selectedYear, selectedMonth, viewMode, setHeader, resetHeader]);

  useEffect(() => {
    let baseMonth = selectedMonth;
    if (viewMode === "year") {
      baseMonth = `${selectedYear}-12`;
    }

    // 2. 통합 데이터 로드 (최근 12개월 롤링)
    loadYearlyStatistics(baseMonth);
    loadCategoryTrend(baseMonth, null);
  }, [selectedYear, selectedMonth, viewMode]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
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
        baseMonth={viewMode === "year" ? `${selectedYear}-12` : selectedMonth}
        categories={categories}
        loadCategoryMonthlyAmounts={loadCategoryTrend}
        categoryMonthlyAmounts={categoryMonthlyAmounts}
        formatCurrency={formatCurrency}
      />
      <CategoryYearlyTreemap
        baseMonth={viewMode === "year" ? `${selectedYear}-12` : selectedMonth}
      />

      {/* 다이얼로그들 */}
      {/* <TransactionListDialog />
      <DailyTransactionsDialog /> */}
    </div>
  );
}
