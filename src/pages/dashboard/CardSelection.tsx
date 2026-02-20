import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, BarChart3, ListOrdered, Pin } from "lucide-react";
import { useState } from "react";
import DailyTransactionCard from "./DailyTransactionCard";
import { DayOfWeekCard } from "./DayOfWeekCard";
import { CategoryMonthlyTreemap } from "./CategoryMonthlyTreemap";
import { CategoryTopList } from "./CategoryTopList";

export default function CardSelection() {
  const [activeTab, setActiveTab] = useState<
    "daily" | "dayofweek" | "treemap" | "toplist"
  >("daily");

  const tabs = [
    { id: "daily", label: "일일 현황", icon: Activity },
    { id: "dayofweek", label: "요일 현황", icon: BarChart3 },
    { id: "treemap", label: "고정·변동 지출", icon: Pin },
    { id: "toplist", label: "지출 TOP5", icon: ListOrdered },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "daily":
        return <DailyTransactionCard />;
      case "dayofweek":
        return <DayOfWeekCard />;
      case "treemap":
        return <CategoryMonthlyTreemap />;
      case "toplist":
        return <CategoryTopList />;
      default:
        return <DailyTransactionCard />;
    }
  };

  return (
    <div className="w-full">
      {/* 탭 헤더: 창이 작을 때만 표시 (1440px 미만) */}
      <div
        className={cn(
          "flex border-b border-slate-200 dark:border-slate-800 w-full relative",
          "min-2xl:hidden", // 1440px 이상에선 숨김
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "daily" | "dayofweek")}
            className={cn(
              "relative px-6 py-2 text-sm font-bold transition-all flex items-center gap-2 outline-none",
              activeTab === tab.id
                ? "text-blue-600"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            <tab.icon
              className={cn(
                "w-4 h-4",
                activeTab === tab.id ? "text-blue-600" : "text-slate-300",
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
          <DailyTransactionCard />
          <DayOfWeekCard />
          <CategoryMonthlyTreemap />
          <CategoryTopList />
        </div>
      </div>
    </div>
  );
}
