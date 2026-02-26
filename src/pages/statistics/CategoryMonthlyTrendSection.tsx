import React, { useState, useMemo, memo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllIcon, CategoryIcon } from "@/components/CategoryIcon";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn, formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";
import { useStatisticsStore } from "@/stores/useStatisticsStore";
import { TitleText } from "./components/TitleText";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

export const CategoryMonthlyTrendSection = memo(
  function CategoryMonthlyTrendSection() {
    const { baseMonth, categoryMonthlyAmounts } = useStatisticsStore();
    const { formatAmount } = useCurrencyFormatter();

    const [activeType, setActiveType] = useState<"income" | "expense">(
      "expense"
    );
    const [internalCategoryId, setInternalCategoryId] = useState<number | null>(
      null
    );
    const { categoryList: categories } = useAppStore();

    // 1. 카테고리 분리
    const expenseCategories = useMemo(
      () => categories.filter((c) => c.type === 1),
      [categories]
    );
    const incomeCategories = useMemo(
      () => categories.filter((c) => c.type === 0),
      [categories]
    );
    const currentCategories =
      activeType === "income" ? incomeCategories : expenseCategories;

    // 2. 데이터 가공 및 차트 설정
    const { chartData, chartConfig, displayCategoryNames } = useMemo(() => {
      const config: ChartConfig = {};
      const targetCategories =
        activeType === "income" ? incomeCategories : expenseCategories;

      targetCategories.forEach((cat, index) => {
        const hue = activeType === "expense" ? 221 : 142;
        const lightness =
          30 + index * (50 / Math.max(targetCategories.length - 1, 1));

        config[cat.name] = {
          label: cat.name,
          color: `hsl(${hue}, 83%, ${lightness}%)`,
        };
      });

      const fixedOrderNames = targetCategories.map((cat) => cat.name);

      const last12Months = Array.from({ length: 12 }, (_, i) => {
        const [year, month] = baseMonth.split("-").map(Number);
        const date = new Date(year, month - 1 - (11 - i), 1);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        return {
          label: `${date.getMonth() + 1}월`,
          key: `${y}-${m}`,
        };
      });

      const data = last12Months.map((monthObj) => {
        const row: any = { month: monthObj.label };
        categoryMonthlyAmounts
          .filter(
            (item) =>
              item.year_month === monthObj.key &&
              (activeType === "income" ? item.type === 0 : item.type === 1) &&
              (internalCategoryId === null ||
                item.category_id === internalCategoryId)
          )
          .forEach((item) => {
            row[item.category_name] = item.total_amount;
          });
        return row;
      });

      return {
        chartData: data,
        chartConfig: config,
        displayCategoryNames: fixedOrderNames,
      };
    }, [
      categoryMonthlyAmounts,
      activeType,
      baseMonth,
      expenseCategories,
      incomeCategories,
      internalCategoryId,
    ]);

    return (
      <Card className="flex flex-col border-slate-200 shadow-none">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TitleText title="월별 통계" />
          <div className="flex items-center gap-2 pb-4">
            <Tabs
              value={activeType}
              onValueChange={(v) => {
                setActiveType(v as "income" | "expense");
                setInternalCategoryId(null);
              }}
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

            <Select
              value={internalCategoryId?.toString() ?? "all"}
              onValueChange={(v) =>
                setInternalCategoryId(v === "all" ? null : Number(v))
              }
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <AllIcon /> 전체 보기
                </SelectItem>
                {currentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    <div className="flex items-center gap-2">
                      <CategoryIcon
                        icon={cat.icon}
                        type={cat.type as 0 | 1}
                        size="xs"
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[350px] w-full"
          >
            <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid
                vertical={false}
                horizontal
                strokeDasharray="3 3"
                stroke="#000"
                opacity={0.1}
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={true}
                tickMargin={8}
                fontSize={12}
                tick={{ fill: "#94a3b8", fontWeight: 600 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) =>
                  new Intl.NumberFormat("ko-KR", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(v)
                }
                tick={{ fill: "#94a3b8", fontWeight: 600 }}
                width={60}
                fontSize={12}
              />
              <ChartTooltip
                cursor={false}
                content={({ active, payload, label }) => {
                  if (!active || !payload) return null;

                  // 값이 있는 데이터만 필터링 및 금액 큰 순서로 정렬
                  const validPayload = [...payload]
                    .filter((item) => Number(item.value) > 0)
                    .sort((a, b) => Number(b.value) - Number(a.value));

                  const visibleItems = validPayload.slice(0, 10);
                  const extraCount = validPayload.length - 10;

                  return (
                    <div className="rounded-lg border bg-white p-2 shadow-md w-[220px]">
                      <div className="mb-2 border-b pb-1 text-xs font-bold text-slate-500">
                        {label} 내역
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {visibleItems.map((item, index) => (
                          <div
                            key={`tooltip-${index}`}
                            className="flex items-center justify-between gap-2 text-[11px]"
                          >
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <div
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="truncate text-slate-600">
                                {chartConfig[item.name as string]?.label ||
                                  item.name}
                              </span>
                            </div>
                            <span className="font-bold tabular-nums text-slate-900">
                              {formatAmount(Number(item.value))}
                            </span>
                          </div>
                        ))}
                        {extraCount > 0 && (
                          <div className="mt-1 border-t pt-1 text-center text-[10px] italic text-slate-400">
                            외 {extraCount}개 항목 더 있음
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
              <ChartLegend
                content={() => {
                  const visibleNames = displayCategoryNames.slice(0, 10);
                  const hasMore = displayCategoryNames.length > 10;
                  return (
                    <div className="flex flex-wrap justify-center gap-4 pt-4">
                      {visibleNames.map((name) => (
                        <div
                          key={name}
                          className="flex items-center gap-1.5 text-xs font-medium"
                        >
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: chartConfig[name]?.color,
                            }}
                          />
                          <span className="text-xs font-bold text-slate-500">
                            {chartConfig[name]?.label || name}
                          </span>
                        </div>
                      ))}
                      {hasMore && (
                        <div className="text-xs font-bold text-muted-foreground/60 italic">
                          외 {displayCategoryNames.length - 10}개
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              {displayCategoryNames.map((name) => (
                <Area
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stackId="1"
                  stroke={chartConfig[name]?.color}
                  strokeWidth={1}
                  fill={chartConfig[name]?.color}
                  fillOpacity={0.4}
                  connectNulls
                />
              ))}
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }
);
