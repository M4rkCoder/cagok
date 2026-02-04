import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { Treemap, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import { CategoryMonthlyAmount } from "@/types/dashboard";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
};

interface CategoryYearlyTreemapProps {
  year: number;
}

interface TreemapData {
  name: string;
  value: number;
  fill: string;
  icon?: string; // Optional icon for the category
  percentage: number; // Percentage of total expenses
  [key: string]: any; // Add index signature for recharts compatibility
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
  year,
}) => {
  const { t } = useTranslation();
  const [treemapData, setTreemapData] = useState<TreemapData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategoryYearlyAmounts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await invoke<CategoryMonthlyAmount[]>(
        "get_monthly_category_amounts_command",
        { year, categoryId: null },
      );

      const aggregatedData: { [key: string]: { total: number; icon: string } } =
        {};
      let totalYearlyExpense = 0;

      response.forEach((item) => {
        if (item.type === 1) {
          // Only expenses
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
        }),
      );

      if (otherCategoriesSum > 0) {
        finalTreemapData.push({
          name: t("common:other"),
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
      toast.error(t("dashboard:failedToLoadCategoryTreemap", { error }));
      console.error("Failed to fetch category monthly amounts:", error);
    } finally {
      setLoading(false);
    }
  }, [year, t]);

  useEffect(() => {
    fetchCategoryYearlyAmounts();
  }, [fetchCategoryYearlyAmounts]);

  const CustomizedTreemapContent = (props: any) => {
    const { root, depth, x, y, width, height, index, name, value, fill } =
      props;

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
            strokeOpacity: 1,
          }}
        />
        {depth === 1 ? (
          <text
            x={x + width / 2}
            y={y + height / 2 + 7}
            textAnchor="middle"
            fill="#fff"
            stroke="none"
            fontSize={14}
            fontWeight="bold"
          >
            {name}
          </text>
        ) : null}
        {depth === 1 ? (
          <text
            x={x + width / 2}
            y={y + height / 2 + 25}
            textAnchor="middle"
            fill="#fff"
            stroke="none"
            fontSize={12}
          >
            {formatCurrency(value)}
          </text>
        ) : null}
      </g>
    );
  };

  return (
    <Card className={cn(loading && "animate-pulse")}>
      <CardHeader>
        <CardTitle>
          {t("statistics:yearlyCategoryTreemapTitle", { year })}
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
              fill="#8884d8"
              content={<CustomizedTreemapContent />}
              isAnimationActive={false} // Disable animation for better performance
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
