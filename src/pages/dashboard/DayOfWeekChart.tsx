import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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

type ViewMode = "expense" | "income";

interface DayOfWeekChartProps {
  baseMonth: string;
  compact?: boolean;
  viewMode?: ViewMode;
}

interface ProcessedData {
  dayName: string;
  total: number;
  count: number;
  [key: string]: string | number;
}

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export const DayOfWeekChart: React.FC<DayOfWeekChartProps> = ({
  baseMonth,
  compact = false,
  viewMode = "expense",
}) => {
  const { t } = useTranslation();
  const [data, setData] = useState<DayOfWeekResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricType, setMetricType] = useState<"total" | "average">("total");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const fetchData = useCallback(async () => {
    if (!baseMonth) return;
    setLoading(true);
    try {
      const response = await invoke<DayOfWeekResponse>(
        "get_day_of_week_stats_monthly_command",
        { baseMonth, txType: viewMode === "expense" ? 1 : 0 }
      );
      setData(response);
    } catch (error) {
      toast.error("데이터를 불러오지 못했습니다.");
      console.error("Failed to fetch day of week stats:", error);
    } finally {
      setLoading(false);
    }
  }, [baseMonth, viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { 
    chartData, 
    chartConfig, 
    donutData, 
    availableCategories, 
    totalMetricValue 
  } = useMemo(() => {
    if (!data)
      return { 
        chartData: [], 
        chartConfig: {}, 
        donutData: [], 
        availableCategories: [], 
        totalMetricValue: 0
      };

    const categoryTotals = new Map<number, { name: string; icon: string; total: number; weeklyAvg: number; txCount: number }>();

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

    let processedCategories = Array.from(categoryTotals.entries()).map(([id, info]) => {
      let value = metricType === "total" ? info.total : info.weeklyAvg;
      return {
        id: String(id),
        name: info.name,
        icon: info.icon,
        value: value,
        txAvg: info.txCount > 0 ? info.total / info.txCount : 0,
        fill: "",
      };
    });

    processedCategories.sort((a, b) => b.value - a.value);
    const grandTotal = processedCategories.reduce((sum, item) => sum + item.value, 0);

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
      label: metricType === "total" ? "전체 합계" : "일평균",
      color: getThemeColor(viewMode),
    };

    const groupedByDay: { [key: number]: ProcessedData } = {};
    DAYS.forEach((day, index) => {
      groupedByDay[index] = { dayName: day, total: 0, count: 0 };
    });

    if (selectedCategory === "all") {
      data.totals.forEach((item) => {
        groupedByDay[item.dayOfWeek].total = metricType === "total" ? item.totalAmount : item.averageAmount;
        groupedByDay[item.dayOfWeek].count = metricType === "total" 
            ? item.transactionCount 
            : (item.dayCount > 0 ? item.transactionCount / item.dayCount : 0);
      });
    } else {
      const targetId = parseInt(selectedCategory);
      data.categories.filter((item) => item.categoryId === targetId).forEach((item) => {
          groupedByDay[item.dayOfWeek].total = metricType === "total" ? item.totalAmount : item.averageAmount;
          groupedByDay[item.dayOfWeek].count = metricType === "total" 
            ? item.transactionCount 
            : (item.dayCount > 0 ? item.transactionCount / item.dayCount : 0);
          groupedByDay[item.dayOfWeek][`cat_${targetId}`] = groupedByDay[item.dayOfWeek].total;
      });
    }

    return {
      chartData: Object.values(groupedByDay),
      chartConfig: config,
      donutData: donutDataWithColor,
      availableCategories: donutDataWithColor,
      totalMetricValue: grandTotal,
    };
  }, [data, metricType, selectedCategory, viewMode]);

  const selectedDonutItem = useMemo(() => {
    if (selectedCategory === "all") return null;
    return donutData.find(d => d.id === selectedCategory);
  }, [donutData, selectedCategory]);

  const activeTabClass = "data-[state=active]:bg-slate-900 data-[state=active]:text-white shadow-sm";

  const controls = (
    <div className={cn("flex items-center gap-2 w-full", compact ? "justify-between mb-2" : "justify-end")}>
      <Tabs value={metricType} onValueChange={(v) => setMetricType(v as "total" | "average")}>
        <TabsList className={cn("bg-slate-100 p-0.5", compact ? "h-6" : "h-8")}>
          <TabsTrigger value="total" className={cn(activeTabClass, compact ? "text-[10px] h-5 px-2" : "text-[10px] h-7 px-3")}>총액</TabsTrigger>
          <TabsTrigger value="average" className={cn(activeTabClass, compact ? "text-[10px] h-5 px-2" : "text-[10px] h-7 px-3")}>평균</TabsTrigger>
        </TabsList>
      </Tabs>

      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className={cn("bg-white border-slate-200", compact ? "w-[120px] h-6 text-[10px]" : "w-[140px] h-8 text-[11px]")}>
          <SelectValue placeholder="카테고리" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 flex items-center justify-center text-[8px] font-bold bg-slate-100 rounded-full text-slate-500">ALL</span>
              <span>전체</span>
            </span>
          </SelectItem>
          {availableCategories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              <div className="flex items-center gap-2">
                <span className="native-emoji text-xs">{cat.icon}</span>
                <span>{cat.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const content = (
    <>
      {!compact && (
        <div className="flex items-center justify-between py-4 border-b border-dashed">
          <div className="flex flex-col">
            <CardTitle className="text-lg font-bold">
              요일별 {viewMode === "expense" ? "지출" : "수입"} 분석
            </CardTitle>
            <CardDescription className="text-xs hidden sm:block">
              {metricType === "total" ? "총액 기준" : "평균 기준"} 요일별 소비 패턴
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
             {controls}
          </div>
        </div>
      )}
      
      {compact && (
        <div className="pt-2">
          {controls}
        </div>
      )}
      
      <CardContent className={cn("py-4", compact && "p-0")}>
        {loading ? (
          <div className={cn("flex items-center justify-center", compact ? "h-[240px]" : "h-[300px]")}>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={cn("md:col-span-2", compact ? "h-[240px] mt-1" : "h-[300px]")}>
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="dayName" tickLine={false} axisLine={false} fontSize={12} fontWeight={600} tickFormatter={(v) => `${v}요일`} />
                  <YAxis tickFormatter={(v) => new Intl.NumberFormat("ko-KR", { notation: "compact" }).format(v)} width={40} tickLine={false} axisLine={false} fontSize={10} className="text-slate-400" />
                  <ChartTooltip cursor={{ fill: 'hsl(var(--muted)/0.2)' }} content={
                    <ChartTooltipContent labelFormatter={(v) => `${v}요일`} className="w-[200px]" formatter={(value, name, item) => {
                       if (selectedCategory === "all" && name !== "total") return null;
                       const config = chartConfig[name as keyof typeof chartConfig];
                       const countLabel = metricType === "total" ? "누적 건수" : "일평균 건수";
                       return (
                        <div className="flex flex-col gap-2 w-full">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: config?.color || item.color }} />
                                    <span className="font-bold text-xs">{config?.label || name}</span>
                                </div>
                                <span className="font-bold text-xs">{formatCurrency(Number(value))}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-50 pt-1.5">
                                <span className="text-slate-400 text-[10px]">{countLabel}</span>
                                <span className="text-[10px] font-medium text-slate-500">{`${Number(item.payload.count).toFixed(metricType === "average" ? 1 : 0)}건`}</span>
                            </div>
                        </div>
                       );
                    }} />
                  } />
                  <Bar dataKey={selectedCategory === "all" ? "total" : `cat_${selectedCategory}`} fill={selectedCategory === "all" ? chartConfig["total"].color : chartConfig[`cat_${selectedCategory}`]?.color} radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ChartContainer>
            </div>

            <div className={cn("flex flex-col items-center justify-center", compact ? "h-[240px] pt-4" : "h-[300px]")}>
                <ChartContainer config={chartConfig} className="w-full h-full max-w-[220px]">
                    <PieChart>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={compact ? 50 : 60} outerRadius={compact ? 70 : 85} paddingAngle={2} strokeWidth={0}>
                            {donutData.map((entry, index) => (
                                <Cell key={entry.id} fill={entry.fill} style={{ opacity: selectedCategory === "all" || selectedCategory === entry.id ? 1 : 0.3, cursor: "pointer", transition: "all 0.2s" }} onClick={() => setSelectedCategory(entry.id === selectedCategory ? "all" : entry.id)} />
                            ))}
                            <Label content={({ viewBox }) => {
                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                    return (
                                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 15} className="fill-muted-foreground text-2xl font-emoji">{selectedDonutItem ? selectedDonutItem.icon : (viewMode === "expense" ? "💸" : "💰")}</tspan>
                                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 12} className="fill-foreground text-sm font-bold">{formatCurrency(selectedDonutItem ? (metricType === "total" ? selectedDonutItem.value : selectedDonutItem.txAvg) : totalMetricValue)}</tspan>
                                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 30} className="fill-muted-foreground text-[9px] font-bold">
                                                {selectedDonutItem ? `${selectedDonutItem.percentage.toFixed(1)}%` : metricType === "total" ? "총액 합계" : "주간 평균"}
                                            </tspan>
                                        </text>
                                    );
                                }
                                return null;
                            }} />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </div>
          </div>
        ) : (
          <div className={cn("flex items-center justify-center text-muted-foreground text-sm", compact ? "h-[240px]" : "h-[300px]")}>데이터가 없습니다.</div>
        )}
      </CardContent>
    </>
  );

  if (compact) {
    return <div className="px-1">{content}</div>;
  }

  return (
    <Card className={cn("overflow-hidden border-none shadow-sm mt-4", loading && "animate-pulse")}>
      {content}
    </Card>
  );
};
