import * as React from "react";
import { Pie, PieChart, Label, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useDashboardStore } from "@/store/useDashboardStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getThemeColor } from "@/lib/utils"; // 유틸 함수 임포트

interface CategoryChartProps {
  mode: "expense" | "income"; // 모드 추가
  activeId: string;
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
}

const chartConfig = {
  value: {
    label: "금액",
  },
} satisfies ChartConfig;

export default function CategoryTransactionChart({
  mode,
  activeId,
  selectedCategoryId,
  setSelectedCategoryId,
}: CategoryChartProps) {
  const { overview, categoriesExpense, categoriesIncome } = useDashboardStore();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. 모드에 따른 데이터 소스 선택
  const categories = mode === "expense" ? categoriesExpense : categoriesIncome;
  const totalAmount =
    mode === "expense"
      ? (overview?.total_expense ?? 0)
      : (overview?.total_income ?? 0);

  // 2. 데이터 가공 (유틸 함수 사용)
  const chartData = React.useMemo(() => {
    return categories.map((cat, index) => {
      // 수입/지출 각각의 ID 필드 대응
      const id = (cat.category_id || cat.income_category_id).toString();
      return {
        ...cat,
        id,
        name: cat.category_name,
        value: cat.total_amount,
        fill: getThemeColor(mode, index, categories.length), // 유틸 함수 적용
      };
    });
  }, [categories, mode]);

  // 중앙 텍스트용 선택된 아이템 정보
  const selectedItem = React.useMemo(
    () => chartData.find((item) => item.id === activeId),
    [chartData, activeId],
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-col h-full w-full items-center justify-between">
      <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
        <SelectTrigger className="w-[140px] h-8 text-sm">
          <SelectValue placeholder="카테고리 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 카테고리</SelectItem>
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
              content={<ChartTooltipContent hideLabel />}
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
                            ? formatCurrency(selectedItem.value)
                            : formatCurrency(totalAmount)}
                        </tspan>

                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 28}
                          className="fill-muted-foreground text-[12px] font-medium"
                        >
                          {selectedItem
                            ? `${selectedItem.name} (${selectedItem.percentage.toFixed(1)}%)`
                            : `총 ${mode === "expense" ? "지출" : "수입"}(100%)`}
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
        <div className="h-[250px] flex items-center justify-center text-slate-300 text-xs italic">
          데이터 없음
        </div>
      )}
    </div>
  );
}
