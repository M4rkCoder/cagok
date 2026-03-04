import * as React from "react";
import { Pie, PieChart, Label, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useDashboardStore } from "@/stores/useDashboardStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getThemeColor } from "@/lib/utils"; // 유틸 함수 임포트
import { AllIcon } from "@/components/CategoryIcon";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useTranslation } from "react-i18next";

interface CategoryChartProps {
  mode: "expense" | "income"; // 모드 추가
  activeId: string;
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
}

export default function CategoryTransactionChart({
  mode,
  activeId,
  selectedCategoryId,
  setSelectedCategoryId,
}: CategoryChartProps) {
  const { t } = useTranslation();
  const { overview, categoriesExpense, categoriesIncome } = useDashboardStore();
  const [isMounted, setIsMounted] = React.useState(false);
  const { formatAmount } = useCurrencyFormatter();

  const chartConfig = {
    value: {
      label: t("common.amount"),
    },
  } satisfies ChartConfig;

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. 모드에 따른 데이터 소스 선택
  const categories = mode === "expense" ? categoriesExpense : categoriesIncome;
  const totalAmount =
    mode === "expense"
      ? (overview?.total_expense ?? 0)
      : (overview?.total_income ?? 0);

  const chartData = React.useMemo(() => {
    return categories.map((cat, index) => {
      const id = (cat.category_id || cat.income_category_id).toString();
      return {
        ...cat,
        id,
        name: cat.category_name,
        value: cat.total_amount,
        fill: getThemeColor(mode, index, categories.length),
      };
    });
  }, [categories, mode]);

  const selectedItem = React.useMemo(
    () => chartData.find((item) => item.id === activeId),
    [chartData, activeId]
  );

  const tooltipFormatter = (value: number, name: string, item: any) => {
    const categoryIcon =
      item.payload.category_icon || (mode === "expense" ? "💸" : "💰");

    return (
      <div className="flex items-center gap-2">
        <span className="font-emoji text-base">{categoryIcon}</span>

        <span className="text-muted-foreground">{name}</span>

        <span className="font-bold text-foreground ml-auto">
          {formatAmount(value)}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full items-center justify-between">
      <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
        <SelectTrigger className="w-[160px] h-8 text-sm">
          <SelectValue placeholder={t("transaction.select_category")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <AllIcon />
            {t("dashboard.cards.all_categories")}
          </SelectItem>
          {categories.map((cat) => {
            const id = (cat.category_id || cat.income_category_id).toString();
            return (
              <SelectItem key={id} value={id}>
                <span className="font-emoji mr-2">{cat.category_icon}</span>
                <span className="text-sm">{cat.category_name}</span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {isMounted && totalAmount > 0 ? (
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent hideLabel formatter={tooltipFormatter} />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={1}
              strokeWidth={0}
              isAnimationActive={true}
            >
              {chartData.map((entry, index) => {
                const isSelected = entry.id === activeId;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    stroke={isSelected ? "#000" : "none"}
                    strokeWidth={1}
                    style={{
                      opacity: activeId === "all" || isSelected ? 1 : 0.3,
                      transition: "opacity 0.3s ease",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedCategoryId(entry.id)}
                  />
                );
              })}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 25}
                          className="fill-muted-foreground text-lg native-emoji"
                        >
                          {selectedItem
                            ? selectedItem.category_icon
                            : mode === "expense"
                              ? "💸"
                              : "💰"}
                        </tspan>

                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 5}
                          className="fill-foreground text-base font-bold"
                        >
                          {selectedItem
                            ? formatAmount(selectedItem.value)
                            : formatAmount(totalAmount)}
                        </tspan>

                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 28}
                          className="fill-muted-foreground text-[12px] font-medium"
                        >
                          {selectedItem
                            ? `${selectedItem.name} (${selectedItem.percentage.toFixed(1)}%)`
                            : `${t("dashboard.cards.total_sum")} ${mode === "expense" ? t("common.expense") : t("common.income")} (100%)`}
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      ) : (
        <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm font-medium italic">
          {t("dashboard.comparison.no_data")}
        </div>
      )}
    </div>
  );
}
