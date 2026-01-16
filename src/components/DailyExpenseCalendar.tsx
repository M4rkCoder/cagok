import React, { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { DailyExpense } from "@/types/dashboard";

interface DailyExpenseCalendarProps {
  onDateClick: (date: string) => void;
}

const DailyExpenseCalendar: React.FC<DailyExpenseCalendarProps> = ({
  onDateClick,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
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
        console.error(error);
        toast.error("일별 지출 데이터를 불러오는 데 실패했습니다.");
      }
    };

    fetchDailyExpenses();
  }, [yearMonth]);

  /** 날짜 → 지출금액 Map */
  const dailyExpenseMap = useMemo(() => {
    return new Map(dailyExpenses.map((d) => [d.date, d.total_amount]));
  }, [dailyExpenses]);

  /** 지출이 있는 날짜들 */
  const expenseDates = useMemo(() => {
    return dailyExpenses
      .filter((d) => d.total_amount > 0)
      .map((d) => new Date(d.date));
  }, [dailyExpenses]);

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-lg text-center">
          {format(currentMonth, "yyyy년 MM월", { locale: ko })}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <Calendar
          mode="single"
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          locale={ko}
          modifiers={{
            expense: expenseDates,
          }}
          modifiersClassNames={{
            expense:
              "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold",
          }}
          onSelect={(date) => {
            if (!date) return;
            onDateClick(format(date, "yyyy-MM-dd"));
          }}
          // components={{
          //   DayContent: ({ date }) => {
          //     const key = format(date, "yyyy-MM-dd");
          //     const expense = dailyExpenseMap.get(key);

          //     return (
          //       <div className="flex flex-col items-center gap-1">
          //         <span>{date.getDate()}</span>
          //         {expense && expense > 0 && (
          //           <span className="text-[10px] text-rose-600 dark:text-rose-400">
          //             {expense.toLocaleString()}
          //           </span>
          //         )}
          //       </div>
          //     );
          //   },
          // }}
        />
      </CardContent>
    </Card>
  );
};

export default DailyExpenseCalendar;
