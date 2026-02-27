import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Bar,
  ComposedChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { useStatisticsStore } from "@/stores/useStatisticsStore";
import { TitleText } from "./components/TitleText";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

// 색상 체계 업데이트
const chartConfig = {
  totalIncome: { label: "수입", color: "#10b981", negativeColor: "#ef4444" },
  totalExpense: { label: "총지출", color: "#ef4444", negativeColor: "#ef4444" },
  variableExpense: {
    label: "변동지출",
    color: "#2563eb",
    negativeColor: "#ef4444",
  },
  fixedExpense: {
    label: "고정지출",
    color: "#475569",
    negativeColor: "#ef4444",
  },
  netIncome: { label: "순수입", color: "#8b5cf6", negativeColor: "#ef4444" },
} satisfies ChartConfig;

const getPath = (
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number[]
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

const CustomBarShape = (props: any) => {
  const { x, y, width, height, radius, payload, fillVariable } = props;
  const isNegative = payload.netIncome < 0;
  const fillConfig = chartConfig[fillVariable as keyof typeof chartConfig];

  const finalFill =
    isNegative && fillVariable === "netIncome"
      ? fillConfig.negativeColor
      : fillConfig.color;
  const path = getPath(x, y, width, height, radius);

  return (
    <g>
      <path d={path} fill={finalFill} opacity={0.8} />
    </g>
  );
};

type ViewMode = "all" | "income" | "expense" | "netIncome";

export function YearlyTrendChart() {
  const { monthlyFinancialSummary: data } = useStatisticsStore();
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const { formatAmount } = useCurrencyFormatter();

  const tabs: { id: ViewMode; label: string }[] = [
    { id: "all", label: "전체" },
    { id: "income", label: "수입" },
    { id: "expense", label: "지출" },
    { id: "netIncome", label: "순수입" },
  ];

  const legendOrder =
    viewMode === "all"
      ? ["totalIncome", "variableExpense", "fixedExpense", "netIncome"]
      : viewMode === "income"
        ? ["totalIncome"]
        : viewMode === "expense"
          ? ["variableExpense", "fixedExpense"]
          : ["netIncome"];

  const allNetIncomes = data.map((item) => item.netIncome);
  const symmetricMax = Math.max(...allNetIncomes.map(Math.abs), 10000);

  return (
    <Card className="border-slate-200 shadow-none">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <TitleText title="연간 통계" />
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={cn(
                "px-4 py-1.5 text-xs font-bold transition-all rounded-md",
                viewMode === tab.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ComposedChart
              data={data}
              barGap={0}
              margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="yearMonth"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tickFormatter={(v) => format(new Date(v), "M월")}
                fontSize={12}
                className="font-bold text-slate-400"
                tick={{ fill: "#94a3b8", fontWeight: 600 }}
              />
              <YAxis
                yAxisId="left"
                domain={
                  viewMode === "netIncome"
                    ? [-symmetricMax, symmetricMax]
                    : [0, "auto"]
                }
                ticks={
                  viewMode === "netIncome"
                    ? [-symmetricMax, 0, symmetricMax]
                    : undefined
                }
                tickFormatter={(v) =>
                  new Intl.NumberFormat("ko-KR", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(v)
                }
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tick={{ fill: "#94a3b8", fontWeight: 600 }}
                width={60}
              />
              <YAxis
                yAxisId="right"
                domain={[-symmetricMax, symmetricMax]}
                ticks={[-symmetricMax, 0, symmetricMax]}
                orientation="right"
                hide
              />

              {(viewMode === "all" || viewMode === "netIncome") && (
                <ReferenceLine
                  yAxisId={viewMode === "all" ? "right" : "left"}
                  y={0}
                  stroke="#8b5cf6"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              )}

              <ChartTooltip
                cursor={false}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;

                  const currentData = data.find((d) => d.yearMonth === label);
                  if (!currentData) return null;

                  const tooltipItems = [
                    {
                      id: "totalIncome",
                      value: currentData.totalIncome,
                      type: "income",
                    },
                    {
                      id: "totalExpense",
                      value: currentData.totalExpense,
                      type: "expense",
                    },
                    {
                      id: "variableExpense",
                      value: currentData.variableExpense,
                      type: "expense",
                    },
                    {
                      id: "fixedExpense",
                      value: currentData.fixedExpense,
                      type: "expense",
                    },
                    {
                      id: "netIncome",
                      value: currentData.netIncome,
                      type: "netIncome",
                    },
                  ];

                  return (
                    <div className="bg-white border border-slate-200 p-0 shadow-xl rounded-2xl overflow-hidden min-w-[200px] animate-in fade-in zoom-in duration-200">
                      <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-100">
                        <p className="text-[12px] font-black text-slate-500 uppercase tracking-widest">
                          {format(new Date(label), "yyyy년 M월")} 분석
                        </p>
                      </div>

                      <div className="p-3 space-y-2.5">
                        {tooltipItems.map((item) => {
                          const config =
                            chartConfig[item.id as keyof typeof chartConfig];
                          if (!config) return null;

                          const isHighlighted =
                            viewMode === "all" ||
                            viewMode === item.type ||
                            (viewMode === "expense" &&
                              (item.id === "variableExpense" ||
                                item.id === "fixedExpense"));

                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors",
                                isHighlighted
                                  ? "bg-slate-50 border border-slate-100 shadow-sm"
                                  : "opacity-40"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: config.color }}
                                />
                                <span
                                  className={cn(
                                    "text-[11px] font-bold uppercase tracking-tighter",
                                    isHighlighted
                                      ? "text-slate-700"
                                      : "text-slate-400"
                                  )}
                                >
                                  {config.label}
                                </span>
                              </div>
                              <span
                                className={cn(
                                  "text-sm font-black tabular-nums",
                                  // 순수입이 마이너스인 경우 붉은색 표기
                                  item.id === "netIncome" &&
                                    Number(item.value) < 0
                                    ? "text-red-500"
                                    : "text-slate-900"
                                )}
                              >
                                {formatAmount(Number(item.value))}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />

              <ChartLegend
                content={() => (
                  <div className="flex flex-wrap justify-center gap-6 pt-6">
                    {legendOrder.map((key) => {
                      const config =
                        chartConfig[key as keyof typeof chartConfig];
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-sm"
                            style={{ backgroundColor: config.color }}
                          />
                          <span className="text-xs font-bold text-slate-500">
                            {config.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              />

              {(viewMode === "all" || viewMode === "income") && (
                <Bar
                  yAxisId="left"
                  dataKey="totalIncome"
                  barSize={40}
                  shape={
                    <CustomBarShape
                      fillVariable="totalIncome"
                      radius={[4, 4, 0, 0]}
                    />
                  }
                />
              )}
              {(viewMode === "all" || viewMode === "expense") && (
                <>
                  <Bar
                    yAxisId="left"
                    dataKey="fixedExpense"
                    stackId="expense"
                    barSize={40}
                    shape={
                      <CustomBarShape
                        fillVariable="fixedExpense"
                        radius={[0, 0, 4, 4]}
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
                        fillVariable="variableExpense"
                        radius={[4, 4, 0, 0]}
                      />
                    }
                  />
                </>
              )}
              {(viewMode === "all" || viewMode === "netIncome") && (
                <Line
                  yAxisId={viewMode === "netIncome" ? "left" : "right"}
                  type="monotone"
                  dataKey="netIncome"
                  stroke={chartConfig.netIncome.color}
                  strokeWidth={3}
                  dot={(dotProps: any) => {
                    const { cx, cy, payload } = dotProps;
                    const isNegative = payload.netIncome < 0;
                    return (
                      <circle
                        key={`dot-${payload.yearMonth}`}
                        cx={cx}
                        cy={cy}
                        r={isNegative ? 5 : 4}
                        fill={
                          isNegative ? "#ef4444" : chartConfig.netIncome.color
                        }
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{
                    r: 7,
                    strokeWidth: 0,
                    fill: chartConfig.netIncome.color,
                  }}
                />
              )}
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground font-medium">
            데이터가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
