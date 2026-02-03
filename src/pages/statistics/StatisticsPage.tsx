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
  const [selectedCategoryForMonthlyChart, setSelectedCategoryForMonthlyChart] =
    useState<number | null>(null);

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
    }
  }, [selectedYear, loadYearlyDashboardData, loadDashboardData]);

  // Effect for loading category monthly amounts
  useEffect(() => {
    loadCategoryMonthlyAmounts(selectedYear, selectedCategoryForMonthlyChart);
  }, [selectedYear, selectedCategoryForMonthlyChart, loadCategoryMonthlyAmounts]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  const currentFinancialSummaryStats =
    financialSummaryStats ?? emptyFinancialSummaryStats;

  const { 
    income = emptyMetricStats, 
    expense = emptyMetricStats, 
    netIncome = emptyMetricStats, 
    fixedExpense = emptyMetricStats 
  } = currentFinancialSummaryStats;

  // Calculate min and max for net income to center the Y-axis at 0
  const allNetIncomes = monthlyFinancialSummary.map((item) => item.net_income);
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

  // Calculate symmetricMax for the new monthly category chart net income
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Summary Section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>총 수입</CardTitle>
            <CardDescription className="text-2xl font-bold text-emerald-500">
              {formatCurrency(income.total)}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-500">
            <p>
              평균:{" "}
              {formatCurrency(income.average)}
            </p>
            <p>
              최대:{" "}
              {formatCurrency(income.max)}
            </p>
            <p>
              최소:{" "}
              {formatCurrency(income.min)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>총 지출</CardTitle>
            <CardDescription className="text-2xl font-bold text-rose-500">
              {formatCurrency(expense.total)}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-500">
            <p>
              평균:{" "}
              {formatCurrency(expense.average)}
            </p>
            <p>
              최대:{" "}
              {formatCurrency(expense.max)}
            </p>
            <p>
              최소:{" "}
              {formatCurrency(expense.min)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>순수입</CardTitle>
            <CardDescription
              className={cn(
                "text-2xl font-bold",
                netIncome.total >= 0 ? "text-emerald-500" : "text-rose-500",
              )}
            >
              {formatCurrency(netIncome.total)}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-500">
            <p>
              평균:{" "}
              {formatCurrency(netIncome.average)}
            </p>
            <p>
              최대:{" "}
              {formatCurrency(netIncome.max)}
            </p>
            <p>
              최소:{" "}
              {formatCurrency(netIncome.min)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>고정 지출</CardTitle>
            <CardDescription className="text-2xl font-bold text-slate-700">
              {formatCurrency(fixedExpense.total)}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-500">
            <p>
              평균:{" "}
              {formatCurrency(fixedExpense.average)}
            </p>
            <p>
              최대:{" "}
              {formatCurrency(fixedExpense.max)}
            </p>
            <p>
              최소:{" "}
              {formatCurrency(fixedExpense.min)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 1. 연간 월별 수입/지출 및 순수입 추이 */}
      <Card>
        <CardHeader>
          <CardTitle>연간 월별 수입/지출 및 순수입 추이</CardTitle>
          <CardDescription>
            선택된 연도의 월별 수입, 지출 및 순수입
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyFinancialSummary.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={monthlyFinancialSummary}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year_month"
                  tickFormatter={(value) => format(new Date(value), "M월")}
                />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#82ca9d" // Income/Expense color
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#8884d8" // Net income color
                  tickFormatter={(value) => formatCurrency(Number(value))}
                  domain={[-symmetricMax, symmetricMax]}
                />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name === "total_income")
                      return [formatCurrency(Number(value)), "수입"];
                    if (name === "total_expense")
                      return [formatCurrency(Number(value)), "지출"];
                    if (name === "net_income")
                      return [formatCurrency(Number(value)), "순수입"];
                    return [formatCurrency(Number(value)), name];
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="total_income"
                  stackId="a"
                  fill="#a7f3d0"
                  name="수입"
                />
                <Bar
                  yAxisId="left"
                  dataKey="total_expense"
                  stackId="a"
                  fill="#fca5a5"
                  name="지출"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="net_income"
                  stroke="#8884d8"
                  name="순수입"
                  activeDot={{ r: 8 }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-gray-400">
              월별 재무 데이터가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* New: Monthly Category Income/Expense Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>월별 카테고리별 수입/지출 추이</CardTitle>
          <CardDescription>선택된 연도의 월별 카테고리 수입, 지출 및 순수입</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-2">
            <Select
              value={selectedCategoryForMonthlyChart?.toString() ?? "all"}
              onValueChange={(value) =>
                setSelectedCategoryForMonthlyChart(
                  value === "all" ? null : Number(value),
                )
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 카테고리</SelectItem>
                {categories.map((category) => (
                  <SelectItem
                    key={category.category_id}
                    value={category.category_id.toString()}
                  >
                    <div className="flex items-center gap-2">
                      <CategoryIcon
                        icon={category.category_icon}
                        type={1} // Assuming expense for general category icon display
                        size="sm"
                      />
                      {category.category_name}
                    </div>
                  </SelectItem>
                ))}
                 {categoriesIncome.map((category) => (
                  <SelectItem
                    key={category.category_id}
                    value={category.category_id.toString()}
                  >
                    <div className="flex items-center gap-2">
                      <CategoryIcon
                        icon={category.category_icon}
                        type={0} // Assuming income for general category icon display
                        size="sm"
                      />
                      {category.category_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={monthlyChartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_short" />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#82ca9d"
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#8884d8"
                  tickFormatter={(value) => formatCurrency(Number(value))}
                  domain={[-symmetricMaxMonthlyCategory, symmetricMaxMonthlyCategory]}
                />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    // Custom formatter for tooltip
                    const originalName = name.replace(/_income|_expense/, "");
                    const typeSuffix = name.includes("_income") ? " (수입)" : name.includes("_expense") ? " (지출)" : "";
                    return [formatCurrency(Number(value)), `${originalName}${typeSuffix}`];
                  }}
                />
                <Legend />
                {
                  // Dynamically render Bar components for each category (income and expense)
                  Array.from(
                    new Set(categoryMonthlyAmounts.map((item) => item.category_name)),
                  ).map((categoryName, index) => [
                    <Bar
                      key={`${categoryName}_income`}
                      yAxisId="left"
                      dataKey={`${categoryName}_income`}
                      stackId="category_stack"
                      fill={COLORS[index % COLORS.length]} // Consistent color for category income/expense
                      name={`${categoryName} (수입)`}
                    />,
                    <Bar
                      key={`${categoryName}_expense`}
                      yAxisId="left"
                      dataKey={`${categoryName}_expense`}
                      stackId="category_stack"
                      fill={COLORS[index % COLORS.length]}
                      name={`${categoryName} (지출)`}
                      opacity={0.7} // Slightly dimmed for expense
                    />,
                  ])
                }
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="net_income"
                  stroke="#8884d8"
                  name="순수입"
                  activeDot={{ r: 8 }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-gray-400">
              월별 카테고리 데이터가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. 카테고리별 지출 비율 (기존 2번, 이제 3번)*/}
      <Card>
        <CardHeader>
          <CardTitle>카테고리별 지출</CardTitle>
          <CardDescription>
            {selectedYear}년 1월 카테고리별 지출 비율
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center justify-center">
          {totalExpense > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [
                    formatCurrency(Number(value)),
                    name,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] w-full text-gray-400">
              지출 데이터가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. 카테고리별 수입 비율 (기존 3번, 이제 4번)*/}
      <Card>
        <CardHeader>
          <CardTitle>카테고리별 수입</CardTitle>
          <CardDescription>
            {selectedYear}년 1월 카테고리별 수입 비율
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center justify-center">
          {totalIncome > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartIncomeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#82ca9d"
                  label
                >
                  {pieChartIncomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [
                    formatCurrency(Number(value)),
                    name,
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] w-full text-gray-400">
              수입 데이터가 없습니다.
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
      <DailyTransactionsDialog
        date={selectedDateForDialog}
        isOpen={showDailyTransactionsDialog}
        onClose={() => setShowDailyTransactionsDialog(false)}
      />
    </div>
  );
}