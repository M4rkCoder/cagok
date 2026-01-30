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
import { DialogState, TransactionWithCategory, CategoryExpense } from "@/types";
import DailyTransactionsDialog from "@/components/DailyTransactionsDialog";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CalendarIcon } from "lucide-react";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { useHeaderStore } from "@/store/useHeaderStore";

const COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#6366f1",
];

export default function StatisticsPage() {
  const { setHeader, resetHeader } = useHeaderStore();
  const [selectedMonth, setSelectedMonth] = useState<string>("");
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
    monthlyExpenses,
    loadDashboardData,
  } = useDashboardStore();

  useEffect(() => {
    setHeader(
      "통계 및 분석",
      <MonthYearPicker
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />,
    );
    return () => resetHeader();
  }, [selectedMonth, setHeader, resetHeader]);

  useEffect(() => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}`;
    setSelectedMonth(yearMonth);
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      // 월별 지출은 12개월 데이터를 가져오도록 수정
      loadDashboardData(selectedMonth);
    }
  }, [selectedMonth, loadDashboardData]);

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
          yearMonth: selectedMonth,
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

  if (loading || !overview) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* 1. 월별 지출/수입 추이 */}
      <Card>
        <CardHeader>
          <CardTitle>월별 지출 추이</CardTitle>
          <CardDescription>최근 12개월 지출 내역</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyExpenses.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year_month" />
                <YAxis
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Bar dataKey="total_amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              데이터가 없습니다
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. 카테고리별 지출 비율 */}
      <Card>
        <CardHeader>
          <CardTitle>카테고리별 지출</CardTitle>
          <CardDescription>이번 달 카테고리별 지출 비율</CardDescription>
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

      {/* 3. 카테고리별 수입 비율 */}
      <Card>
        <CardHeader>
          <CardTitle>카테고리별 수입</CardTitle>
          <CardDescription>이번 달 카테고리별 수입 비율</CardDescription>
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