import { MonthYearPicker } from "@/components/MonthYearPicker";
import { useState, useEffect, useCallback } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
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
  const [isScrolling, setIsScrolling] = useState(false);
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
    categoriesIncome,
    dailyExpenses,
    daily7Expenses,
    recentTransactions,
    topFixedExpenses,
    topIncomes,
    comparisons,
    loadDashboardData,
  } = useDashboardStore();
  const resetHeader = useHeaderStore((state) => state.resetHeader);
  const setHeader = useHeaderStore((state) => state.setHeader);

  useEffect(() => {
    if (selectedMonth) {
      loadDashboardData(selectedMonth);
    }
  }, [selectedMonth, loadDashboardData]);

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
  }, []);

  const handleDateClick = (date: string) => {
    setSelectedDateForDialog(date);
    setShowDailyTransactionsDialog(true);
  };
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // 다이얼로그가 열려있을 때는 휠 스크롤로 섹션 이동 금지
      if (dialogState.open || showDailyTransactionsDialog || isScrolling)
        return;

      const threshold = 20; // 미세한 움직임 무시를 위한 임계값
      if (Math.abs(e.deltaY) < threshold) return;

      if (e.deltaY > 0 && activeSection === "summary") {
        // 아래로 스크롤 -> 카테고리로
        setActiveSection("category");
        lockScroll();
      } else if (e.deltaY < 0 && activeSection === "category") {
        // 위로 스크롤 -> 요약으로
        setActiveSection("summary");
        lockScroll();
      }
    },
    [activeSection, isScrolling, dialogState.open, showDailyTransactionsDialog]
  );

  // 스크롤 잠금 함수 (애니메이션 시간 동안 대기)
  const lockScroll = () => {
    setIsScrolling(true);
    setTimeout(() => {
      setIsScrolling(false);
    }, 500); // Framer Motion 전환 시간에 맞춰 조절 (현재 0.35s이므로 0.5s가 적당)
  };

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  if (loading || !overview) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }
  const sections = [
    { id: "summary", label: "월별 현황" },
    { id: "category", label: "카테고리" },
  ];

  const sectionVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="pt-6 px-6 max-w-7xl mx-auto overflow-hidden h-[calc(100vh-147px)]">
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
              dailyExpenses={dailyExpenses}
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
              topList={topFixedExpenses}
              categories={categories}
            />

            <CategoryIncomeCard
              selectedMonth={selectedMonth}
              overview={overview}
              setDialogState={setDialogState}
              topList={topIncomes}
              categoriesIncome={categoriesIncome}
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
