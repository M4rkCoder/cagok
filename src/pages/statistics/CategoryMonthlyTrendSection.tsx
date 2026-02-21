import React, { useState, useMemo, memo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Category } from "@/types";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { useStatisticsStore } from "@/store/useStatisticsStore";

export const CategoryMonthlyTrendSection = memo(
  function CategoryMonthlyTrendSection() {
    const {
      baseMonth,
      categoryMonthlyAmounts,
    } = useStatisticsStore();

    const [activeType, setActiveType] = useState<"income" | "expense">(
      "expense",
    );
    const [internalCategoryId, setInternalCategoryId] = useState<number | null>(
      null,
    );
    const { categoryList: categories } = useAppStore();

    // 1. 카테고리 분리 (수입: 0, 지출: 1)
    const expenseCategories = useMemo(
      () => categories.filter((c) => c.type === 1),
      [categories],
    );
    const incomeCategories = useMemo(
      () => categories.filter((c) => c.type === 0),
      [categories],
    );
    // 현재 탭에 맞는 카테고리 목록
    const currentCategories =
      activeType === "income" ? incomeCategories : expenseCategories;

    // 2. 데이터 가공 및 차트 설정
    const { chartData, chartConfig, displayCategoryNames } = useMemo(() => {
      const config: ChartConfig = {};
      const targetCategories =
        activeType === "income" ? incomeCategories : expenseCategories;

      // 색상 및 레이블 설정
      targetCategories.forEach((cat, index) => {
        const hue = activeType === "expense" ? 221 : 142; // 지출은 파란색 계열, 수입은 초록색 계열
        const lightness =
          30 + index * (50 / Math.max(targetCategories.length - 1, 1));

        config[cat.name] = {
          label: cat.name,
          color: `hsl(${hue}, 83%, ${lightness}%)`,
        };
      });

      // 스택 순서 고정
      const fixedOrderNames = targetCategories.map((cat) => cat.name);

      // 최근 12개월 날짜 생성 로직
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

      // 월별 데이터 매핑
      const data = last12Months.map((monthObj) => {
        const row: any = { month: monthObj.label };

        // 해당 월의 데이터 중 현재 타입(수입/지출)과 일치하는 항목만 필터링
        categoryMonthlyAmounts
          .filter(
            (item) =>
              item.year_month === monthObj.key &&
              (activeType === "income" ? item.type === 0 : item.type === 1) &&
              (internalCategoryId === null || item.category_id === internalCategoryId),
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
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0 md:flex-row justify-between space-y-0">
          <div className="grid gap-1">
            <CardTitle>월별 상세 추이</CardTitle>
            <CardDescription>기준: {baseMonth} (최근 12개월)</CardDescription>
          </div>
          <div className="flex items-center gap-2 pb-4">
            <Tabs
              value={activeType}
              onValueChange={(v) => {
                setActiveType(v as "income" | "expense");
                setInternalCategoryId(null); // 타입 변경 시 필터 초기화
              }}
            >
              <TabsList className="h-10">
                <TabsTrigger
                  value="expense"
                  className="text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white"
                >
                  지출
                </TabsTrigger>
                <TabsTrigger
                  value="income"
                  className="text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white"
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
                <SelectItem value="all">전체보기</SelectItem>
                {currentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    <div className="flex items-center gap-2">
                      <CategoryIcon
                        icon={cat.icon}
                        type={cat.type as 0 | 1}
                        size="sm"
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
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.toLocaleString()}
                width={60}
                fontSize={12}
              />
              <ChartTooltip
                cursor={{ strokeWidth: 0 }}
                content={
                  <ChartTooltipContent
                    className="w-[200px]"
                    formatter={(value, name: string) => (
                      <div className="flex w-full items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: chartConfig[name]?.color,
                            }}
                          />
                          {chartConfig[name]?.label || name}
                        </div>
                        <span className="font-medium">
                          {formatCurrency(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
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
                          <span className="text-muted-foreground">
                            {chartConfig[name]?.label || name}
                          </span>
                        </div>
                      ))}
                      {hasMore && (
                        <div className="text-xs font-medium text-muted-foreground/60 italic">
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
                  fillOpacity={0.5}
                  connectNulls
                />
              ))}
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  },
);
