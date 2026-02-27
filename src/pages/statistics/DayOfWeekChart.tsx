import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { cn, getThemeColor } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AllIcon, CategoryIcon } from "@/components/CategoryIcon";
import { useStatisticsStore } from "@/stores/useStatisticsStore";
import { TitleText } from "./components/TitleText";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

import { useDateFormatter } from "@/hooks/useDateFormatter";

interface ProcessedData {
  dayName: string;
  total: number;
  count: number;
  [key: string]: string | number;
}

export const DayOfWeekChart: React.FC = () => {
  const { t } = useTranslation();
  const { formatAmount } = useCurrencyFormatter();
  const { formatDayIndex } = useDateFormatter();
  const { baseMonth } = useStatisticsStore();
  const [data, setData] = useState<DayOfWeekResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [metricType, setMetricType] = useState<"total" | "average">("total");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const fetchData = useCallback(async () => {
    if (!baseMonth) return;
    setLoading(true);
    try {
      const response = await invoke<DayOfWeekResponse>(
        "get_day_of_week_stats_command",
        { baseMonth, txType: txType === "expense" ? 1 : 0 }
      );
      setData(response);
    } catch (error) {
      toast.error(t("statistics.summary.no_data"));
      console.error("Failed to fetch day of week stats:", error);
    } finally {
      setLoading(false);
    }
  }, [baseMonth, txType, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      fill: getThemeColor(txType, index, processedCategories.length),
      percentage: grandTotal > 0 ? (cat.value / grandTotal) * 100 : 0,
    }));

    const config: ChartConfig = {};
    donutDataWithColor.forEach((cat) => {
      config[`cat_${cat.id}`] = { label: cat.name, color: cat.fill };
    });
    config["total"] = {
      label: metricType === "total" ? t("dashboard.cards.total_sum") : t("dashboard.cards.daily_avg"),
      color: getThemeColor(txType),
    };

    const groupedByDay: { [key: number]: ProcessedData } = {};
    for (let i = 0; i < 7; i++) {
      groupedByDay[i] = { dayName: formatDayIndex(i, "short"), total: 0, count: 0 };
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
  }, [data, metricType, selectedCategory, txType, t, formatDayIndex]);

  const selectedDonutItem = useMemo(() => {
    if (selectedCategory === "all") return null;
    return donutData.find((d) => d.id === selectedCategory);
  }, [donutData, selectedCategory]);

  const activeTabClass =
    "data-[state=active]:bg-slate-900 data-[state=active]:text-white shadow-sm";

  return (
    <Card
      className={cn(
        "overflow-hidden border-slate-200 shadow-none",
        loading && "animate-pulse"
      )}
    >
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col">
          <TitleText
            title={`${t("statistics.tabs.dayofweek")} ${txType === "expense" ? t("common.expense") : t("common.income")} ${t("statistics.tabs.yearly")}: ${metricType === "total" ? t("statistics.summary.yearly_total", { label: "" }).replace(t("statistics.summary.yearly_total", { label: "" }).split(" ")[0], "").trim() : t("statistics.summary.monthly_avg")}`}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              key="total"
              onClick={() => setMetricType("total")}
              className={cn(
                "px-4 py-1 text-xs font-bold transition-all rounded-md",
                metricType === "total"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t("statistics.summary.yearly_total", { label: "" }).replace(t("statistics.summary.yearly_total", { label: "" }).split(" ")[0], "").trim()}
            </button>
            <button
              key="average"
              onClick={() => setMetricType("average")}
              className={cn(
                "px-4 text-xs font-bold transition-all rounded-md",
                metricType === "average"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t("statistics.summary.monthly_avg")}
            </button>
          </div>
          <Tabs
            value={txType}
            onValueChange={(v) => {
              setTxType(v as "expense" | "income");
              setSelectedCategory("all");
            }}
            className="h-8 w-[140px]"
          >
            <TabsList className="grid w-full grid-cols-2 h-10 bg-slate-100/50">
              <TabsTrigger
                value="expense"
                className="text-xs transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold"
              >
                {t("common.expense")}
              </TabsTrigger>
              <TabsTrigger
                value="income"
                className="text-xs transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold"
              >
                {t("common.income")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px] h-8 text-[11px] bg-white border-slate-200">
              <SelectValue placeholder={t("category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <AllIcon />
                  <span>{t("common.all")}</span>
                </span>
              </SelectItem>
              {availableCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <CategoryIcon
                      icon={cat.icon}
                      type={txType === "expense" ? 1 : 0}
                      size="xs"
                    />
                    <span>{cat.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="py-4">
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-[300px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  barCategoryGap="30%"
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
                  <YAxis
                    tickFormatter={(v) =>
                      new Intl.NumberFormat("ko-KR", {
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(v)
                    }
                    width={60}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontWeight: 600 }}
                    fontSize={12}
                    className="text-slate-400"
                  />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted)/0.2)" }}
                    content={
                      <ChartTooltipContent
                        className="w-[200px]"
                        formatter={(value, name, item) => {
                          if (selectedCategory === "all" && name !== "total")
                            return null;
                          const config =
                            chartConfig[name as keyof typeof chartConfig];
                          const countLabel =
                            metricType === "total"
                              ? t("dashboard.cards.cumulative_count")
                              : t("dashboard.cards.average_count");
                          return (
                            <div className="flex flex-col gap-2 w-full">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                      backgroundColor:
                                        config?.color || item.color,
                                    }}
                                  />
                                  <span className="font-bold text-xs">
                                    {config?.label || name}
                                  </span>
                                </div>
                                <span className="font-bold text-xs">
                                  {formatAmount(Number(value))}
                                </span>
                              </div>
                              <div className="flex items-center justify-between border-t border-slate-50 pt-1.5">
                                <span className="text-slate-400 text-[10px]">
                                  {countLabel}
                                </span>
                                <span className="text-[10px] font-medium text-slate-500">{`${Number(item.payload.count).toFixed(metricType === "average" ? 1 : 0)}${t("common.unit", { defaultValue: "건" })}`}</span>
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
                        ? chartConfig["total"].color
                        : chartConfig[`cat_${selectedCategory}`]?.color
                    }
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ChartContainer>
            </div>

            <div className="flex flex-col items-center justify-center h-[300px]">
              <ChartContainer
                config={chartConfig}
                className="w-full h-full max-w-[220px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {donutData.map((entry, index) => (
                      <Cell
                        key={entry.id}
                        fill={entry.fill}
                        style={{
                          opacity:
                            selectedCategory === "all" ||
                            selectedCategory === entry.id
                              ? 1
                              : 0.3,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onClick={() =>
                          setSelectedCategory(
                            entry.id === selectedCategory ? "all" : entry.id
                          )
                        }
                      />
                    ))}
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
                                y={(viewBox.cy || 0) - 15}
                                className="fill-muted-foreground text-2xl font-emoji"
                              >
                                {selectedDonutItem
                                  ? selectedDonutItem.icon
                                  : txType === "expense"
                                    ? "💸"
                                    : "💰"}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 12}
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
                                y={(viewBox.cy || 0) + 30}
                                className="fill-muted-foreground text-[9px] font-bold"
                              >
                                {selectedDonutItem
                                  ? `${selectedDonutItem.percentage.toFixed(1)}%`
                                  : metricType === "total"
                                    ? t("dashboard.cards.total_sum")
                                    : t("dashboard.cards.weekly_avg")}
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
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
            {t("statistics.summary.no_data")}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
