import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Wallet,
  CalendarDays,
  PieChart,
  Award,
  CalendarCheck,
} from "lucide-react";
import { useStatisticsStore } from "@/stores/useStatisticsStore";
import { motion, AnimatePresence } from "framer-motion";
import { TitleText } from "./components/TitleText";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useTranslation } from "react-i18next";
import { useDateFormatter } from "@/hooks/useDateFormatter";
import { NoDataOverlay } from "./components/NoDataOverlay";

export function BadgeStatistics() {
  const { t } = useTranslation();
  const { badgeStats: stats } = useStatisticsStore();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { formatAmount } = useCurrencyFormatter();
  const { formatYearMonth, formatDayIndex } = useDateFormatter();

  const isEmpty =
    !stats ||
    (!stats.maxExpenseMonth?.amount &&
      !stats.maxIncomeMonth?.amount &&
      !stats.maxExpenseCategory?.value &&
      !stats.mostFrequentCategory?.value &&
      !stats.maxExpenseDayOfWeek?.amount);

  const items = [
    {
      label: t("statistics.summary.badge_labels.max_expense_month"),
      value: stats?.maxExpenseMonth
        ? formatYearMonth(`${stats.maxExpenseMonth.month}-01`)
        : "-",
      subValue:
        stats?.maxExpenseMonth && stats.maxExpenseMonth.amount !== 0
          ? formatAmount(stats.maxExpenseMonth.amount)
          : "-",
      icon: <CalendarDays className="h-4 w-4" />,
    },
    {
      label: t("statistics.summary.badge_labels.max_income_month"),
      value: stats?.maxIncomeMonth
        ? formatYearMonth(`${stats.maxIncomeMonth.month}-01`)
        : "-",
      subValue:
        stats?.maxIncomeMonth && stats.maxIncomeMonth.amount !== 0
          ? formatAmount(stats.maxIncomeMonth.amount)
          : "-",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      label: t("statistics.summary.badge_labels.net_income_ratio"),
      value: stats?.netIncomeRatio ? `${stats.netIncomeRatio.toFixed(1)}%` : "-",
      subValue: stats?.netIncomeRatio
        ? t("statistics.summary.badge_labels.net_income_ratio_desc")
        : "-",
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      label: t("statistics.summary.badge_labels.max_expense_category"),
      value: stats?.maxExpenseCategory ? stats.maxExpenseCategory.name : "-",
      subValue:
        stats?.maxExpenseCategory && stats.maxExpenseCategory.value !== 0
          ? formatAmount(stats.maxExpenseCategory.value)
          : "-",
      icon: <PieChart className="h-4 w-4" />, // 기본 아이콘으로 고정
      categoryIcon: stats?.maxExpenseCategory?.icon, // 큰 아이콘용 데이터
    },
    {
      label: t("statistics.summary.badge_labels.most_frequent_category"),
      value: stats?.mostFrequentCategory ? stats.mostFrequentCategory.name : "-",
      subValue:
        stats?.mostFrequentCategory && stats.mostFrequentCategory.value !== 0
          ? t("common.count", { count: stats.mostFrequentCategory.value })
          : "-",
      icon: <Award className="h-4 w-4" />, // 기본 아이콘으로 고정
      categoryIcon: stats?.mostFrequentCategory?.icon, // 큰 아이콘용 데이터
    },
    {
      label: t("statistics.summary.badge_labels.max_expense_day"),
      value: stats?.maxExpenseDayOfWeek
        ? formatDayIndex(Number(stats.maxExpenseDayOfWeek.day), "long")
        : "-",
      subValue:
        stats?.maxExpenseDayOfWeek && stats.maxExpenseDayOfWeek.amount !== 0
          ? formatAmount(stats.maxExpenseDayOfWeek.amount)
          : "-",
      icon: <CalendarCheck className="h-4 w-4" />,
    },
  ];

  return (
    <>
      <TitleText title={t("statistics.summary.annual_summary")} />
      <NoDataOverlay isVisible={isEmpty}>
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 group/stats-container"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {items.map((item, index) => {
            const isHovered = hoveredIndex === index;
            const isAnythingHovered = hoveredIndex !== null;

            return (
              <motion.div
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                animate={{
                  scale: isHovered ? 1.05 : isAnythingHovered ? 0.95 : 1,
                  opacity: isHovered ? 1 : isAnythingHovered ? 0.6 : 1,
                  zIndex: isHovered ? 10 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <Card
                  className={cn(
                    "relative overflow-hidden border transition-all duration-300 shadow-none h-full bg-white",
                    isHovered ? "border-blue-500 shadow-lg" : "border-slate-200"
                  )}
                >
                  <CardContent className="p-0 flex flex-col h-full">
                    {/* 상단 Label 영역 */}
                    <div
                      className={cn(
                        "px-3 py-2 border-b flex items-center justify-between transition-colors",
                        isHovered
                          ? "bg-blue-50/50 border-blue-100"
                          : "bg-slate-50/50 border-slate-100"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[11px] font-black uppercase tracking-widest transition-colors",
                          isHovered ? "text-blue-600" : "text-slate-500"
                        )}
                      >
                        {item.label}
                      </span>
                      <div
                        className={cn(
                          "transition-colors",
                          isHovered ? "text-blue-600" : "text-slate-400"
                        )}
                      >
                        {item.icon}
                      </div>
                    </div>

                    {/* 하단 Value 영역 */}
                    <div className="p-4 relative flex-1 flex flex-col justify-center overflow-hidden">
                      <div className="relative z-10 space-y-0.5">
                        <motion.p
                          animate={{ color: isHovered ? "#1d4ed8" : "#0f172a" }}
                          className="text-base font-black truncate tracking-tight"
                        >
                          {item.value}
                        </motion.p>
                        <p
                          className={cn(
                            "text-xs font-bold transition-colors",
                            isHovered ? "text-blue-400" : "text-slate-400",
                            item.subValue === "-" && "opacity-0"
                          )}
                        >
                          {item.subValue}
                        </p>
                      </div>

                      {/* 카테고리 대형 아이콘 (우측 배경) */}
                      {item.categoryIcon && (
                        <motion.div
                          initial={{ opacity: 0.1, scale: 0.8, x: 20 }}
                          animate={{
                            opacity: isHovered ? 0.2 : 0.1,
                            scale: isHovered ? 1.2 : 1,
                            x: 0,
                          }}
                          className="absolute right-[-5px] bottom-[-5px] pointer-events-none select-none"
                        >
                          <span className="text-5xl leading-none native-emoji">
                            {item.categoryIcon}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </CardContent>

                  {/* 하단 강조 선 애니메이션 */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        exit={{ scaleX: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 origin-left"
                      />
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </NoDataOverlay>
    </>
  );
}
