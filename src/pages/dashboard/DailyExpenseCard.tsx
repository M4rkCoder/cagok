import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import DailyExpenseCalendar from "./DailyExpenseCalendar";
import { DailyExpense } from "@/types";

interface Props {
  selectedMonth: string;
  handleDateClick: (date: string) => void;
  dailyExpenses: DailyExpense[];
}

const chartConfig = {
  total_amount: {
    label: "지출액",
    color: "#2563eb",
  },
} satisfies ChartConfig;

const formatDateWithDay = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}.${date.getDate()}`;
};

const getAllDatesInMonth = (year: number, month: number) => {
  const dates = [];
  const lastDate = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= lastDate; day++) {
    const date = new Date(year, month, day);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    dates.push({
      date: `${yyyy}-${mm}-${dd}`,
      total_amount: 0,
    });
  }
  return dates;
};

export default function DailyExpenseCard({
  selectedMonth,
  handleDateClick,
  dailyExpenses,
}: Props) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const expenseMap = new Map(
    (dailyExpenses || []).map((item) => [item.date, item.total_amount])
  );
  const [year, month] = selectedMonth.split("-").map(Number);
  const allDates = getAllDatesInMonth(year, month - 1);

  const dailyChartData = allDates.map((day) => ({
    ...day,
    total_amount: expenseMap.get(day.date) ?? 0,
    displayDate: formatDateWithDay(day.date),
  }));

  return (
    <Card className="p-5">
      <div className="flex flex-col md:grid md:grid-cols-3 items-start">
        {/* 차트 영역 (좌측 2컬럼) */}
        <div className="md:col-span-2 w-full">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-400 tracking-widest uppercase">
              일일 지출 현황
            </span>
          </div>

          <div className="h-[230px] w-full">
            {/* 차트 높이를 약간 늘려 캘린더와 밸런스 유지 */}
            {isMounted && dailyChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailyChartData}
                    margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="displayDate"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tick={{ fill: "#94a3b8" }}
                      interval={Math.floor(dailyChartData.length / 7)} // 라벨 겹침 방지
                    />
                    <YAxis hide />
                    <ChartTooltip
                      cursor={{ fill: "#f1f5f9" }}
                      content={<ChartTooltipContent hideIndicator />}
                    />
                    <Bar
                      dataKey="total_amount"
                      radius={[4, 4, 0, 0]}
                      fill="var(--color-total_amount)"
                      fillOpacity={0.8}
                      className="cursor-pointer hover:fill-opacity-100 transition-opacity"
                      onClick={(data) => handleDateClick(data.payload.date)}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 border border-dashed rounded-lg">
                데이터가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 캘린더 영역 (우측 1컬럼) */}
        <div className="w-full pl-2 hidden md:block">
          <DailyExpenseCalendar
            selectedMonth={selectedMonth}
            dailyExpenses={dailyChartData}
            onDateClick={handleDateClick}
          />
        </div>
      </div>
    </Card>
  );
}
