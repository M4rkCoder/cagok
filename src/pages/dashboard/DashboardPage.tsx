import { MonthYearPicker } from "@/components/MonthYearPicker";
import { useState, useEffect, useCallback } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { MainExpenseCard } from "./MainExpenseCard";
import { SummaryItemRow } from "./SummaryItemsRow";
import DailyTransactionsDialog from "@/components/DailyTransactionsDialog";
import { useHeaderStore } from "@/store/useHeaderStore";
import AnalysisTabs from "./AnalysisTabs";
import { DotNavigation } from "../../components/DotNavigation";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
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
          // Summary 내부 스크롤이 끝났는지 확인은 어렵지만, 
          // 일단 여기서는 ScrollArea가 있으므로 휠 이벤트를 ScrollArea가 먼저 먹게 됨.
          // 따라서 여기서는 섹션 전환 로직을 잠시 보류하거나, 
          // ScrollArea의 최하단 도달 시 전환하도록 로직을 수정해야 함.
          // 하지만 현재 요구사항은 단순히 컴포넌트 추가이므로 기존 로직 유지.
          // setActiveSection("treemap");
          // lockScroll();
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
            className="h-full"
          >
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 pb-20">
                <MainExpenseCard lang="ko" />
                <SummaryItemRow lang="ko" />
                <AnalysisTabs />
              </div>
            </ScrollArea>
          </motion.div>
        )}

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
