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
import { TransactionListDialog } from "@/pages/dashboard/TransactionListDialog";
import { DialogState, TransactionWithCategory } from "@/types";
import DailyTransactionsDialog from "@/components/DailyTransactionsDialog"; // New import
import { CategoryIcon } from "@/components/CategoryIcon";

// 차트 색상
const COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#6366f1",
];

export default function StatisticsPage() {
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
    dailyExpenses, // Keep for now if other parts of dashboard use it. Calendar component will fetch its own.
    monthlyExpenses,
    comparisons,
  } = useDashboard(selectedMonth);

  // 현재 연월 가져오기
  useEffect(() => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    setSelectedMonth(yearMonth);
  }, []);

  const handleDateClick = (date: string) => {
    setSelectedDateForDialog(date);
    setShowDailyTransactionsDialog(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">대시보드</h1>
          <p className="text-gray-500 mt-1">가계부 통계 및 분석</p>
        </div>
        <div className="flex items-center gap-2">
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
    </div>
  );
}
