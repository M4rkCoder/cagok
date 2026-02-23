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
import { cn, formatCurrency } from "@/lib/utils";
import { useStatisticsStore } from "@/store/useStatisticsStore";
import { TitleText } from "./components/TitleText";

// 색상 체계 업데이트
const chartConfig = {
  totalIncome: {
    label: "수입",
    color: "#10b981", // Emerald
    negativeColor: "#ef4444",
  },
  variableExpense: {
    label: "변동지출",
    color: "#2563eb", // Blue (총지출 계열)
    negativeColor: "#ef4444",
  },
  fixedExpense: {
    label: "고정지출",
    color: "#475569", // Slate-600
    negativeColor: "#ef4444",
  },
  netIncome: {
    label: "순수입",
    color: "#8b5cf6", // Violet
    negativeColor: "#ef4444",
  },
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

  // 빗금 패턴(isStriped) 로직 제거 및 단순 색상 채우기
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
              barGap={-20}
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
                  yAxisId="left"
                  y={0}
                  stroke="#e2e8f0"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )}

              <ChartTooltip
                cursor={false}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;

                  return (
                    <div className="bg-white border border-slate-200 p-0 shadow-xl rounded-2xl overflow-hidden min-w-[180px] animate-in fade-in zoom-in duration-200">
                      {/* 툴팁 헤더: 화이트 테마에 맞춘 연한 배경 */}
                      <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-100">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {format(new Date(label), "yyyy년 M월")} 분석
                        </p>
                      </div>

                      {/* 데이터 리스트 영역 */}
                      <div className="p-3 space-y-2.5">
                        {payload.map((entry: any) => {
                          const id = entry.dataKey;
                          const config =
                            chartConfig[id as keyof typeof chartConfig];
                          if (!config) return null;

                          return (
                            <div
                              key={id}
                              className="flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-2">
                                {/* 색상 아이콘 (점) 강제 표시 */}
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: config.color }}
                                />
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                                  {config.label}
                                </span>
                              </div>
                              <span className="text-sm font-black text-slate-900 tabular-nums">
                                {formatCurrency(Number(entry.value))}
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
                  dot={{
                    r: 4,
                    fill: chartConfig.netIncome.color,
                    stroke: "#fff",
                    strokeWidth: 2,
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
