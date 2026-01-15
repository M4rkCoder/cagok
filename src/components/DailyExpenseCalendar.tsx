import React, { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DailyExpense } from "@/types/dashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DailyExpenseCalendarProps {
  onDateClick: (date: string) => void;
}

const DailyExpenseCalendar: React.FC<DailyExpenseCalendarProps> = ({
  onDateClick,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);

  const yearMonth = format(currentMonth, "yyyy-MM");

  useEffect(() => {
    const fetchDailyExpenses = async () => {
      try {
        const expenses = await invoke<DailyExpense[]>("get_daily_expenses", {
          yearMonth,
        });
        setDailyExpenses(expenses);
      } catch (error) {
        console.error("Failed to fetch daily expenses:", error);
        toast.error("일별 지출 데이터를 불러오는 데 실패했습니다.");
      }
    };
    fetchDailyExpenses();
  }, [yearMonth]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const firstDayOfMonth = startOfMonth(currentMonth);
  const startingDayIndex = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.

  const dailyExpenseMap = useMemo(() => {
    return new Map(dailyExpenses.map((de) => [de.date, de.total_amount]));
  }, [dailyExpenses]);

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <Card className="p-4">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <CardTitle className="text-lg">
          {format(currentMonth, "yyyy년 MM월", { locale: ko })}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 text-center text-sm font-medium text-muted-foreground">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startingDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-16"></div>
          ))}
          {daysInMonth.map((day, index) => {
            const dateString = format(day, "yyyy-MM-dd");
            const expense = dailyExpenseMap.get(dateString);

            return (
              <div
                key={dateString}
                className={cn(
                  "relative h-16 flex flex-col items-center justify-start p-1 rounded-md cursor-pointer",
                  isSameMonth(day, currentMonth)
                    ? "text-foreground"
                    : "text-muted-foreground",
                  isSameDay(day, new Date()) &&
                    "bg-accent text-accent-foreground",
                  expense &&
                    "bg-rose-100 dark:bg-rose-950/50 hover:bg-rose-200 dark:hover:bg-rose-900/50",
                  "transition-colors"
                )}
                onClick={() => onDateClick(dateString)}
              >
                <span className="text-xs font-semibold">
                  {format(day, "d")}
                </span>
                {expense !== undefined && expense > 0 && (
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1">
                    {expense.toLocaleString()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyExpenseCalendar;
