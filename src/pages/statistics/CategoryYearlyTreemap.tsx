import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { Treemap, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import { CategoryMonthlyAmount } from "@/types"; // 경로 확인 필요
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

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
  value: number;
  fill: string;
  icon?: string;
  percentage: number;
  [key: string]: any;
}

const COLORS = [
  "#8884d8",
  "#83a6ed",
  "#8dd1e1",
  "#82ca9d",
  "#a4de6c",
  "#d0ed57",
  "#ffc658",
];

export const CategoryYearlyTreemap: React.FC<CategoryYearlyTreemapProps> = ({
  baseMonth,
}) => {
  const { t } = useTranslation();
  const [treemapData, setTreemapData] = useState<TreemapData[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. fetch 함수 수정: 의존성에서 year 제거, baseMonth 추가
  const fetchCategoryYearlyAmounts = useCallback(async () => {
    if (!baseMonth) return;

    setLoading(true);
    try {
      const response = await invoke<CategoryMonthlyAmount[]>(
        "get_monthly_category_amounts_command",
        { baseMonth, categoryId: null }
      );

      const aggregatedData: { [key: string]: { total: number; icon: string } } =
        {};
      let totalYearlyExpense = 0;

      response.forEach((item) => {
        if (item.type === 1) {
          // 지출만 합산
          if (!aggregatedData[item.category_name]) {
            aggregatedData[item.category_name] = {
              total: 0,
              icon: item.category_icon || "",
            };
          }
          aggregatedData[item.category_name].total += item.total_amount;
          totalYearlyExpense += item.total_amount;
        }
      });

      let sortedCategories = Object.entries(aggregatedData)
        .sort(([, dataA], [, dataB]) => dataB.total - dataA.total)
        .map(([name, data]) => ({ name, value: data.total, icon: data.icon }));

      const topCategories = sortedCategories.slice(0, 7);
      const otherCategoriesSum = sortedCategories
        .slice(7)
        .reduce((sum, item) => sum + item.value, 0);

      const finalTreemapData: TreemapData[] = topCategories.map(
        (item, index) => ({
          name: item.name,
          value: item.value,
          fill: COLORS[index % COLORS.length],
          icon: item.icon,
          percentage:
            totalYearlyExpense > 0
              ? (item.value / totalYearlyExpense) * 100
              : 0,
        })
      );

      if (otherCategoriesSum > 0) {
        finalTreemapData.push({
          name: t("common:other") || "기타",
          value: otherCategoriesSum,
          fill: COLORS[topCategories.length % COLORS.length],
          percentage:
            totalYearlyExpense > 0
              ? (otherCategoriesSum / totalYearlyExpense) * 100
              : 0,
        });
      }

      setTreemapData(finalTreemapData);
    } catch (error) {
      toast.error("데이터를 불러오지 못했습니다.");
      console.error("Failed to fetch treemap data:", error);
    } finally {
      setLoading(false);
    }
  }, [baseMonth, t]); // year -> baseMonth로 변경

  useEffect(() => {
    fetchCategoryYearlyAmounts();
  }, [fetchCategoryYearlyAmounts]);

  // 2. 제목에 표시할 연도/월 가공
  const displayTitleDate = (() => {
    try {
      return format(parseISO(`${baseMonth}-01`), "yyyy년 M월");
    } catch {
      return baseMonth;
    }
  })();

  const CustomizedTreemapContent = (props: any) => {
    const { depth, x, y, width, height, name, value, fill, icon } = props;

    // 너무 작은 영역에는 텍스트를 표시하지 않음
    if (width < 40 || height < 40)
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
          <>
            <text
              x={x + width / 2}
              y={y + height / 2}
              textAnchor="middle"
              fill="#fff"
              fontSize={width < 100 ? 10 : 14}
              fontWeight="bold"
            >
              {icon} {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 18}
              textAnchor="middle"
              fill="#fff"
              fontSize={width < 100 ? 9 : 12}
            >
              {formatCurrency(value)}
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <Card className={cn("overflow-hidden", loading && "animate-pulse")}>
      <CardHeader>
        <CardTitle>
          {/* year 대신 가공된 날짜 텍스트 사용 */}
          {displayTitleDate} 기준 1년 지출 분포
        </CardTitle>
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
            />
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
