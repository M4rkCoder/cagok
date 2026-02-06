import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const chartConfig = {
  total_amount: {
    label: "지출액",
    color: "#2563eb", // 단일 브랜드 컬러로 통일 (UX 최적화)
  },
} satisfies ChartConfig;

export default function WeeklyChart(lang: "ko" | "en") {
  const { daily7Expenses: dailyExpenses } = useDashboardStore();
  const formatDateWithDay = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const dayNames =
      lang === "ko"
        ? ["일", "월", "화", "수", "목", "금", "토"]
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `${date.getMonth() + 1}.${date.getDate()}(${dayNames[date.getDay()]})`;
  };

  const chartData = (dailyExpenses || []).map((item) => ({
    ...item,
    displayDate: formatDateWithDay(item.date),
  }));

  return (
    <div className="space-y-4 flex flex-col">
      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
        일주일 지출
      </h4>
      <div className="flex-1 min-h-[180px] w-full flex items-end">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
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
                fontSize={10}
                tick={{ fill: "#94a3b8", fontWeight: 500 }}
              />
              <ChartTooltip
                cursor={{ fill: "#f1f5f9", opacity: 0.4 }}
                content={<ChartTooltipContent hideIndicator />}
              />
              <Bar
                dataKey="total_amount"
                radius={[4, 4, 0, 0]}
                barSize={25}
                fill="#2563eb"
                fillOpacity={0.8}
                className="transition-all duration-300 cursor-pointer hover:fill-opacity-100"
                activeBar={{
                  fillOpacity: 1,
                  stroke: "#2563eb",
                  strokeWidth: 1,
                }}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-medium">
            데이터 로딩 중...
          </div>
        )}
      </div>
    </div>
  );
}
