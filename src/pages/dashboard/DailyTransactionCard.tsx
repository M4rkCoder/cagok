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
import { useDashboardStore } from "@/stores/useDashboardStore";
import { getThemeColor } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // shadcn/ui 탭 사용 가정
import CategoryTransactionChart from "./components/CategoryTransactionChart";
import { DashboardTitle } from "./components/DashboardTitle";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useDateFormatter } from "@/hooks/useDateFormatter";

import { useTranslation } from "react-i18next";

type ViewMode = "expense" | "income";

export default function DailyTransactionCard() {
  const { t } = useTranslation();
  const {
    selectedMonth,
    dailyCategoryExpenses,
    categoriesExpense,
    dailyCategoryIncomes,
    categoriesIncome,
    loadChartDetail,
    openDialog,
  } = useDashboardStore();

  const { formatAmount } = useCurrencyFormatter();
  const { formatDay } = useDateFormatter();

  const [viewMode, setViewMode] = useState<ViewMode>("expense");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const handleDateClick = (date: string) => {
    const txType = viewMode === "expense" ? 1 : 0;
    const catId =
      selectedCategoryId === "all" ? null : parseInt(selectedCategoryId);
    console.log(date, "viewMode:", viewMode, txType, catId);
    openDialog(date, txType, catId);

    loadChartDetail(date, txType, catId);
  };

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
      name: t("common.all"),
      color: getThemeColor(viewMode),
    };
    return config;
  }, [currentCategories, viewMode, t]);

  // 3. 데이터 가공
  const chartData = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const lastDate = new Date(year, month, 0).getDate();
    const data = [];

    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, "0")}`;
      const dayData: any = {
        date: dateStr,
        displayDate: formatDay(dateStr),
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
  }, [selectedMonth, currentDailyData, formatDay]);

  const hasData = useMemo(
    () => chartData.some((d) => d.total > 0),
    [chartData],
  );

  // 탭 변경 시 선택된 카테고리 초기화
  const handleTabChange = (value: string) => {
    setViewMode(value as ViewMode);
    setSelectedCategoryId("all");
  };

  return (
    <Card className="pt-4 pb-0 px-5 border-none shadow-md">
      <div className="flex flex-col md:grid md:grid-cols-3 items-start gap-4">
        <div className="md:col-span-2 w-full">
          <div className="flex items-center justify-between mb-4">
            <DashboardTitle
              title={t("dashboard.cards.daily_status_title", {
                type: viewMode === "expense" ? t("common.expense") : t("common.income"),
              })}
            />

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
                  {t("common.expense")}
                </TabsTrigger>
                <TabsTrigger
                  value="income"
                  className="text-xs transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-medium"
                >
                  {t("common.income")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="h-[230px] w-full relative">
            {!hasData && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 text-slate-400 text-sm font-medium italic">
                {t("dashboard.comparison.no_data")}
              </div>
            )}
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
                    interval={3}
                    minTickGap={10}
                    className="font-bold text-slate-400"
                    tick={{ fill: "#94a3b8", fontWeight: 600 }}
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
                              {formatAmount(Number(value))}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />

                  {selectedCategoryId === "all" ? (
                    <Bar
                      dataKey="total"
                      name={viewMode === "expense" ? t("dashboard.treemap.total") : t("common.income")} // total_income?
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
            mode={viewMode}
            activeId={selectedCategoryId}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
          />
        </div>
      </div>
    </Card>
  );
}
