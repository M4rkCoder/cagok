import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  ComposedChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
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
import { cn } from "@/lib/utils";

interface YearlyTrendChartProps {
  data: MonthlyFinancialSummaryItem[];
  symmetricMax: number;
  formatCurrency: (amount: number) => string;
}

const chartConfig = {
  totalIncome: {
    label: "수입",

    color: "hsl(142, 71%, 45%)",

    negativeColor: "hsl(0, 70%, 95%)", // very light red
  },

  variableExpense: {
    label: "변동지출",

    color: "hsl(217, 91%, 60%)",

    negativeColor: "hsl(0, 84%, 60%)", // red
  },

  fixedExpense: {
    label: "고정지출",

    color: "hsl(217, 91%, 60%)",

    negativeColor: "hsl(0, 84%, 60%)", // red
  },

  totalExpense: {
    label: "총지출",

    color: "hsl(217, 91%, 60%)",

    negativeColor: "hsl(0, 84%, 60%)",
  },

  netIncome: {
    label: "순수입",

    color: "hsl(215, 16%, 47%)",

    negativeColor: "hsl(0, 84%, 60%)", // red
  },
} satisfies ChartConfig;

// 막대의 둥근 모서리 처리를 위한 Path 생성 함수

const getPath = (
  x: number,

  y: number,

  width: number,

  height: number,

  radius: number[],
) => {
  const [tr, tl, br, bl] = radius;

  return `

    M${x + tl},${y}

    L${x + width - tr},${y}

    C${x + width - tr},${y} ${x + width},${y} ${x + width},${y + tr}

    L${x + width},${y + height - br}

    C${x + width},${y + height - br} ${x + width},${y + height} ${x + width - br},${y + height}

    L${x + bl},${y + height}

    C${x + bl},${y + height} ${x},${y + height} ${x},${y + height - bl}

    L${x},${y + tl}

    C${x},${y + tl} ${x},${y} ${x + tl},${y}

    Z

  `;
};

// 조건부 색상 및 빗금 처리를 위한 커스텀 Shape

const CustomBarShape = (props: any) => {
  const {
    x,

    y,

    width,

    height,

    radius,

    payload,

    fillVariable,

    isStriped = false,
  } = props;

  const isNegative = payload.netIncome < 0; // Use camelCase

  const fillConfig = chartConfig[fillVariable as keyof typeof chartConfig];

  const finalFill = isNegative ? fillConfig.negativeColor : fillConfig.color;

  const path = getPath(x, y, width, height, radius);

  return (
    <g>
      <path d={path} fill={finalFill} opacity={isStriped ? 1 : 0.8} />

      {isStriped && <path d={path} fill="url(#pattern-stripe)" />}
    </g>
  );
};

