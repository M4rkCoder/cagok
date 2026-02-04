import React, { useState, useEffect, useMemo, memo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CategoryExpense, CategoryMonthlyAmount } from "@/types";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface CategoryMonthlyTrendSectionProps {
  selectedYear: number;
  categories: CategoryExpense[];
  categoriesIncome: CategoryExpense[];
  loadCategoryMonthlyAmounts: (
    year: number,
    categoryId: number | null
  ) => Promise<void>;
  categoryMonthlyAmounts: CategoryMonthlyAmount[];
  formatCurrency: (amount: number) => string;
}

export const CategoryMonthlyTrendSection = memo(
  function CategoryMonthlyTrendSection({
    selectedYear,
    categories,
    categoriesIncome,
    loadCategoryMonthlyAmounts,
    categoryMonthlyAmounts,
    formatCurrency,
  }: CategoryMonthlyTrendSectionProps) {
    const [activeType, setActiveType] = useState<"income" | "expense">(
      "expense"
    );
    const [internalCategoryId, setInternalCategoryId] = useState<number | null>(
      null
    );

    useEffect(() => {
      loadCategoryMonthlyAmounts(selectedYear, internalCategoryId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear, internalCategoryId]);

    const currentCategories =
      activeType === "income" ? categoriesIncome : categories;

    // 1. 데이터 가공 및 색상 설정
    const { chartData, chartConfig, displayCategoryNames } = useMemo(() => {
      const config: ChartConfig = {};
      const allCategoriesForType =
        activeType === "income" ? categoriesIncome : categories;

      // 1. 색상 및 라벨 사전 생성
      allCategoriesForType.forEach((cat, index) => {
        const hue = activeType === "expense" ? 221 : 142;
        const lightness =
          30 + index * (50 / Math.max(allCategoriesForType.length - 1, 1));
        config[cat.category_name] = {
          label: cat.category_name,
          color: `hsl(${hue}, 83%, ${lightness}%)`,
        };
      });

      // 2. [가장 중요] 스택 순서를 원본 카테고리 배열의 순서로 '완전 고정'
      const fixedOrderNames = allCategoriesForType.map(
        (cat) => cat.category_name
      );
      // 3. 월별 데이터 구성
      const data = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const yearMonth = `${selectedYear}-${String(month).padStart(2, "0")}`;
        const row: any = { month: `${month}월` };

        categoryMonthlyAmounts
          .filter(
            (item) =>
              item.year_month === yearMonth &&
              (activeType === "income" ? item.type === 0 : item.type === 1)
          )
          .forEach((item) => {
            row[item.category_name] = item.total_amount;
          });

        return row;
      });

      return {
        chartData: data,
        chartConfig: config,
        displayCategoryNames: fixedOrderNames, // 필터링하지 않은 전체 순서 리스트를 보냅니다.
      };
    }, [
      categoryMonthlyAmounts,
      activeType,
      selectedYear,
      categories,
      categoriesIncome,
    ]);

    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0 md:flex-row justify-between space-y-0">
          <div className="grid gap-1">
            <CardTitle>월별 상세 추이</CardTitle>
            <CardDescription>{selectedYear}년 카테고리별 흐름</CardDescription>
          </div>
          <div className="flex items-center gap-2 pb-4">
            <Tabs
              value={activeType}
              onValueChange={(v) => {
                setActiveType(v as "income" | "expense");
                setInternalCategoryId(null);
              }}
            >
              <TabsList className="h-10">
                <TabsTrigger
                  value="expense"
                  className="text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
                >
                  지출
                </TabsTrigger>
                <TabsTrigger
                  value="income"
                  className="text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
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
                  <SelectItem
                    key={cat.category_id}
                    value={cat.category_id.toString()}
                  >
                    <div className="flex items-center gap-2">
                      <CategoryIcon
                        icon={cat.category_icon}
                        type={cat.type as 0 | 1}
                        size="sm"
                      />
                      {cat.category_name}
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
                horizontal={true}
                strokeDasharray="3 3"
                stroke="#000"
                opacity={0.2}
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={true}
                tickMargin={8}
                minTickGap={32}
                fontSize={13}
                padding={{ left: 20, right: 20 }}
                scale="point"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.toLocaleString()}
                width={80}
                fontSize={13}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <ChartTooltip
                cursor={{
                  stroke: "hsl(var(--muted-foreground))",
                  strokeWidth: 0,
                }}
                itemSorter={(item) => 1}
                content={
                  <ChartTooltipContent
                    className="w-[200px]"
                    labelFormatter={(value) => value}
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
                        <span className="font-medium text-foreground">
                          {formatCurrency(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend
                content={() => {
                  // 1. 표시할 10개만 자르기
                  const visibleNames = displayCategoryNames.slice(0, 10);
                  const hasMore = displayCategoryNames.length > 10;

                  return (
                    <div className="flex flex-wrap justify-center gap-4 pt-4">
                      {visibleNames.map((name) => (
                        <div
                          key={name}
                          className="flex items-center gap-1.5 text-sm font-medium"
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

                      {/* 2. 10개가 넘을 경우 추가 표시 */}
                      {hasMore && (
                        <div className="text-sm font-medium text-muted-foreground/60 italic">
                          외 {displayCategoryNames.length - 10}개
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              {displayCategoryNames.map((name, index) => (
                <Area
                  key={name}
                  type="monotone" // 부드러운 곡선 효과
                  dataKey={name}
                  stackId="1" // 모든 Area에 동일한 stackId를 주어 쌓이게 함
                  stroke={chartConfig[name]?.color} // 영역 경계선 색상
                  strokeWidth={0.5}
                  fill={chartConfig[name]?.color} // 영역 내부 색상
                  fillOpacity={0.6} // 겹침을 인지할 수 있는 적절한 투명도
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
