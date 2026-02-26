import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
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

export function BadgeStatistics() {
  const { badgeStats: stats } = useStatisticsStore();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { formatAmount } = useCurrencyFormatter();

  if (!stats) return null;

  const formatMonth = (monthStr: string) => {
    if (!monthStr || monthStr === "-" || !monthStr.includes("-"))
      return monthStr;
    const [year, month] = monthStr.split("-");
    const monthNumber = parseInt(month, 10);
    return `${year}년 ${monthNumber}월`;
  };

  const items = [
    {
      label: "많이 쓴 달",
      value: stats.maxExpenseMonth
        ? formatMonth(stats.maxExpenseMonth.month)
        : "-",
      subValue: stats.maxExpenseMonth
        ? formatAmount(stats.maxExpenseMonth.amount)
        : "-",
      icon: <CalendarDays className="h-4 w-4" />,
    },
    {
      label: "많이 번 달",
      value: stats.maxIncomeMonth
        ? formatMonth(stats.maxIncomeMonth.month)
        : "-",
      subValue: stats.maxIncomeMonth
        ? formatAmount(stats.maxIncomeMonth.amount)
        : "-",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      label: "순수입률",
      value: stats.netIncomeRatio ? `${stats.netIncomeRatio.toFixed(1)}%` : "-",
      subValue: stats.netIncomeRatio ? "(수입 대비 순수입)" : "-",
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      label: "많이 쓴 항목",
      value: stats.maxExpenseCategory ? stats.maxExpenseCategory.name : "-",
      subValue: stats.maxExpenseCategory
        ? formatAmount(stats.maxExpenseCategory.value)
        : "-",
      icon: <PieChart className="h-4 w-4" />, // 기본 아이콘으로 고정
      categoryIcon: stats.maxExpenseCategory?.icon, // 큰 아이콘용 데이터
    },
    {
      label: "자주 쓴 항목",
      value: stats.mostFrequentCategory ? stats.mostFrequentCategory.name : "-",
      subValue: stats.mostFrequentCategory
        ? `${stats.mostFrequentCategory.value}회`
        : "-",
      icon: <Award className="h-4 w-4" />, // 기본 아이콘으로 고정
      categoryIcon: stats.mostFrequentCategory?.icon, // 큰 아이콘용 데이터
    },
    {
      label: "많이 쓴 요일",
      value: stats.maxExpenseDayOfWeek ? stats.maxExpenseDayOfWeek.day : "-",
      subValue: stats.maxExpenseDayOfWeek
        ? formatAmount(stats.maxExpenseDayOfWeek.amount)
        : "-",
      icon: <CalendarCheck className="h-4 w-4" />,
    },
  ];

  return (
    <>
      <TitleText title="연간 요약" />
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
                          isHovered ? "text-blue-400" : "text-slate-400"
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
    </>
  );
}