export function YearlyTrendChart({

  data,

  symmetricMax,

  formatCurrency,

}: YearlyTrendChartProps) {
  const legendOrder = [
    "totalIncome",

    "variableExpense",

    "fixedExpense",

    "netIncome",
  ];

  // 고정 지출 범례 아이콘을 위한 헬퍼 컴포넌트

  const FixedExpenseLegendIcon = ({ color }: { color?: string }) => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      className="h-3 w-3 rounded-sm"
    >
      <rect width="12" height="12" fill={color} />

      <path
        d="M-3 3 L3 -3 M-3 9 L9 -3 M3 15 L15 3"
        stroke="rgba(255, 255, 255, 0.6)"
        strokeWidth="2"
      />
    </svg>
  );

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
              barGap={-20} // 막대 겹침 정도 조정
              margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
            >
              {/* 빗금 패턴 정의 */}

              <defs>
                <pattern
                  id="pattern-stripe"
                  width="6"
                  height="6"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect
                    width="2.5"
                    height="6"
                    transform="translate(0,0)"
                    fill="hsl(var(--primary-foreground) / 0.5)"
                  />
                </pattern>
              </defs>

              <CartesianGrid
                vertical={false}
                horizontal={true}
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />

              <XAxis
                dataKey="yearMonth"
                tickLine={false}
                axisLine={true}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(v) => format(new Date(v), "M월")}
                stroke="hsl(var(--muted-foreground))"
                fontSize={13}
              />

                                          <YAxis

                                            yAxisId="left"

                                            tickFormatter={(v) =>

                                              new Intl.NumberFormat("ko-KR", {

                                                notation: "compact",

                                                compactDisplay: "short",

                                              }).format(v)

                                            }

                                            tickLine={false}

                                            axisLine={false}

                                            tickMargin={8}

                                            width={60}

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
                stroke="#000"
                strokeWidth={1}
                strokeOpacity={0.5}
                strokeDasharray="3 3"
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    className="w-[200px]"
                    labelFormatter={(value) =>
                      format(new Date(value), "yyyy년 M월")
                    }
                    formatter={(
                      value,

                      name: keyof typeof chartConfig,

                      props,
                    ) => {
                      const config = chartConfig[name];

                      if (!config) return null;

                      const customName =
                        name === "fixedExpense"
                          ? "  - 고정지출"
                          : name === "variableExpense"
                            ? "총지출"
                            : config.label;

                      if (name === "variableExpense") {
                        const payload = props.payload || {};

                        const totalExpense = payload.totalExpense || 0;

                        return (
                          <div className="flex w-full items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: config.color }}
                              />

                              {customName}
                            </div>

                            <span className="font-medium text-foreground">
                              {formatCurrency(Number(totalExpense))}
                            </span>
                          </div>
                        );
                      }

                      if (name === "totalExpense") return null;

                      return (
                        <div className="flex w-full items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: config.color }}
                            />

                            {customName}
                          </div>

                          <span className="font-medium text-foreground">
                            {formatCurrency(Number(value))}
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />

              <ChartLegend
                content={() => {
                  return (
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-4">
                      {legendOrder.map((key) => {
                        const itemConfig =
                          chartConfig[key as keyof typeof chartConfig];

                        const color = itemConfig.color;

                        const label = itemConfig.label;

                        return (
                          <div
                            key={key}
                            className="flex items-center gap-2 text-sm font-medium"
                          >
                            {key === "fixedExpense" ? (
                              <FixedExpenseLegendIcon color={color} />
                            ) : key === "netIncome" ? (
                              <div className="relative flex items-center">
                                <div
                                  className="h-[2px] w-3"
                                  style={{ backgroundColor: color }}
                                />

                                <div
                                  className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                              </div>
                            ) : (
                              <div
                                className="h-3 w-3 rounded-sm"
                                style={{ backgroundColor: color }}
                              />
                            )}

                            <span className="text-muted-foreground">
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />

                                          <Bar

                                            yAxisId="left"

                                            dataKey="totalIncome"

                                            barSize={40}

                                            shape={

                                              <CustomBarShape

                                                radius={[2, 2, 2, 2]}

                                                fillVariable="totalIncome"

                                              />

                                            }

                                          />

                            

                                          <Bar

                                            yAxisId="left"

                                            dataKey="fixedExpense"

                                            stackId="expense"

                                            barSize={40}

                                            shape={

                                              <CustomBarShape

                                                radius={[0, 0, 2, 2]}

                                                fillVariable="fixedExpense"

                                                isStriped

                                              />

                                            }

                                          />

                                          <Bar

                                            yAxisId="left"

                                            dataKey="variableExpense"

                                            stackId="expense"

                                            barSize={40}

                                            shape={

                                              <CustomBarShape

                                                radius={[2, 2, 0, 0]}

                                                fillVariable="variableExpense"

                                              />

                                            }

                                          />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="netIncome"
                stroke="var(--color-netIncome)"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;

                  const isNegative = payload.netIncome < 0;

                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isNegative ? 4 : 3}
                      fill={
                        isNegative
                          ? chartConfig.netIncome.negativeColor
                          : chartConfig.netIncome.color
                      }
                    />
                  );
                }}
                activeDot={(props: any) => {
                  const { cx, cy, payload } = props;

                  const isNegative = payload.netIncome < 0;

                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isNegative ? 7 : 5}
                      fill={
                        isNegative
                          ? chartConfig.netIncome.negativeColor
                          : chartConfig.netIncome.color
                      }
                      strokeWidth={2}
                      stroke="var(--background)"
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
