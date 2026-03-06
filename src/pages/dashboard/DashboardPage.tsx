import { MonthYearPicker } from "@/components/MonthYearPicker";
import { useEffect } from "react";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { MainExpenseCard } from "./MainExpenseCard";
import { SummaryItemRow } from "./SummaryItemsRow";
import DailyTransactionsDialog from "@/components/DailyTransactionsDialog";
import { useHeaderStore } from "@/stores/useHeaderStore";
import TreemapDetailDialog from "@/pages/dashboard/components/TreemapDetailDialog";
import CardSelection from "./CardSelection";
import { useTranslation } from "react-i18next";
import DashboardSkeleton from "./DashboardSkeleton";

// ✨ 추가: 애니메이션을 위한 framer-motion 임포트
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { t } = useTranslation();
  const {
    selectedMonth,
    loading,
    overview,
    setSelectedMonth,
    loadDashboardData,
  } = useDashboardStore();
  const resetHeader = useHeaderStore((state) => state.resetHeader);
  const setHeader = useHeaderStore((state) => state.setHeader);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    setHeader(
      t("menu.dashboard"),
      <MonthYearPicker
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />
    );

    return () => resetHeader();
  }, [selectedMonth]);

  if (loading || !overview) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="pt-2 px-6 max-w-7xl mx-auto h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedMonth}
          initial={{ opacity: 0, y: 10 }} // 처음엔 투명하고 살짝 아래에 위치
          animate={{ opacity: 1, y: 0 }} // 제자리로 오면서 선명해짐
          exit={{ opacity: 0, y: -10 }} // 사라질 땐 살짝 위로 올라가며 투명해짐
          transition={{ duration: 0.3, ease: "easeOut" }} // 과하지 않은 0.3초 타이밍
          className="flex flex-col h-full gap-4" // 카드들 사이의 간격을 위해 추가
        >
          <MainExpenseCard />
          <SummaryItemRow />
          <CardSelection />
        </motion.div>
      </AnimatePresence>

      <DailyTransactionsDialog />
      <TreemapDetailDialog />
    </div>
  );
}
