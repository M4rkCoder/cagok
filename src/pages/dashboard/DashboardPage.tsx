import { MonthYearPicker } from "@/components/MonthYearPicker";
import { useState, useEffect } from "react";
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDashboard } from "@/hooks/useDashboard";
import { MainExpenseCard } from "./MainExpenseCard";
import { SummaryItemRow } from "./SummaryItemsRow";
import { TransactionListDialog } from "@/components/dashboard/TransactionListDialog";
import { DialogState } from "@/types";
import DailyTransactionsDialog from "@/components/DailyTransactionsDialog"; // New import
import { useHeaderStore } from "@/store/useHeaderStore";
import CategoryExpenseCard from "./CategoryExpenseCard";
import DailyExpenseCard from "./DailyExpenseCard";
import CategoryIncomeCard from "./CategoryIncomeCard";

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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* 첫페이지 */}
      <MainExpenseCard
        overview={overview}
        comparison={comparisons.Expense}
        dailyExpenses={daily7Expenses}
        recentTransactions={recentTransactions}
        lang="ko"
      />

      <SummaryItemRow overview={overview} comparisons={comparisons} lang="ko" />

      <DailyExpenseCard
        selectedMonth={selectedMonth}
        handleDateClick={handleDateClick}
      />

      {/* 두번째 페이지 */}
      <CategoryExpenseCard
        selectedMonth={selectedMonth}
        overview={overview}
        setDialogState={setDialogState}
      />

      <CategoryIncomeCard
        selectedMonth={selectedMonth}
        overview={overview}
        setDialogState={setDialogState}
      />

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
