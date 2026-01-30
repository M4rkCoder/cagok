import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, Label } from "recharts";
import { useEffect, useMemo, useState } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { invoke } from "@tauri-apps/api/core";
import {
  TransactionWithCategory,
  DialogState,
  MonthlyOverview,
  CategoryExpense,
} from "@/types";
import { Dispatch, SetStateAction } from "react";

interface Props {
  selectedMonth: string;
  overview: MonthlyOverview;
  setDialogState: Dispatch<SetStateAction<DialogState>>;
  categories: CategoryExpense[];
}

const chartConfig = {
  total_amount: {
    label: "지출액",
    color: "#2563eb",
  },
} satisfies ChartConfig;

export default function CategoryExpenseCard({
  selectedMonth,
  overview,
  setDialogState,
  categories,
}: Props) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const displayCategories = useMemo(() => {
    return [...categories]
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 5);
  }, [categories]);

  // 나머지 카테고리 (필요 시 우측 컬럼에 사용 가능)
  const remainingCategories = useMemo(() => {
    return [...categories]
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(5);
  }, [categories]);

  const innerData = useMemo(() => {
    return categories.map((cat, index) => {
      const lightness = 30 + index * (55 / Math.max(categories.length - 1, 1));

      return {
        ...cat,
        name: cat.category_name,
        value: cat.total_amount,
        fill: `hsl(221, 83%, ${lightness}%)`,
        percentage: cat.percentage.toFixed(1),
        type: "category",
        icon: cat.category_icon,
      };
    });
  }, [categories]);

  const outerData = useMemo(() => {
    if (!overview) return [];
    return [
      {
        name: "고정비",
        value: overview.fixed_expense ?? 0,
        fill: "#8b5cf6",
        percentage: (overview.fixed_expense_ratio ?? 0).toFixed(1),
        type: "fixed",
        icon: "📌",
      },
      {
        name: "변동비",
        value: Math.max(
          0,
          (overview.total_expense ?? 0) - (overview.fixed_expense ?? 0)
        ),
        fill: "transparent", // 아주 연한 블루 (Blue-100)
        stroke: "transparent",
        percentage: (100 - (overview.fixed_expense_ratio ?? 0)).toFixed(1),
        type: "variable",
        icon: "💸",
      },
    ];
  }, [overview]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCategoryMonthlyClick = async (
    categoryId: number,
    categoryName: string
  ) => {
    try {
      const transactions = await invoke<TransactionWithCategory[]>(
        "get_transactions_by_month_and_category",
        {
          categoryId,
          yearMonth: selectedMonth,
        }
      );
      console.log("CATEGORY MONTHLY TRANSACTIONS:", transactions);
      setDialogState({
        open: true,
        title: `${categoryName} 내역`,
        transactions,
        showDate: true,
      });
    } catch (e) {
      console.error("카테고리별 거래 조회 실패:", e);
    }
  };

  return (
    <Card className="p-5 h-[310px] mb-2">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
        {/* [1] 차트 영역 */}
        <div className="md:col-span-5 flex flex-col h-full pr-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-slate-400 tracking-widest uppercase">
              카테고리별 지출
            </span>
          </div>

          <div className="flex-1 w-full flex flex-col items-center justify-center">
            {isMounted && overview.total_expense > 0 ? (
              <div className="relative w-full flex flex-col items-center min-h-[280px]">
                <ChartContainer
                  config={chartConfig}
                  className="h-full w-full max-w-[280px]"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          className="w-48 p-2.5 shadow-lg border border-slate-200 bg-white/98" // 너비와 그림자 살짝 축소
                          formatter={(value, name, item) => (
                            <div className="flex flex-col gap-1.5 w-full">
                              {/* 첫 번째 줄: 아이콘 + 이름 | 퍼센트 */}
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                      backgroundColor: item.payload.fill,
                                    }}
                                  />
                                  <span className="text-[14px] font-bold text-slate-700 truncate max-w-[80px] native-emoji">
                                    {item.payload.icon} {name}
                                  </span>
                                </div>
                                <span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                  {item.payload.percentage}%
                                </span>
                              </div>

                              {/* 두 번째 줄: 금액 (너무 크지 않게 적당히 강조) */}
                              <div className="flex justify-end items-baseline gap-0.5">
                                <span className="text-[11px] font-bold text-slate-500">
                                  ₩
                                </span>
                                <span className="text-md font-black text-slate-900">
                                  {Number(value).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          )}
                        />
                      }
                    />
                    {/* 내부 파이: 카테고리별 지출 */}
                    <Pie
                      data={innerData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      <Label
                        content={({ viewBox }) => {
                          const { cx, cy } = viewBox as any;
                          return (
                            <text
                              x={cx}
                              y={cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={cx}
                                y={cy - 10}
                                className="fill-slate-400 text-sm font-bold"
                              >
                                총 지출액
                              </tspan>
                              <tspan
                                x={cx}
                                y={cy + 12}
                                className="fill-slate-900 text-lg font-extrabold"
                              >
                                {formatCurrency(overview.total_expense)}
                              </tspan>
                            </text>
                          );
                        }}
                      />
                      {innerData.map((entry, index) => (
                        <Cell key={`inner-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    {/* 외부 파이: 고정/변동 지출 비율 */}
                    <Pie
                      data={outerData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={105}
                      outerRadius={115}
                      stroke="none"
                    >
                      {outerData.map((entry, index) => (
                        <Cell key={`outer-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>

                {/* 커스텀 레전드 */}
                <div className="absolute top-0 right-0 flex flex-col gap-1 items-start px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-4 h-4 rounded bg-purple-100">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                    </div>
                    <span className="text-sm text-slate-500 font-medium">
                      고정지출
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-4 h-4 rounded bg-blue-100">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                    </div>
                    <span className="text-sm text-slate-500 font-medium">
                      카테고리
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-300 text-xs italic text-center py-10">
                데이터 없음
              </div>
            )}
          </div>
        </div>

        {/* [2] 상세 내역 컬럼 1 (Top 5): md:col-span-4 (비중 33%) */}
        <div className="md:col-span-4 flex flex-col h-full pr-4">
          <div className="text-sm font-bold text-slate-400 mb-2 uppercase">
            TOP5 지출 카테고리
          </div>
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide">
            {displayCategories.length > 0 ? (
              displayCategories.map((category) => (
                <div
                  key={category.category_id}
                  className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer group"
                  onClick={() =>
                    handleCategoryMonthlyClick(
                      category.category_id,
                      category.category_name
                    )
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon
                      icon={category.category_icon}
                      type={1}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="">
                        <span className="font-extrabold text-md truncate text-slate-700">
                          {category.category_name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {category.transaction_count}건
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-slate-700">
                      {formatCurrency(category.total_amount)}
                    </div>
                    <div className="text-[12px] text-blue-500 font-medium">
                      {category.percentage.toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-300 text-[11px]">
                내역 없음
              </div>
            )}
          </div>
        </div>

        {/* [3] 추가 공간 컬럼 2: md:col-span-3 (비중 25%) */}
        <div className="md:col-span-3 flex flex-col h-full">
          <div className="text-sm font-bold text-slate-400 mb-2 uppercase">
            고정 지출 (TOP 5)
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide bg-slate-50/50 rounded-xl border border-dashed p-2">
            {/* 리스트 2번 공간: 예시로 나머지 카테고리를 넣거나 비워둘 수 있습니다. */}
            {remainingCategories.length > 0 ? (
              remainingCategories.map((category) => (
                <div
                  key={category.category_id}
                  className="flex items-center justify-between p-2 border-b border-white last:border-0 opacity-70 scale-95 origin-left"
                >
                  <div className="font-medium text-[10px] text-slate-600 truncate max-w-[60px]">
                    {category.category_name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold">
                    {formatCurrency(category.total_amount)}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-[10px] text-slate-300 italic">
                추가 공간
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
