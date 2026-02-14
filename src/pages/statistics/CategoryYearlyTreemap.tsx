import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import { CategoryMonthlyAmount } from "@/types";
import { cn, getThemeColor } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
};

interface CategoryYearlyTreemapProps {
  baseMonth: string;
}

interface TreemapData {
  name: string;
  value: number; // total amount
  fill: string;
  icon?: string;
  percentage: number;
  average: number;
  count: number;
  [key: string]: any;
}

export const CategoryYearlyTreemap: React.FC<CategoryYearlyTreemapProps> = ({
  baseMonth,
}) => {
  const { t } = useTranslation();
  const [treemapData, setTreemapData] = useState<TreemapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<"expense" | "income">("expense");

  const fetchCategoryYearlyAmounts = useCallback(async () => {
    if (!baseMonth) return;

    setLoading(true);
    try {
      const response = await invoke<CategoryMonthlyAmount[]>(
        "get_monthly_category_amounts_command",
        { baseMonth, categoryId: null }
      );

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

      // 데이터 집계
      response.forEach((item) => {
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

      // 정렬 및 데이터 가공
      let sortedCategories = Object.entries(aggregatedData)
        .sort(([, dataA], [, dataB]) => dataB.total - dataA.total)
        .map(([name, data]) => {
          const average =
            data.monthsWithData > 0 ? data.total / data.monthsWithData : 0;
          return {
            name,
            value: data.total,
            icon: data.icon,
            average,
            count: data.totalCount,
          };
        });

      const totalCategoriesCount = sortedCategories.length;
      
      const topCategories = sortedCategories.slice(0, 7);
      const otherCategories = sortedCategories.slice(7);
      
      const otherTotal = otherCategories.reduce((sum, item) => sum + item.value, 0);
      const otherCount = otherCategories.reduce((sum, item) => sum + item.count, 0);

      const finalTreemapData: TreemapData[] = topCategories.map(
        (item, index) => ({
          name: item.name,
          value: item.value,
          fill: getThemeColor(viewType === "expense" ? "expense" : "income", index, totalCategoriesCount),
          icon: item.icon,
          percentage:
            totalYearlyAmount > 0
              ? (item.value / totalYearlyAmount) * 100
              : 0,
          average: item.average,
          count: item.count,
        })
      );

      if (otherTotal > 0) {
        finalTreemapData.push({
          name: t("common:other") || "기타",
          value: otherTotal,
          fill: getThemeColor(viewType === "expense" ? "expense" : "income", topCategories.length, totalCategoriesCount),
          percentage:
            totalYearlyAmount > 0
              ? (otherTotal / totalYearlyAmount) * 100
              : 0,
          average: 0,
          count: otherCount,
        });
      }

      setTreemapData(finalTreemapData);
    } catch (error) {
      toast.error("데이터를 불러오지 못했습니다.");
      console.error("Failed to fetch treemap data:", error);
    } finally {
      setLoading(false);
    }
  }, [baseMonth, t, viewType]);

  useEffect(() => {
    fetchCategoryYearlyAmounts();
  }, [fetchCategoryYearlyAmounts]);

  const displayTitleDate = (() => {
    try {
      return format(parseISO(`${baseMonth}-01`), "yyyy년 M월");
    } catch {
      return baseMonth;
    }
  })();

  const CustomizedTreemapContent = (props: any) => {
    const { depth, x, y, width, height, name, value, fill, icon, percentage, average, count } = props;

    // 영역이 너무 작으면 렌더링 생략
    if (width < 60 || height < 60)
      return (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{ fill, stroke: "#fff" }}
        />
      );

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill,
            stroke: "#fff",
            strokeWidth: 2 / (depth + 1),
          }}
        />
        {depth === 1 && (
          <foreignObject x={x} y={y} width={width} height={height}>
            <div className="flex h-full w-full flex-col items-center justify-center p-1 text-center text-white overflow-hidden">
              <div className="font-bold text-sm truncate w-full">
                {icon} {name}
              </div>
              <div className="text-xs font-medium mt-1">
                {percentage.toFixed(1)}% ({count}건)
              </div>
              <div className="text-[10px] opacity-90 mt-0.5">
                총 {formatCurrency(value)}
              </div>
              {average > 0 && (
                <div className="text-[9px] opacity-80">
                  (평균 {formatCurrency(average)})
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
        <div className="bg-white p-3 border rounded shadow-lg text-sm z-50">
          <p className="font-bold mb-1">{data.icon} {data.name}</p>
          <p>총 금액: {formatCurrency(data.value)}</p>
          <p>총 건수: {data.count}건</p>
          <p>비중: {data.percentage.toFixed(1)}%</p>
          {data.average > 0 && (
            <p>월 평균: {formatCurrency(data.average)} (0원 제외)</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn("overflow-hidden", loading && "animate-pulse")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          {displayTitleDate} 기준 1년 {viewType === "expense" ? "지출" : "수입"} 분포
        </CardTitle>
        <Tabs value={viewType} onValueChange={(v) => setViewType(v as "expense" | "income")} className="w-auto">
          <TabsList className="grid w-32 grid-cols-2 h-8">
            <TabsTrigger value="expense" className="text-xs">지출</TabsTrigger>
            <TabsTrigger value="income" className="text-xs">수입</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="h-[400px]">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-muted-foreground">{t("common:loading")}</span>
          </div>
        ) : treemapData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="value"
              aspectRatio={4 / 3}
              stroke="#fff"
              content={<CustomizedTreemapContent />}
            >
               <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-muted-foreground">
              {t("common:noDataAvailable")}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
