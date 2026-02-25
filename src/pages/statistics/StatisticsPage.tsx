import React, { useState, useEffect } from "react";
import { YearPicker } from "@/components/YearPicker";
import { useHeaderStore } from "@/stores/useHeaderStore";
import { cn } from "@/lib/utils";
import { SummaryCards } from "./SummaryCard";
import { YearlyTrendChart } from "./YearlyTrendChart";
import { CategoryMonthlyTrendSection } from "./CategoryMonthlyTrendSection";
import { CategoryYearlyTreemap } from "./CategoryYearlyTreemap";
import { useStatisticsStore } from "@/stores/useStatisticsStore";
import { BadgeStatistics } from "./BadgeStatistics";
import { DayOfWeekChart } from "./DayOfWeekChart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  BarChart3,
  ChartNoAxesCombined,
  ChartPie,
  ChartSpline,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StatisticsPage() {
  const { setHeader, resetHeader } = useHeaderStore();

  const {
    loading,
    viewMode,
    selectedYear,
    selectedMonth,
    categoryMonthlyAmounts,
    monthlyFinancialSummary,
    setViewMode,
    setSelectedYear,
    loadAllStatistics,
  } = useStatisticsStore();
  const getFormattedPeriod = useStatisticsStore(
    (state) => state.getFormattedPeriod
  );

  const [activeTab, setActiveTab] = useState<
    "summary" | "yearly" | "treemap" | "monthly" | "dayofweek"
  >("summary");

  const tabs = [
    { id: "summary", label: "개요", icon: Activity },
    { id: "yearly", label: "연간 통계", icon: ChartNoAxesCombined },
    { id: "monthly", label: "월별 통계", icon: ChartSpline },
    { id: "treemap", label: "카테고리 통계", icon: ChartPie },
    { id: "dayofweek", label: "요일 통계", icon: BarChart3 },
  ];

  useEffect(() => {
    setHeader(
      "통계 및 분석",
      <div className="flex items-center gap-2">
        {viewMode === "month" && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md shadow-sm">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              기간
            </span>
            <span className="text-sm font-medium text-slate-700 tabular-nums">
              {getFormattedPeriod()}
            </span>
          </div>
        )}

        {/* 선택된 모드에 따른 피커 노출 */}
        {viewMode === "year" && (
          <YearPicker
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
        )}
        {/* 모드 전환 토글 (간단한 디자인 예시) */}
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as "month" | "year")}
          className="mr-2"
        >
          <TabsList className="bg-slate-100 h-10 p-1.5 grid w-[180px] grid-cols-2">
            <TabsTrigger
              value="month"
              className={cn(
                "h-full text-xs transition-all",
                "data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm data-[state=active]:font-bold",
                "text-slate-500"
              )}
            >
              이번 달 기준
            </TabsTrigger>
            <TabsTrigger
              value="year"
              className={cn(
                "h-full text-xs transition-all",
                "data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm data-[state=active]:font-bold",
                "text-slate-500"
              )}
            >
              연도별
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    );
    return () => resetHeader();
  }, [
    selectedYear,
    selectedMonth,
    viewMode,
    setHeader,
    resetHeader,
    setSelectedYear,
    setViewMode,
  ]);

  useEffect(() => {
    loadAllStatistics();
  }, [selectedYear, selectedMonth, viewMode, loadAllStatistics]);

  if (
    loading &&
    !categoryMonthlyAmounts.length &&
    !monthlyFinancialSummary.length
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }
  const renderContent = () => {
    switch (activeTab) {
      case "summary":
        return (
          <div className="space-y-4">
            <BadgeStatistics />
            <SummaryCards />
          </div>
        );
      case "yearly":
        return <YearlyTrendChart />;
      case "treemap":
        return <CategoryYearlyTreemap />;
      case "monthly":
        return <CategoryMonthlyTrendSection />;
      case "dayofweek":
        return <DayOfWeekChart />;
      default:
        return (
          <div className="space-y-6">
            <BadgeStatistics />
            <SummaryCards />
          </div>
        );
    }
  };
  return (
    <div className="px-4 py-6 space-y-6">
      {/* 탭 헤더: 창이 작을 때만 표시 (1440px 미만) */}
      <div
        className={cn(
          "flex border-b border-slate-200 dark:border-slate-800 w-full relative",
          "min-2xl:hidden" // 1440px 이상에선 숨김
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "summary")}
            className={cn(
              "relative px-6 py-2 text-sm font-bold transition-all flex items-center gap-2 outline-none",
              activeTab === tab.id
                ? "text-blue-600"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <tab.icon
              className={cn(
                "w-4 h-4",
                activeTab === tab.id ? "text-blue-600" : "text-slate-300"
              )}
            />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="categoryTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {/* 일반 모드 (창이 작을 때) */}
        <div className="min-2xl:hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 확장 모드 (창이 1440px 이상으로 커졌을 때) */}
        <div className="hidden min-2xl:flex min-2xl:flex-col min-2xl:gap-2">
          <SummaryCards />
          <YearlyTrendChart />
          <CategoryYearlyTreemap />
          <CategoryMonthlyTrendSection />
          <DayOfWeekChart />
        </div>
      </div>
    </div>
  );
}
