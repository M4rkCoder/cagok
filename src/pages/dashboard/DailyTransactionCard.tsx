import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useState, useMemo } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import CategoryExpenseChart from "./CategoryTransactionChart"; // 이 컴포넌트 내부에서도 모드에 따른 처리가 필요할 수 있습니다.
import { getThemeColor } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // shadcn/ui 탭 사용 가정
import CategoryTransactionChart from "./CategoryTransactionChart";

interface Props {
  handleDateClick: (date: string) => void;
}

type ViewMode = "expense" | "income";

export default function DailyTransactionCard({ handleDateClick }: Props) {
  const {
    selectedMonth,
    dailyCategoryExpenses,
    categoriesExpense,
    dailyCategoryIncomes, // 수입 데이터 추가
    categoriesIncome, // 수입 카테고리 추가
  } = useDashboardStore();

  const [viewMode, setViewMode] = useState<ViewMode>("expense");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  // 1. 현재 모드에 따른 데이터 소스 선택
  const currentCategories =
    viewMode === "expense" ? categoriesExpense : categoriesIncome;
  const currentDailyData =
    viewMode === "expense" ? dailyCategoryExpenses : dailyCategoryIncomes;

  // 2. 색상 맵 (viewMode에 따라 동적 생성)
  const categoryConfig = useMemo(() => {
    const config: Record<string, { id: string; name: string; color: string }> =
      {};

    currentCategories.forEach((cat, index) => {
      config[cat.category_name] = {
        id: (cat.category_id || cat.income_category_id).toString(),
        name: cat.category_name,
        color: getThemeColor(viewMode, index, currentCategories.length),
      };
    });

    config["total"] = {
      id: "all",
      name: "전체",
      color: getThemeColor(viewMode),
    };
    return config;
  }, [currentCategories, viewMode]);

  // 3. 데이터 가공
  const chartData = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const lastDate = new Date(year, month, 0).getDate();
    const data = [];

    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, "0")}`;
      const dayData: any = {
        date: dateStr,
        displayDate: `${month}.${d}`,
        total: 0,
      };

      currentDailyData
        .filter((item) => item.date === dateStr)
        .forEach((item) => {
          const amount = item.total_amount;
          dayData[item.category_name] = amount;
          dayData.total += amount;
        });

      data.push(dayData);
    }
    return data;
  }, [selectedMonth, currentDailyData]);

  // 탭 변경 시 선택된 카테고리 초기화
  const handleTabChange = (value: string) => {
    setViewMode(value as ViewMode);
    setSelectedCategoryId("all");
  };

  return (
    <Card className="pt-5 pb-0 px-5">
      <div className="flex flex-col md:grid md:grid-cols-3 items-start gap-4">
        <div className="md:col-span-2 w-full">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-400">
              일일 {viewMode === "expense" ? "지출" : "수입"} 현황
            </span>

            {/* 지출/수입 전환 탭 */}
            <Tabs
              value={viewMode}
              onValueChange={handleTabChange}
              className="h-8 w-[140px]"
            >
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger
                  value="expense"
                  className="text-xs transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white font-medium"
                >
                  지출
                </TabsTrigger>
                <TabsTrigger
                  value="income"
                  className="text-xs transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-medium"
                >
                  수입
                </TabsTrigger>
              </TabsList>
            </Tabs>
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
                              {Number(value).toLocaleString()}원
                            </span>
                          </div>
                        )}
                      />
                    }
                  />

                  {selectedCategoryId === "all" ? (
                    <Bar
                      dataKey="total"
                      name={viewMode === "expense" ? "총 지출" : "총 수입"}
                      fill={categoryConfig["total"].color}
                      radius={[4, 4, 0, 0]}
                      onClick={(data) => handleDateClick(data.payload.date)}
                      className="cursor-pointer"
                    />
                  ) : (
                    currentCategories.map((cat) => (
                      <Bar
                        key={cat.category_id || cat.income_category_id}
                        dataKey={cat.category_name}
                        stackId="a"
                        fill={categoryConfig[cat.category_name]?.color}
                        hide={
                          selectedCategoryId !==
                          (cat.category_id || cat.income_category_id).toString()
                        }
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
          <CategoryTransactionChart
            mode={viewMode} // 모드 전달 (해당 컴포넌트에서 수입/지출 카테고리 목록을 렌더링하도록 수정 필요)
            activeId={selectedCategoryId}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
          />
        </div>
      </div>
    </Card>
  );
}
