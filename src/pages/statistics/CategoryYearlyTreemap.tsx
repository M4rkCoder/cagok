import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import { cn, getThemeColor } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStatisticsStore } from "@/stores/useStatisticsStore";
import { TitleText } from "./components/TitleText";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

interface TreemapData {
  name: string;
  value: number;
  fill: string;
  icon?: string;
  percentage: number;
  average: number;
  count: number;
  [key: string]: any;
}

export const CategoryYearlyTreemap: React.FC = () => {
  const { t } = useTranslation();
  const { formatAmount } = useCurrencyFormatter();
  const { categoryMonthlyAmounts, loading: storeLoading } =
    useStatisticsStore();
  const [viewType, setViewType] = useState<"expense" | "income">("expense");

  const treemapData = useMemo(() => {
    if (!categoryMonthlyAmounts.length) return [];

    const targetType = viewType === "expense" ? 1 : 0;
    const aggregatedData: {
      [key: string]: {
        total: number;
        icon: string;
        monthsWithData: number;
        totalCount: number;
      };
    } = {};
    let totalYearlyAmount = 0;

    categoryMonthlyAmounts.forEach((item) => {
      if (item.type === targetType) {
        if (!aggregatedData[item.category_name]) {
          aggregatedData[item.category_name] = {
            total: 0,
            icon: item.category_icon || "",
            monthsWithData: 0,
            totalCount: 0,
          };
        }
        aggregatedData[item.category_name].total += item.total_amount;
        aggregatedData[item.category_name].totalCount += item.transaction_count;

        if (item.total_amount !== 0) {
          aggregatedData[item.category_name].monthsWithData += 1;
        }
        totalYearlyAmount += item.total_amount;
      }
    });

    const allCategories = Object.entries(aggregatedData)
      .map(([name, data]) => {
        const percentage =
          totalYearlyAmount > 0 ? (data.total / totalYearlyAmount) * 100 : 0;
        const average =
          data.monthsWithData > 0 ? data.total / data.monthsWithData : 0;
        return {
          name,
          value: data.total,
          icon: data.icon,
          average,
          count: data.totalCount,
          percentage,
          type: targetType,
        };
      })
      .sort((a, b) => b.value - a.value);

    const mainCategories = allCategories.filter((item) => item.percentage >= 1);
    const lowVolumeCategories = allCategories.filter(
      (item) => item.percentage < 1
    );

    const otherTotal = lowVolumeCategories.reduce(
      (sum, item) => sum + item.value,
      0
    );
    const otherCount = lowVolumeCategories.reduce(
      (sum, item) => sum + item.count,
      0
    );

    const finalTreemapData: TreemapData[] = mainCategories.map(
      (item, index) => ({
        ...item,
        fill: getThemeColor(
          viewType === "expense" ? "expense" : "income",
          index,
          mainCategories.length + (otherTotal > 0 ? 1 : 0)
        ),
      })
    );

    if (otherTotal > 0) {
      finalTreemapData.push({
        name: t("common:other") || "기타",
        value: otherTotal,
        fill: "#94a3b8",
        percentage: (otherTotal / totalYearlyAmount) * 100,
        average: 0,
        count: otherCount,
        icon: "📦",
        type: targetType,
      });
    }

    return finalTreemapData;
  }, [categoryMonthlyAmounts, viewType, t]);

  const CustomizedTreemapContent = (props: any) => {
    const {
      depth,
      x,
      y,
      width,
      height,
      name,
      value,
      fill,
      icon,
      percentage,
      average,
      count,
    } = props;

    if (width < 35 || height < 35) {
      return (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{ fill, stroke: "#fff" }}
        />
      );
    }

    const isLarge = width > 130 && height > 110;
    const isMedium = width > 75 && height > 65;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{ fill, stroke: "#fff", strokeWidth: 1.5 }}
        />
        {depth === 1 && (
          <foreignObject x={x} y={y} width={width} height={height}>
            <div className="flex h-full w-full flex-col items-center justify-center p-1 text-center text-white leading-tight overflow-hidden">
              {/* 아이콘 크게 표시 */}
              <div
                className={cn(
                  "native-emoji drop-shadow-md",
                  isLarge
                    ? "text-2xl mb-1"
                    : isMedium
                      ? "text-lg mb-0.5"
                      : "text-sm"
                )}
              >
                {icon}
              </div>

              {/* 카테고리 이름 (중간 크기 이상일 때 줄바꿈하여 표시) */}
              {isMedium && (
                <div
                  className={cn(
                    "font-black truncate w-full px-1",
                    isLarge ? "text-sm" : "text-[10px]"
                  )}
                >
                  {name}
                </div>
              )}

              {/* 비중 및 세부 내역 (큰 크기일 때만 노출) */}
              {isLarge && (
                <div className="flex flex-col items-center mt-1 space-y-0.5">
                  <div className="bg-black/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {percentage.toFixed(1)}%{" "}
                    <span className="font-normal opacity-80">({count}건)</span>
                  </div>
                  <div className="text-[11px] font-extrabold mt-0.5">
                    {formatAmount(value)}
                  </div>
                  {average > 0 && (
                    <div className="text-[9px] opacity-70 italic font-medium">
                      {t("statistics.summary.monthly_avg")}: {formatAmount(average)}
                    </div>
                  )}
                </div>
              )}

              {/* 아주 작은 영역은 비중 수치만 아이콘 밑에 살짝 표시 */}
              {!isLarge && isMedium && (
                <div className="text-[9px] font-bold opacity-90">
                  {percentage.toFixed(1)}%
                </div>
              )}
            </div>
          </foreignObject>
        )}
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border border-slate-200 rounded-xl shadow-2xl text-xs z-50 min-w-[200px] space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <CategoryIcon
              icon={data.icon}
              size="sm"
              type={data.type as 0 | 1}
            />
            <span className="font-bold text-sm text-slate-800">
              {data.name}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">{t("statistics.summary.yearly_total", { label: "" })}</span>
              <span className="font-black text-slate-900">
                {formatAmount(data.value)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">{t("common.count", { count: 0 }).replace(/[0-9]/g, "").trim()}</span>
              <span className="font-bold text-slate-700">{t("common.count", { count: data.count })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">{t("statistics.summary.badge_labels.net_income_ratio").replace("수입", t("common.all"))}</span>
              <span className="text-blue-600 font-black bg-blue-50 px-2 py-0.5 rounded-md">
                {data.percentage.toFixed(1)}%
              </span>
            </div>
            {data.average > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                <span className="text-slate-400 font-semibold">{t("statistics.summary.monthly_avg")}</span>
                <span className="font-bold text-slate-600">
                  {formatAmount(data.average)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      className={cn(
        "overflow-hidden border-slate-200 shadow-none bg-white",
        storeLoading && "animate-pulse"
      )}
    >
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <TitleText
          title={`${viewType === "expense" ? t("common.expense") : t("common.income")} ${t("statistics.tabs.treemap")}`}
        />
        <Tabs
          value={viewType}
          onValueChange={(v) => setViewType(v as "expense" | "income")}
          className="h-8 w-[140px]"
        >
          <TabsList className="grid w-full grid-cols-2 h-8 bg-slate-100/50">
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
      </CardHeader>

      <CardContent className="h-[470px] pt-2">
        {treemapData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="value"
              aspectRatio={4 / 3}
              stroke="#fff"
              content={<CustomizedTreemapContent />}
              isAnimationActive={false} // 애니메이션 제거
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <span className="text-slate-400 font-medium">
              {t("statistics.summary.no_data")}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
