import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Label,
  Cell,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTranslation } from "react-i18next";
import { DayOfWeekResponse } from "@/types";
import { cn, getThemeColor, formatCurrency } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { AllIcon } from "@/components/CategoryIcon";
import { DashboardTitle } from "./components/DashboardTitle";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useDateFormatter } from "@/hooks/useDateFormatter";

type ViewMode = "expense" | "income";

interface ProcessedData {
  dayName: string;
  total: number;
  count: number;
  [key: string]: string | number;
}

export const DayOfWeekCard: React.FC = () => {
  const { t } = useTranslation();
  const { formatAmount } = useCurrencyFormatter();
  const { formatDayIndex } = useDateFormatter();
  const [metricType, setMetricType] = useState<"total" | "average">("total");
  const [viewMode, setViewMode] = useState<ViewMode>("expense");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const {
    selectedMonth: baseMonth,
    dayOfWeekExpense,
    dayOfWeekIncome,
  } = useDashboardStore();

  useEffect(() => {
    setSelectedCategory("all");
  }, [viewMode]);

  const data = useMemo(
    () => (viewMode === "expense" ? dayOfWeekExpense : dayOfWeekIncome),
    [viewMode, dayOfWeekExpense, dayOfWeekIncome]
  );

  const {
    chartData,
    chartConfig,
    donutData,
    availableCategories,
    totalMetricValue,
  } = useMemo(() => {
    if (!data)
      return {
        chartData: [],
        chartConfig: {},
        donutData: [],
        availableCategories: [],
        totalMetricValue: 0,
      };

    const categoryTotals = new Map<
      number,
      {
        name: string;
        icon: string;
        total: number;
        weeklyAvg: number;
        txCount: number;
      }
    >();

    data.categories.forEach((item) => {
      const existing = categoryTotals.get(item.categoryId) || {
        name: item.categoryName,
        icon: item.categoryIcon,
        total: 0,
        weeklyAvg: 0,
        txCount: 0,
      };
      existing.total += item.totalAmount;
      existing.txCount += item.transactionCount;
      const dailyAvg = item.dayCount > 0 ? item.totalAmount / item.dayCount : 0;
      existing.weeklyAvg += dailyAvg;
      categoryTotals.set(item.categoryId, existing);
    });

    let processedCategories = Array.from(categoryTotals.entries()).map(
      ([id, info]) => {
        let value = metricType === "total" ? info.total : info.weeklyAvg;
        return {
          id: String(id),
          name: info.name,
          icon: info.icon,
          value: value,
          txAvg: info.txCount > 0 ? info.total / info.txCount : 0,
          fill: "",
        };
      }
    );

    processedCategories.sort((a, b) => b.value - a.value);
    const grandTotal = processedCategories.reduce(
      (sum, item) => sum + item.value,
      0
    );

    const donutDataWithColor = processedCategories.map((cat, index) => ({
      ...cat,
      fill: getThemeColor(viewMode, index, processedCategories.length),
      percentage: grandTotal > 0 ? (cat.value / grandTotal) * 100 : 0,
    }));

    const config: ChartConfig = {};
    donutDataWithColor.forEach((cat) => {
      config[`cat_${cat.id}`] = { label: cat.name, color: cat.fill };
    });
    config["total"] = {
      label:
        metricType === "total"
          ? t("dashboard.cards.total_sum")
          : t("dashboard.cards.daily_avg"),
      color: getThemeColor(viewMode),
    };

    const groupedByDay: { [key: number]: ProcessedData } = {};
    for (let i = 0; i < 7; i++) {
      groupedByDay[i] = {
        dayName: formatDayIndex(i, "short"),
        dayIndex: i,
        total: 0,
        count: 0,
      };
    }

    if (selectedCategory === "all") {
      data.totals.forEach((item) => {
        groupedByDay[item.dayOfWeek].total =
          metricType === "total" ? item.totalAmount : item.averageAmount;
        groupedByDay[item.dayOfWeek].count =
          metricType === "total"
            ? item.transactionCount
            : item.dayCount > 0
              ? item.transactionCount / item.dayCount
              : 0;
      });
    } else {
      const targetId = parseInt(selectedCategory);
      data.categories
        .filter((item) => item.categoryId === targetId)
        .forEach((item) => {
          groupedByDay[item.dayOfWeek].total =
            metricType === "total" ? item.totalAmount : item.averageAmount;
          groupedByDay[item.dayOfWeek].count =
            metricType === "total"
              ? item.transactionCount
              : item.dayCount > 0
                ? item.transactionCount / item.dayCount
                : 0;
          groupedByDay[item.dayOfWeek][`cat_${targetId}`] =
            groupedByDay[item.dayOfWeek].total;
        });
    }

    return {
      chartData: Object.values(groupedByDay),
      chartConfig: config,
      donutData: donutDataWithColor,
      availableCategories: donutDataWithColor,
      totalMetricValue: grandTotal,
    };
  }, [data, metricType, selectedCategory, viewMode, formatDayIndex]);

  const selectedDonutItem = useMemo(() => {
    if (selectedCategory === "all") return null;
    return donutData.find((d) => d.id === selectedCategory);
  }, [donutData, selectedCategory]);

  const activeTabClass =
    "data-[state=active]:bg-slate-900 data-[state=active]:text-white shadow-sm";

  const tooltipFormatter = (value: number, name: string, item: any) => {
    const categoryIcon =
      item.payload.icon || (viewMode === "expense" ? "💸" : "💰");

    return (
      <div className="flex items-center gap-2">
        <span className="font-emoji text-base">{categoryIcon}</span>

        <span className="text-muted-foreground">{name}</span>

        <span className="font-bold text-foreground ml-auto">
          {formatAmount(value)}
        </span>
      </div>
    );
  };
  return (
    <Card className="pt-4 pb-0 px-5 border-none shadow-md bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 왼쪽: 바 차트 영역 (2/3 차지) */}
        <div className="md:col-span-2 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <DashboardTitle
              title={t("dashboard.cards.dayofweek_status_title", {
                type:
                  viewMode === "expense"
                    ? t("common.expense")
                    : t("common.income"),
              })}
            />
            {/* 바 차트 우측 상단: 지출/수입 및 총액/평균 탭 */}
            <div className="flex items-center gap-2">
              <Tabs
                value={viewMode}
                onValueChange={(v) => setViewMode(v as ViewMode)}
                className="h-8 w-[140px]"
              >
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger
                    value="expense"
                    className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    {t("common.expense")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="income"
                    className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                  >
                    {t("common.income")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Tabs
                value={metricType}
                onValueChange={(v) => setMetricType(v as "total" | "average")}
                className="h-8 w-[140px]"
              >
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger
                    value="total"
                    className={cn("text-xs", activeTabClass)}
                  >
                    {t("dashboard.cards.total_sum")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="average"
                    className={cn("text-xs", activeTabClass)}
                  >
                    {t("dashboard.cards.daily_avg")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="h-[230px] w-full flex items-center justify-center relative">
            {totalMetricValue === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 text-slate-400 text-sm font-medium italic">
                {t("dashboard.comparison.no_data")}
              </div>
            )}
            <div className="h-full w-full max-w-[600px] mx-auto">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="dayName"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    fontWeight={600}
                  />
                  <YAxis hide />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted)/0.2)" }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(v, payload) => {
                          if (payload && payload.length > 0) {
                            const dayIndex = payload[0].payload.dayIndex;
                            return formatDayIndex(dayIndex, "long");
                          }
                          return v;
                        }}
                        formatter={(value, name, item) => {
                          const config =
                            chartConfig[name as keyof typeof chartConfig];
                          return (
                            <div className="flex flex-col gap-1.5 w-[160px]">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                      backgroundColor:
                                        config?.color || (item as any).color,
                                    }}
                                  />
                                  <span className="font-bold text-xs">
                                    {config?.label || name}
                                  </span>
                                </div>
                                <span className="font-bold text-xs">
                                  {formatAmount(value)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between border-t pt-1">
                                <span className="text-slate-400 text-[10px]">
                                  {metricType === "total"
                                    ? t("dashboard.cards.cumulative_count")
                                    : t("dashboard.cards.average_count")}
                                </span>
                                <span className="text-[10px] font-medium">
                                  {t("common.count", {
                                    count: parseFloat(
                                      Number(item.payload.count).toFixed(
                                        metricType === "average" ? 1 : 0
                                      )
                                    ),
                                  })}
                                </span>
                              </div>
                            </div>
                          );
                        }}
                      />
                    }
                  />
                  <Bar
                    dataKey={
                      selectedCategory === "all"
                        ? "total"
                        : `cat_${selectedCategory}`
                    }
                    fill={
                      selectedCategory === "all"
                        ? chartConfig["total"]?.color
                        : chartConfig[`cat_${selectedCategory}`]?.color
                    }
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </div>

        {/* 오른쪽: 도넛 차트 영역 (1/3 차지) */}
        <div className="flex flex-col items-center justify-between space-y-4">
          {/* 도넛 차트 상단 중앙: 카테고리 셀렉트 */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-8 bg-white border-slate-200 w-[160px] text-sm">
              <SelectValue placeholder={t("common.category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <AllIcon />
                <span>{t("dashboard.cards.all_categories")}</span>
              </SelectItem>
              {availableCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-emoji mr-2">{cat.icon}</span>
                    <span className="text-sm">{cat.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-full w-full max-w-[200px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent hideLabel formatter={tooltipFormatter} />
                }
              />
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={1}
                strokeWidth={0}
                isAnimationActive={true}
              >
                {donutData.map((entry, index) => {
                  const isSelected = entry.id === selectedCategory;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      stroke={isSelected ? "#000" : "none"}
                      strokeWidth={1}
                      style={{
                        opacity:
                          selectedCategory === "all" || isSelected ? 1 : 0.3,
                        transition: "opacity 0.3s ease",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setSelectedCategory(
                          entry.id === selectedCategory ? "all" : entry.id
                        )
                      }
                    />
                  );
                })}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 12}
                            className="fill-muted-foreground text-2xl font-emoji"
                          >
                            {selectedDonutItem
                              ? selectedDonutItem.icon
                              : viewMode === "expense"
                                ? "💸"
                                : "💰"}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 15}
                            className="fill-foreground text-sm font-bold"
                          >
                            {formatAmount(
                              selectedDonutItem
                                ? metricType === "total"
                                  ? selectedDonutItem.value
                                  : selectedDonutItem.txAvg
                                : totalMetricValue
                            )}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 32}
                            className="fill-slate-400 text-[10px]"
                          >
                            {selectedCategory === "all"
                              ? t("dashboard.cards.total_sum")
                              : selectedDonutItem.name}
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </div>
    </Card>
  );
};
