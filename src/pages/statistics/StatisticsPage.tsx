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
import { AnimatedTabs, TabItem, TabContent } from "@/components/AnimatedTabs";
import { useTranslation } from "react-i18next";
import { useSettingStore } from "@/stores/useSettingStore";
import { ko, enUS } from "date-fns/locale";

export default function StatisticsPage() {
  const { t, i18n } = useTranslation();
  const { setHeader, resetHeader } = useHeaderStore();
  const { dateFormat } = useSettingStore();

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

  const [activeTab, setActiveTab] = useState("summary");

  const tabs: TabItem[] = [
    { id: "summary", label: t("statistics.tabs.summary"), icon: Activity },
    { id: "yearly", label: t("statistics.tabs.yearly"), icon: ChartNoAxesCombined },
    { id: "monthly", label: t("statistics.tabs.monthly"), icon: ChartSpline },
    { id: "treemap", label: t("statistics.tabs.treemap"), icon: ChartPie },
    { id: "dayofweek", label: t("statistics.tabs.dayofweek"), icon: BarChart3 },
  ];

  useEffect(() => {
    setHeader(
      t("statistics.title"),
      <div className="flex items-center gap-2">
        {viewMode === "month" && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md shadow-sm">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              {t("statistics.period")}
            </span>
            <span className="text-sm font-medium text-slate-700 tabular-nums">
              {getFormattedPeriod({
                dateFormat,
                locale: i18n.language === "ko" ? ko : enUS,
              })}
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
          <TabsList className="bg-slate-100 h-10 p-1.5 grid w-[220px] grid-cols-2">
            <TabsTrigger
              value="month"
              className={cn(
                "h-full text-xs transition-all",
                "data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm data-[state=active]:font-bold",
                "text-slate-500"
              )}
            >
              {t("statistics.view_modes.this_month")}
            </TabsTrigger>
            <TabsTrigger
              value="year"
              className={cn(
                "h-full text-xs transition-all",
                "data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm data-[state=active]:font-bold",
                "text-slate-500"
              )}
            >
              {t("statistics.view_modes.by_year")}
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
    t,
    dateFormat,
    i18n.language,
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
        <div className="text-lg">{t("common.loading")}</div>
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
      <AnimatedTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="min-2xl:hidden"
        layoutId="statisticsTabMenu"
      />

      <div className="mt-4">
        {/* 일반 모드 (창이 작을 때) */}
        <div className="min-2xl:hidden">
          <TabContent activeKey={activeTab}>{renderContent()}</TabContent>
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
