import { MonthYearPicker } from "@/components/MonthYearPicker";
import { useState, useEffect, useCallback } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { MainExpenseCard } from "./MainExpenseCard";
import { SummaryItemRow } from "./SummaryItemsRow";
import DailyTransactionsDialog from "@/components/DailyTransactionsDialog";
import { useHeaderStore } from "@/store/useHeaderStore";
import DailyTransactionCard from "./DailyTransactionCard";
import { DotNavigation } from "../../components/DotNavigation";
import { motion, AnimatePresence } from "framer-motion";
import { CategoryMonthlyTreemap } from "./CategoryMonthlyTreemap";
import { CategoryTopList } from "./CategoryTopList";
import TreemapDetailDialog from "./TreemapDetailDialog";

export default function Dashboard() {
  type DashboardSection = "summary" | "treemap";
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("summary");
  const [isScrolling, setIsScrolling] = useState(false);
  const {
    selectedMonth,
    loading,
    overview,
    setSelectedMonth,
    loadDashboardData,
    dialogState,
  } = useDashboardStore();
  const resetHeader = useHeaderStore((state) => state.resetHeader);
  const setHeader = useHeaderStore((state) => state.setHeader);

  useEffect(() => {
    loadDashboardData();
  }, []);

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

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (dialogState.isOpen || isScrolling) return;

      const threshold = 20;
      if (Math.abs(e.deltaY) < threshold) return;

      if (e.deltaY > 0) {
        // 아래로 스크롤: summary -> treemap 직결
        if (activeSection === "summary") {
          setActiveSection("treemap");
          lockScroll();
        }
      } else if (e.deltaY < 0) {
        // 위로 스크롤: treemap -> summary 직결
        if (activeSection === "treemap") {
          setActiveSection("summary");
          lockScroll();
        }
      }
    },
    [activeSection, dialogState.isOpen, isScrolling]
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
    { id: "treemap", label: "한 눈에 지출 보기" },
  ];

  const sectionVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div className="pt-3 px-6 max-w-7xl mx-auto overflow-hidden h-[calc(100vh-147px)]">
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
            <MainExpenseCard lang="ko" />

            <SummaryItemRow lang="ko" />

            <DailyTransactionCard />
          </motion.div>
        )}
        {/* 
        {activeSection === "category" && (
          <motion.div
            key="category"
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <CategoryExpenseCard setDialogState={setDialogState} />

            <CategoryIncomeCard setDialogState={setDialogState} />
          </motion.div>
        )} */}

        {activeSection === "treemap" && (
          <motion.div
            key="treemap"
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full h-fit min-h-[600px]"
          >
            <CategoryMonthlyTreemap />
            <CategoryTopList />
          </motion.div>
        )}
      </AnimatePresence>
      {/* New DailyTransactionsDialog */}
      <DailyTransactionsDialog />
      <TreemapDetailDialog />
    </div>
  );
}
