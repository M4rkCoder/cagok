import React from "react";
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
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ComposedChart, // Bar와 Line을 함께 쓸 때 권장
  ResponsiveContainer,
  Cell,
} from "recharts";
import { MonthlyFinancialSummaryItem } from "@/types";
import { format } from "date-fns";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface YearlyTrendChartProps {
  data: MonthlyFinancialSummaryItem[];
  symmetricMax: number;
  formatCurrency: (amount: number) => string;
}

// shadcn/ui 차트 설정
const chartConfig = {
  total_income: {
    label: "수입",
    color: "hsl(142, 71%, 45%)", // 초록색 (Emerald)
  },
  total_expense: {
    label: "지출",
    color: "hsl(217, 91%, 60%)", // 파란색 (Blue)
  },
  net_income: {
    label: "순수입",
    color: "hsl(215, 16%, 47%)", // 회색 (Slate/Grey)
  },
} satisfies ChartConfig;

export function YearlyTrendChart({
  data,
  symmetricMax,
  formatCurrency,
}: YearlyTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>연간 월별 추이</CardTitle>
        <CardDescription>수입/지출 비교 및 순수입 흐름</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ComposedChart
              data={data}
              barGap={-45}
              margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid
                vertical={false}
                horizontal={true}
                strokeDasharray="3 3"
                stroke="#000"
                opacity={0.2}
              />

              <XAxis
                dataKey="year_month"
                tickLine={false}
                axisLine={true}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(v) => format(new Date(v), "M월")}
                stroke="#888"
                fontSize={13}
              />

              <YAxis
                yAxisId="left"
                tickFormatter={(v) => v.toLocaleString()}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={80}
                fontSize={13}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[-symmetricMax, symmetricMax]}
                hide
              />

              <ReferenceLine
                yAxisId="right"
                y={0}
                stroke="#444"
                strokeWidth={1}
                strokeDasharray="3 3"
              />

              <ChartTooltip
                cursor={false}
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
                content={() => (
                  <div className="flex flex-wrap justify-center gap-6 pt-4">
                    {(
                      Object.keys(chartConfig) as Array<
                        keyof typeof chartConfig
                      >
                    ).map((key) => (
                      <div
                        key={key}
                        className="flex items-center gap-2 text-sm font-medium"
                      >
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: chartConfig[key].color,
                          }}
                        />
                        <span className="text-muted-foreground">
                          {chartConfig[key].label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              />

              {/* 수입 막대 (배경) */}
              <Bar
                yAxisId="left"
                dataKey="total_income"
                fill="var(--color-total_income)"
                barSize={45}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isNegative = payload.net_income < 0;
                  // 적자일 땐 연한 빨강 배경, 평소엔 테마 수입색(연하게)
                  const fill = isNegative
                    ? "#fee2e2"
                    : "var(--color-total_income)";
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={fill}
                      fillOpacity={isNegative ? 1 : 0.3}
                      rx={2}
                    />
                  );
                }}
              />

              {/* 지출 막대 (오버레이) */}
              <Bar
                yAxisId="left"
                dataKey="total_expense"
                fill="var(--color-total_expense)"
                barSize={45}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isNegative = payload.net_income < 0;
                  // 적자일 땐 강렬한 빨강, 평소엔 테마 지출색
                  const fill = isNegative
                    ? "#ef4444"
                    : "var(--color-total_expense)";
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={fill}
                      fillOpacity={0.8}
                      rx={2}
                    />
                  );
                }}
              />

              {/* 순수입 라인 (도트 포함) */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="net_income"
                stroke="var(--color-net_income)"
                strokeWidth={2}
                // 기본 상태의 점 설정
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isNegative = payload.net_income < 0;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isNegative ? 5 : 4}
                      fill={isNegative ? "#ef4444" : "var(--color-net_income)"}
                      stroke="none"
                    />
                  );
                }}
                // 마우스 오버(활성화) 상태의 점 설정
                activeDot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isNegative = payload.net_income < 0;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isNegative ? 8 : 6}
                      fill={isNegative ? "#ef4444" : "var(--color-net_income)"}
                      strokeWidth={2}
                      stroke="#fff"
                    />
                  );
                }}
              />
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            데이터가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
