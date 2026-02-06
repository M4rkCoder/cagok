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

interface CategoryChartProps {
  activeId: string; // 현재 선택된 ID만 받음
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
}

const chartConfig = {
  value: {
    label: "지출액",
  },
} satisfies ChartConfig;

export default function CategoryExpenseChart({
  activeId,
  selectedCategoryId,
  setSelectedCategoryId,
}: CategoryChartProps) {
  const { overview, categoriesExpense: categories } = useDashboardStore();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // 데이터 가공
  const chartData = React.useMemo(() => {
    return categories.map((cat, index) => {
      const lightness = 30 + index * (55 / Math.max(categories.length - 1, 1));
      return {
        ...cat,
        name: cat.category_name,
        value: cat.total_amount,
        fill: `hsl(221, 83%, ${lightness}%)`,
      };
    });
  }, [categories]);

  // 중앙 텍스트용 현재 선택된 아이템 정보
  const selectedItem = React.useMemo(
    () => chartData.find((item) => item.category_id.toString() === activeId),
    [chartData, activeId]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
        <SelectTrigger className="w-[140px] h-8 text-sm">
          <SelectValue placeholder="카테고리 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 카테고리</SelectItem>
          {categories.map((cat) => (
            <SelectItem
              key={cat.category_id}
              value={cat.category_id.toString()}
            >
              <span className="font-emoji">{cat.category_icon}</span>
              <span className="text-sm">{cat.category_name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isMounted && (overview?.total_expense ?? 0) > 0 ? (
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
                const isSelected = entry.category_id.toString() === activeId;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    // 선택된 항목만 살짝 투명도를 주거나 테두리를 표시해 가독성 확보
                    stroke={isSelected ? "#000" : "none"}
                    strokeWidth={1}
                    style={{
                      opacity: activeId === "all" || isSelected ? 1 : 0.3,
                      transition: "opacity 0.3s ease",
                    }}
                  />
                );
              })}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const isAll = activeId === "all";

                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {/* 1. 카테고리 아이콘 또는 제목 */}
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 25}
                          className="fill-muted-foreground text-lg native-emoji"
                        >
                          {selectedItem ? selectedItem.category_icon : "💰"}
                        </tspan>

                        {/* 2. 금액 표시 */}
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 5}
                          className="fill-foreground text-base font-bold"
                        >
                          {selectedItem
                            ? formatCurrency(selectedItem.value)
                            : formatCurrency(overview?.total_expense ?? 0)}
                        </tspan>

                        {/* 3. 퍼센트(%) 및 이름 */}
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 28}
                          className="fill-muted-foreground text-[12px] font-medium"
                        >
                          {selectedItem
                            ? `${selectedItem.name} (${selectedItem.percentage.toFixed(1)}%)`
                            : "총 지출(100%)"}
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
        <div className="text-slate-300 text-xs italic">데이터 없음</div>
      )}
    </div>
  );
}
