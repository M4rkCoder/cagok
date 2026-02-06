import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useEffect, useState, useMemo } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import CategoryExpenseChart from "./CategoryExpenseChart";

interface Props {
  handleDateClick: (date: string) => void;
}

const formatDateWithDay = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}.${date.getDate()}`;
};

export default function DailyExpenseCard({ handleDateClick }: Props) {
  const { selectedMonth, dailyCategoryExpenses, categoriesExpense } =
    useDashboardStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  // 1. 색상 맵 (기존 로직 유지)
  const categoryConfig = useMemo(() => {
    const config: Record<string, { id: string; name: string; color: string }> =
      {};
    categoriesExpense.forEach((cat, index) => {
      const lightness =
        30 + index * (55 / Math.max(categoriesExpense.length - 1, 1));
      config[cat.category_name] = {
        id: cat.category_id.toString(),
        name: cat.category_name,
        color: `hsl(221, 83%, ${lightness}%)`,
      };
    });
    // 전체 보기용 단일 색상 추가
    config["total"] = { id: "all", name: "전체", color: "hsl(221, 83%, 45%)" };
    return config;
  }, [categoriesExpense]);

  // 2. 데이터 가공 (total 필드 추가)
  const chartData = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const lastDate = new Date(year, month, 0).getDate();
    const data = [];

    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, "0")}`;
      const dayData: any = {
        date: dateStr,
        displayDate: `${month}.${d}`,
        total: 0, // 전체 합산용 필드
      };

      dailyCategoryExpenses
        .filter((item) => item.date === dateStr)
        .forEach((item) => {
          const amount = item.total_amount;
          dayData[item.category_name] = amount;
          dayData.total += amount; // 날짜별 총액 누적
        });

      data.push(dayData);
    }
    return data;
  }, [selectedMonth, dailyCategoryExpenses]);

  return (
    <Card className="pt-5 pb-0 px-5">
      <div className="flex flex-col md:grid md:grid-cols-3 items-start gap-4">
        <div className="md:col-span-2 w-full">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-400">
              일일 지출 현황
            </span>
          </div>

          <div className="h-[240px] w-full">
            <ChartContainer config={categoryConfig} className="h-full w-full">
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="displayDate"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                    minTickGap={10}
                  />
                  <YAxis hide />
                  <ChartTooltip
                    cursor={{ fill: "rgba(226, 232, 240, 0.4)" }}
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <div className="flex items-center justify-between gap-8 w-full">
                            <span className="text-slate-500 text-xs">
                              {name}
                            </span>
                            <span className="font-bold text-xs">
                              {Number(value).toLocaleString()}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />

                  {/* 3. 조건부 Bar 렌더링 */}
                  {selectedCategoryId === "all" ? (
                    // 전체 카테고리일 때는 'total' 필드 하나만 단색으로 표시
                    <Bar
                      dataKey="total"
                      name="총 지출"
                      fill={categoryConfig["total"].color}
                      radius={[4, 4, 0, 0]} // 막대 상단 둥글게
                      onClick={(data) => handleDateClick(data.payload.date)}
                      className="cursor-pointer"
                    />
                  ) : (
                    // 특정 카테고리 선택 시에는 해당 카테고리만 표시
                    categoriesExpense.map((cat) => (
                      <Bar
                        key={cat.category_id}
                        dataKey={cat.category_name}
                        stackId="a"
                        fill={categoryConfig[cat.category_name].color}
                        hide={selectedCategoryId !== cat.category_id.toString()}
                        onClick={(data) => handleDateClick(data.payload.date)}
                        className="cursor-pointer"
                      />
                    ))
                  )}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        <div className="w-full h-full pl-2 hidden md:block">
          <CategoryExpenseChart
            activeId={selectedCategoryId}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
          />
        </div>
      </div>
    </Card>
  );
}
