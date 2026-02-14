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
  CalendarCheck
} from "lucide-react";

interface BadgeStatisticsProps {
  stats: BadgeStats | null;
  formatCurrency: (amount: number) => string;
}

export function BadgeStatistics({ stats, formatCurrency }: BadgeStatisticsProps) {
  if (!stats) return null;

  const items = [
    {
      label: "최대 지출 월",
      value: stats.maxExpenseMonth ? stats.maxExpenseMonth.month : "-",
      subValue: stats.maxExpenseMonth ? formatCurrency(stats.maxExpenseMonth.amount) : "-",
      icon: <CalendarDays className="h-6 w-6 text-red-500" />,
      color: "bg-red-100",
      borderColor: "border-red-200",
    },
    {
      label: "최대 수입 월",
      value: stats.maxIncomeMonth ? stats.maxIncomeMonth.month : "-",
      subValue: stats.maxIncomeMonth ? formatCurrency(stats.maxIncomeMonth.amount) : "-",
      icon: <TrendingUp className="h-6 w-6 text-green-500" />,
      color: "bg-green-100",
      borderColor: "border-green-200",
    },
    {
      label: "수입 대비 순수입",
      value: `${stats.netIncomeRatio.toFixed(1)}%`,
      subValue: "순수익률",
      icon: <Wallet className="h-6 w-6 text-blue-500" />,
      color: "bg-blue-100",
      borderColor: "border-blue-200",
    },
    {
      label: "최대 지출 카테고리",
      value: stats.maxExpenseCategory ? stats.maxExpenseCategory.name : "-",
      subValue: stats.maxExpenseCategory ? formatCurrency(stats.maxExpenseCategory.value) : "-",
      icon: stats.maxExpenseCategory ? (
        <span className="text-xl">{stats.maxExpenseCategory.icon}</span>
      ) : (
        <PieChart className="h-6 w-6 text-orange-500" />
      ),
      color: "bg-orange-100",
      borderColor: "border-orange-200",
    },
    {
      label: "최다 빈도 지출",
      value: stats.mostFrequentCategory ? stats.mostFrequentCategory.name : "-",
      subValue: stats.mostFrequentCategory ? `${stats.mostFrequentCategory.value}회` : "-",
      icon: stats.mostFrequentCategory ? (
        <span className="text-xl">{stats.mostFrequentCategory.icon}</span>
      ) : (
        <Award className="h-6 w-6 text-purple-500" />
      ),
      color: "bg-purple-100",
      borderColor: "border-purple-200",
    },
    {
      label: "최대 지출 요일",
      value: stats.maxExpenseDayOfWeek ? stats.maxExpenseDayOfWeek.day : "-",
      subValue: stats.maxExpenseDayOfWeek ? formatCurrency(stats.maxExpenseDayOfWeek.amount) : "-",
      icon: <CalendarCheck className="h-6 w-6 text-pink-500" />,
      color: "bg-pink-100",
      borderColor: "border-pink-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map((item, index) => (
        <Card key={index} className={cn("border-2 shadow-sm hover:shadow-md transition-shadow", item.borderColor)}>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className={cn("p-3 rounded-full flex items-center justify-center mb-1", item.color)}>
              {item.icon}
            </div>
            <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                <p className="text-sm font-bold text-slate-900 line-clamp-1 break-all px-1">{item.value}</p>
                <p className="text-xs text-slate-500">{item.subValue}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
