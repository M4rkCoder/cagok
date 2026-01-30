import { MonthYearPicker } from "@/components/MonthYearPicker";
import { useState, useEffect } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { MainExpenseCard } from "./MainExpenseCard";
import { SummaryItemRow } from "./SummaryItemsRow";
import { TransactionListDialog } from "@/pages/dashboard/TransactionListDialog";
import { DialogState } from "@/types";
import DailyTransactionsDialog from "@/components/DailyTransactionsDialog"; // New import
import { useHeaderStore } from "@/store/useHeaderStore";
import CategoryExpenseCard from "./CategoryExpenseCard";
import DailyExpenseCard from "./DailyExpenseCard";
import CategoryIncomeCard from "./CategoryIncomeCard";
import { DotNavigation } from "../../components/DotNavigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  type DashboardSection = "summary" | "category";
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("summary");
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
  const { loading, overview, daily7Expenses, recentTransactions, comparisons } =
    useDashboard(selectedMonth);
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

  if (loading || !overview) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }
  const sections = [
    { id: "summary", label: "현황" },
    { id: "category", label: "카테고리" },
  ];

  const sectionVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="pt-6 px-6 max-w-7xl mx-auto">
      <DotNavigation
        sections={sections}
        activeId={activeSection}
        onChange={(id) => setActiveSection(id as DashboardSection)}
      />

      <AnimatePresence mode="wait">
        {activeSection === "summary" && (
          <motion.div
            key="summary"
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <MainExpenseCard
              overview={overview}
              comparison={comparisons.Expense}
              dailyExpenses={daily7Expenses}
              recentTransactions={recentTransactions}
              lang="ko"
            />

            <SummaryItemRow
              overview={overview}
              comparisons={comparisons}
              lang="ko"
            />

            <DailyExpenseCard
              selectedMonth={selectedMonth}
              handleDateClick={handleDateClick}
            />
          </motion.div>
        )}

        {activeSection === "category" && (
          <motion.div
            key="category"
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>

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
