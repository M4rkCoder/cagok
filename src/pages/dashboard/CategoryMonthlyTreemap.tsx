import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "@/store/useDashboardStore";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { CategoryExpense } from "@/types";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
};

const COLORS = [
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#2563eb",
  "#1d4ed8",
  "#1e40af",
  "#1e3a8a",
];

export const CategoryMonthlyTreemap: React.FC = () => {
  const { t } = useTranslation();
  const { selectedMonth, categoriesExpense, loading } = useDashboardStore();
  console.log(categoriesExpense);
  const treemapData = useMemo(() => {
    if (!categoriesExpense || categoriesExpense.length === 0) return [];

    const totalAmount = categoriesExpense.reduce(
      (sum, item) => sum + item.total_amount,
      0
    );

    const sorted = [...categoriesExpense].sort(
      (a, b) => b.total_amount - a.total_amount
    );

    const topCount = 6;
    const topCategories = sorted.slice(0, topCount);
    const others = sorted.slice(topCount);

    const finalData = topCategories.map((item, index) => ({
      name: item.category_name,
      value: item.total_amount,
      icon: item.category_icon,
      fill: COLORS[index % COLORS.length],
      percentage:
        totalAmount > 0
          ? ((item.total_amount / totalAmount) * 100).toFixed(1)
          : 0,
    }));

    if (others.length > 0) {
      const othersSum = others.reduce(
        (sum, item) => sum + item.total_amount,
        0
      );
      finalData.push({
        name: t("common:other") || "기타",
        value: othersSum,
        icon: "📦",
        fill: "#94a3b8",
        percentage:
          totalAmount > 0 ? ((othersSum / totalAmount) * 100).toFixed(1) : 0,
      });
    }

    return finalData;
  }, [categoriesExpense, t]);

  const CustomizedTreemapContent = (props: any) => {
    const { x, y, width, height, name, value, fill, icon } = props;
    if (width < 60 || height < 40)
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
          style={{ fill, stroke: "#fff", strokeWidth: 1 }}
        />
        <text
          x={x + width / 2}
          y={y + height / 2 - 4}
          textAnchor="middle"
          fill="#fff"
          fontSize={width < 100 ? 11 : 13}
          className="font-emoji"
        >
          {icon} {name}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 14}
          textAnchor="middle"
          fill="rgba(255,255,255,0.9)"
          fontSize={width < 100 ? 10 : 11}
        >
          {formatCurrency(value)}
        </text>
      </g>
    );
  };

  return (
    <div className={"space-y-4 flex flex-col"}>
      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
        카테고리 지출
      </h4>
      <div className="h-[200px] w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-400">
            {t("common:loading")}...
          </div>
        ) : treemapData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="value"
              stroke="#fff"
              content={<CustomizedTreemapContent />}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 shadow-lg border rounded-md text-xs">
                        <p className="font-bold">
                          {data.icon} {data.name}
                        </p>
                        <p className="text-blue-600 font-semibold">
                          {formatCurrency(data.value)}
                        </p>
                        <p className="text-slate-400">{data.percentage}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-slate-400 text-sm gap-2">
            <span className="text-3xl">Empty</span>
            <p className="italic">{t("common:noDataAvailable")}</p>
          </div>
        )}
      </div>
    </div>
  );
};
