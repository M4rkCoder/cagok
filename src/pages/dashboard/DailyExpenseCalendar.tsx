import { useMemo } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import type { DailyExpense } from "@/types/dashboard";

interface Props {
  selectedMonth: string;
  dailyExpenses: DailyExpense[];
  onDateClick: (date: string) => void;
}

export default function DailyExpenseCalendar({
  selectedMonth,
  dailyExpenses,
  onDateClick,
}: Props) {
  const expenseMap = useMemo(() => {
    return new Map(dailyExpenses.map((d) => [d.date, d.total_amount]));
  }, [dailyExpenses]);

  const maxExpense = useMemo(() => {
    return Math.max(...dailyExpenses.map((d) => d.total_amount), 0);
  }, [dailyExpenses]);

  return (
    <div className="flex justify-center items-start h-full">
      <Calendar
        month={new Date(selectedMonth + "-01")}
        locale={ko}
        onSelect={(date) => {
          if (!date) return;
          onDateClick(format(date, "yyyy-MM-dd"));
        }}
        // p-0을 통해 내부 기본 여백을 제거하고, m-0으로 외부 여백 차단
        className="p-0 m-0 border-0"
        classNames={{
          months: "flex flex-col space-y-0", // 상단 여백 제거
          month: "space-y-0", // 내부 월 간격 제거
          caption: "hidden",
          nav: "hidden",
          caption_label: "hidden",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-8 font-normal text-[10px] uppercase",
          row: "flex w-full mt-1", // 주차 간격 조절
          cell: "h-8 w-8 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
        }}
        components={{
          Day: ({ day }) => {
            const { date, displayMonth, outside } = day;

            if (outside) {
              return (
                <div className="flex items-center justify-center w-8 h-8 text-[10px] text-slate-300">
                  {date.getDate()}
                </div>
              );
            }

            const key = format(date, "yyyy-MM-dd");
            const expense = expenseMap.get(key) ?? 0;
            const intensity = maxExpense === 0 ? 0 : expense / maxExpense;
            const bgColor =
              expense === 0
                ? "transparent"
                : `rgba(37, 99, 235, ${0.1 + intensity * 0.8})`;

            return (
              <div
                onClick={() => onDateClick(key)}
                className="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer transition-colors hover:ring-2 hover:ring-blue-400 hover:ring-offset-1"
                style={{
                  backgroundColor: bgColor,
                  // 지출이 많을수록 글자색을 진하게 하거나 가독성 조절
                  color: intensity > 0.6 ? "#1e40af" : "inherit",
                  fontWeight: intensity > 0.4 ? "600" : "400",
                }}
              >
                <span className="text-[14px]">{date.getDate()}</span>
              </div>
            );
          },
        }}
      />
    </div>
  );
}
