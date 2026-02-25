import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialSummaryStats, MetricStats } from "@/types";
import { cn } from "@/lib/utils";
import { LandmarkIcon, ReceiptTextIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import { useStatisticsStore } from "@/stores/useStatisticsStore";
import { TitleText } from "./components/TitleText";

const emptyMetricStats: MetricStats = {
  total: 0,
  average: 0,
  max: 0,
  min: 0,
};

const emptyFinancialSummaryStats: FinancialSummaryStats = {
  income: emptyMetricStats,
  expense: emptyMetricStats,
  netIncome: emptyMetricStats,
  fixedExpense: emptyMetricStats,
};

export function SummaryCards() {
  const { financialSummaryStats } = useStatisticsStore();
  const stats = financialSummaryStats ?? emptyFinancialSummaryStats;

  return (
    <>
      <TitleText title="수입 · 지출 요약" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CombinedVerticalCard
          title="수입"
          icon={<LandmarkIcon className="h-5 w-5 text-emerald-500" />}
          items={[
            {
              label: "수입",
              data: stats.income,
              color: "bg-emerald-500",
              textColor: "text-emerald-600",
            },
            {
              label: "순수입",
              data: stats.netIncome,
              color: "bg-violet-500",
              textColor: "text-violet-600",
            },
          ]}
          formatCurrency={formatCurrency}
          borderColor="border-slate-200"
          bgColor="bg-emerald-50/5"
        />

        <CombinedVerticalCard
          title="지출"
          icon={<ReceiptTextIcon className="h-5 w-5 text-blue-600" />}
          items={[
            {
              label: "지출",
              data: stats.expense,
              color: "bg-blue-600",
              textColor: "text-blue-600",
            },
            {
              label: "고정지출",
              data: stats.fixedExpense,
              color: "bg-slate-600",
              textColor: "text-slate-700",
            },
          ]}
          formatCurrency={formatCurrency}
          borderColor="border-slate-200"
          bgColor="bg-rose-50/5"
        />
      </div>
    </>
  );
}

function CombinedVerticalCard({
  title,
  icon,
  items,
  formatCurrency,
  borderColor,
  bgColor,
}: any) {
  const allValues = items.flatMap((i: any) => [
    i.data.min,
    i.data.max,
    i.data.average,
  ]);
  const globalMax = Math.max(...allValues);
  const globalMin = Math.min(...allValues);

  const diff = globalMax - globalMin;
  const safeDiff = diff === 0 ? 1 : diff;

  // 상하단 마커 잘림 방지를 위해 15%~85% 영역 사용 (기존보다 선을 더 길게 확보)
  const getPos = (val: number) => {
    const rawPos = ((val - globalMin) / safeDiff) * 70;
    return rawPos + 15;
  };

  return (
    <Card
      className={cn(
        "rounded-2xl border shadow-sm overflow-hidden flex flex-col",
        borderColor,
        bgColor
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-1 border-b border-dashed border-muted-foreground/10">
        <CardTitle className="text-sm font-bold opacity-80">{title}</CardTitle>
        {icon}
      </CardHeader>

      <CardContent className="flex flex-row justify-between items-stretch h-60 p-0">
        {/* 왼쪽: 금액 정보 섹션 */}
        <div className="flex-1 flex flex-col justify-around py-3 pl-8">
          {items.map((item: any) => (
            <div key={item.label} className="space-y-1">
              <p className="text-xs font-bold uppercase opacity-50">
                연간 총 {item.label}
              </p>
              <p
                className={cn(
                  "text-3xl font-black tracking-tighter leading-none",
                  item.textColor
                )}
              >
                {formatCurrency(item.data.total)}
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-xs font-bold text-slate-700 bg-slate-200 p-0.5 rounded uppercase tracking-tighter">
                  월 평균
                </span>
                <span className="text-sm font-bold text-slate-500 tracking-tight">
                  {formatCurrency(item.data.average)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 오른쪽: 선 지표 섹션 - 요청하신 대로 박스로 묶고 연한 배경 추가 */}
        <div className="flex items-center space-x-12 px-10 py-6 m-4 mr-6 bg-black/[0.03] dark:bg-white/[0.03] rounded-xl border border-white/40 shadow-inner">
          {items.map((item: any) => (
            <div
              key={item.label}
              className="flex flex-col items-center h-full relative group"
            >
              {/* 메인 세로축 */}
              <div className="relative w-1.5 h-full bg-muted/40 rounded-full overflow-visible">
                {/* 최대값 Tick */}
                <div
                  className={cn(
                    "absolute w-3.5 h-0.5 -left-[5px] rounded-full opacity-60 transition-all group-hover:opacity-100",
                    item.color
                  )}
                  style={{ bottom: `${getPos(item.data.max)}%` }}
                />

                {/* 최소값 Tick */}
                <div
                  className={cn(
                    "absolute w-3.5 h-0.5 -left-[5px] rounded-full opacity-60 transition-all group-hover:opacity-100",
                    item.color
                  )}
                  style={{ bottom: `${getPos(item.data.min)}%` }}
                />

                {/* Min-Max 범위 구역 */}
                <div
                  className={cn(
                    "absolute w-full opacity-20 transition-opacity group-hover:opacity-30",
                    item.color
                  )}
                  style={{
                    bottom: `${getPos(item.data.min)}%`,
                    height: `${getPos(item.data.max) - getPos(item.data.min)}%`,
                  }}
                />

                {/* 평균 마커 + 툴팁 */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "absolute w-6 h-2 -left-[9.5px] z-30 cursor-pointer shadow-md rounded-full transition-all hover:scale-150 active:scale-95",
                        item.color
                      )}
                      style={{
                        bottom: `${getPos(item.data.average)}%`,
                        transform: "translateY(50%)",
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    side="left"
                    sideOffset={15}
                    className="bg-slate-900 border-none p-0 shadow-2xl rounded-2xl overflow-hidden min-w-[180px]"
                  >
                    {/* 상단 헤더 */}
                    <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700/50">
                      <p className="text-sm font-black text-blue-400 uppercase tracking-widest">
                        {item.label} 상세
                      </p>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* 평균값 섹션 */}
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">
                          월 평균
                        </p>
                        <p
                          className={cn(
                            "text-xl font-black tracking-tighter tabular-nums",
                            "text-white"
                          )}
                        >
                          {formatCurrency(item.data.average)}
                        </p>
                      </div>

                      {/* 최대/최소 그리드 */}
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-700/50">
                        {/* 최대값 */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                            <p className="text-slate-400 text-xs font-black uppercase">
                              최대
                            </p>
                          </div>
                          <p className="text-xs font-bold text-slate-200 tabular-nums">
                            {formatCurrency(item.data.max)}
                          </p>
                          {item.data.maxMonth && (
                            <p className="text-xs text-slate-500 font-bold">
                              {(() => {
                                const [y, m] = item.data.maxMonth.split("-");
                                return `${y}년 ${parseInt(m, 10)}월`;
                              })()}
                            </p>
                          )}
                        </div>

                        {/* 최소값 */}
                        <div className="space-y-1 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <p className="text-slate-400 text-xs font-black uppercase">
                              최소
                            </p>
                            <div className="w-1 h-1 rounded-full bg-rose-500" />
                          </div>
                          <p className="text-xs font-bold text-slate-200 tabular-nums">
                            {formatCurrency(item.data.min)}
                          </p>
                          {item.data.minMonth && (
                            <p className="text-xs text-slate-500 font-bold">
                              {(() => {
                                const [y, m] = item.data.minMonth.split("-");
                                return `${y}년 ${parseInt(m, 10)}월`;
                              })()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* 하단 레이블 (박스 안에 맞게 위치 조정) */}
              <span className="absolute -bottom-4 text-[10px] font-black text-muted-foreground/90 uppercase tracking-tighter whitespace-nowrap">
                {item.label.split(" ")[1] || item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
