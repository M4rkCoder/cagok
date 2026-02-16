import React from "react";
import { BadgeStats } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarDays,
  PieChart,
  Award,
  CalendarCheck,
} from "lucide-react";

interface BadgeStatisticsProps {
  stats: BadgeStats | null;
  formatCurrency: (amount: number) => string;
}

export function BadgeStatistics({
  stats,
  formatCurrency,
}: BadgeStatisticsProps) {
  if (!stats) return null;

  const formatMonth = (monthStr: string) => {
    if (!monthStr || monthStr === "-" || !monthStr.includes("-"))
      return monthStr;
    const [year, month] = monthStr.split("-");
    return `${year}년 ${month}월`;
  };

  const items = [
    {
      label: "최대 지출 월",
      value: stats.maxExpenseMonth
        ? formatMonth(stats.maxExpenseMonth.month)
        : "-",
      subValue: stats.maxExpenseMonth
        ? formatCurrency(stats.maxExpenseMonth.amount)
        : "-",
      icon: <CalendarDays className="h-5 w-5 text-rose-500" />,
      color: "bg-rose-50 text-rose-500",
      borderColor: "border-rose-100",
      hoverColor: "hover:border-rose-200 hover:bg-rose-50/50",
    },
    {
      label: "최대 수입 월",
      value: stats.maxIncomeMonth
        ? formatMonth(stats.maxIncomeMonth.month)
        : "-",
      subValue: stats.maxIncomeMonth
        ? formatCurrency(stats.maxIncomeMonth.amount)
        : "-",
      icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
      color: "bg-emerald-50 text-emerald-500",
      borderColor: "border-emerald-100",
      hoverColor: "hover:border-emerald-200 hover:bg-emerald-50/50",
    },
    {
      label: "순수익률",
      value: `${stats.netIncomeRatio.toFixed(1)}%`,
      subValue: "수입 대비 순수입",
      icon: <Wallet className="h-5 w-5 text-indigo-500" />,
      color: "bg-indigo-50 text-indigo-500",
      borderColor: "border-indigo-100",
      hoverColor: "hover:border-indigo-200 hover:bg-indigo-50/50",
    },
    {
      label: "최대 지출 종목",
      value: stats.maxExpenseCategory ? stats.maxExpenseCategory.name : "-",
      subValue: stats.maxExpenseCategory
        ? formatCurrency(stats.maxExpenseCategory.value)
        : "-",
      icon: stats.maxExpenseCategory ? (
        <span className="text-xl native-emoji">
          {stats.maxExpenseCategory.icon}
        </span>
      ) : (
        <PieChart className="h-5 w-5 text-amber-500" />
      ),
      color: "bg-amber-50 text-amber-500",
      borderColor: "border-amber-100",
      hoverColor: "hover:border-amber-200 hover:bg-amber-50/50",
    },
    {
      label: "최다 빈도 지출",
      value: stats.mostFrequentCategory ? stats.mostFrequentCategory.name : "-",
      subValue: stats.mostFrequentCategory
        ? `${stats.mostFrequentCategory.value}회`
        : "-",
      icon: stats.mostFrequentCategory ? (
        <span className="text-xl native-emoji">
          {stats.mostFrequentCategory.icon}
        </span>
      ) : (
        <Award className="h-5 w-5 text-violet-500" />
      ),
      color: "bg-violet-50 text-violet-500",
      borderColor: "border-violet-100",
      hoverColor: "hover:border-violet-200 hover:bg-violet-50/50",
    },
    {
      label: "최대 지출 요일",
      value: stats.maxExpenseDayOfWeek ? stats.maxExpenseDayOfWeek.day : "-",
      subValue: stats.maxExpenseDayOfWeek
        ? formatCurrency(stats.maxExpenseDayOfWeek.amount)
        : "-",
      icon: <CalendarCheck className="h-5 w-5 text-pink-500" />,
      color: "bg-pink-50 text-pink-500",
      borderColor: "border-pink-100",
      hoverColor: "hover:border-pink-200 hover:bg-pink-50/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item, index) => (
        <Card
          key={index}
          className={cn(
            "group relative overflow-hidden border shadow-none transition-all duration-300",
            item.borderColor,
            item.hoverColor,
          )}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div
              className={cn(
                "p-2.5 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 duration-300",
                item.color,
              )}
            >
              {item.icon}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {item.label}
              </p>
              <p className="text-sm font-black text-slate-800 line-clamp-1 leading-tight">
                {item.value}
              </p>
              <p className="text-[11px] font-semibold text-slate-500 tracking-tight">
                {item.subValue}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
