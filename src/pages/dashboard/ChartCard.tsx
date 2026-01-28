import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useDashboard } from "@/hooks/useDashboard";
import { useEffect, useState } from "react";

interface Props {
  selectedMonth: string;
  handleDateClick: (date: string) => void;
}

const chartConfig = {
  total_amount: {
    label: "지출액",
    color: "#2563eb", // 단일 브랜드 컬러로 통일 (UX 최적화)
  },
} satisfies ChartConfig;

const formatDateWithDay = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}.${date.getDate()}(${dayNames[date.getDay()]})`;
};

export default function ChartCard({ selectedMonth, handleDateClick }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { dailyExpenses } = useDashboard(selectedMonth);

  const dailyChartData = (dailyExpenses || []).map((item) => ({
    ...item,
    displayDate: formatDateWithDay(item.date),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>일일 지출</CardTitle>
      </CardHeader>
      <CardContent className="h-[200px] min-h-[200px] w-full">
        {isMounted && dailyChartData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            style={{ height: "200px" }}
            className="w-full aspect-none"
          >
            <BarChart
              data={dailyChartData}
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
              <YAxis hide domain={[0, "auto"]} />
              {/* Y축 숨김. 필요시 visible로 변경 */}
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideIndicator />}
              />
              <Bar
                dataKey="total_amount"
                radius={[4, 4, 0, 0]}
                barSize={25}
                fill="var(--color-total_amount)"
                fillOpacity={0.6}
                className="transition-all duration-300 cursor-pointer hover:fill-opacity-100"
                activeBar={{
                  fillOpacity: 1,
                  stroke: "var(--color-total_amount)",
                  strokeWidth: 1,
                }}
                onClick={(data) => handleDateClick(data.payload.date)}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-gray-400">
            데이터가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
