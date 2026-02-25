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
      <MainExpenseCard lang="ko" />
      <SummaryItemRow lang="ko" />
      <CardSelection />

      <DailyTransactionsDialog />
      <TreemapDetailDialog />
    </div>
  );
}
