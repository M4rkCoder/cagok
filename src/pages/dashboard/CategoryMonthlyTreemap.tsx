import React, { useMemo } from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { getFixedColor, getVariableColor } from "@/lib/utils";
import { DashboardTitle } from "./components/DashboardTitle";
import { Card } from "@/components/ui/card";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useTranslation } from "react-i18next";

export const CategoryMonthlyTreemap: React.FC = () => {
  const { t } = useTranslation();
  const {
    expenseTreemap,
    loading,
    fixedVariableTransactions,
    setDetailData,
    setTreemapDialogOpen,
  } = useDashboardStore();

  const displayData = useMemo(() => {
    if (!expenseTreemap || !expenseTreemap.children) return [];

    return expenseTreemap.children
      .map((group) => {
        const isFixed = group.name === "fixed";
        const groupDisplayName = isFixed ? t("dashboard.cards.fixed_expense") : t("dashboard.cards.variable_expense");
        const safeChildren = group.children || [];
        const groupTotal = group.value || 0;

        // 1% 미만 "기타" 묶기 로직
        const mainChildren: any[] = [];
        let etcValue = 0;

        safeChildren.forEach((child) => {
          const ratio = (child.value || 0) / groupTotal;
          if (ratio < 0.01) {
            etcValue += child.value || 0;
          } else {
            mainChildren.push(child);
          }
        });

        // 기타 항목 추가 (합계가 있을 경우만)
        if (etcValue > 0) {
          mainChildren.push({
            name: t("dashboard.cards.etc"),
            value: etcValue,
            category_icon: "📦",
            isEtc: true, // 기타 항목 식별자
          });
        }

        // 금액순 정렬
        const sortedChildren = [...mainChildren].sort(
          (a, b) => (b.value || 0) - (a.value || 0)
        );
        const totalItems = sortedChildren.length;

        return {
          name: groupDisplayName,
          value: groupTotal,
          fill: isFixed ? "hsl(215, 15%, 60%)" : "hsl(35, 90%, 65%)",
          children: sortedChildren.map((child, index) => ({
            ...child,
            categoryId: child.category_id || child.id,
            groupName: groupDisplayName,
            fill: isFixed
              ? getFixedColor(index, totalItems)
              : getVariableColor(index, totalItems),
          })),
        };
      })
      .filter((group) => (group.value || 0) > 0);
  }, [expenseTreemap, t]);

  const handleNodeClick = (nodeData: any) => {
    const payload = nodeData.payload || nodeData;
    if (payload.isEtc) return; // 기타 항목은 클릭 상세 제외 (필요 시 수정)

    const categoryId = payload.categoryId;
    const groupName = payload.groupName;

    if (!categoryId || !fixedVariableTransactions) return;

    const categoryDetail = fixedVariableTransactions.find(
      (item) => item.category_id === categoryId
    );

    if (categoryDetail) {
      const isFixed = groupName === t("dashboard.cards.fixed_expense");
      setDetailData({
        items: isFixed
          ? categoryDetail.fixed_items
          : categoryDetail.variable_items,
        total_amount: isFixed
          ? categoryDetail.fixed_total
          : categoryDetail.variable_total,
        is_fixed_view: isFixed,
        categoryId: categoryId,
      });
      setTreemapDialogOpen(true);
    }
  };

  const renderCustomizedContent = (props: any) => {
    const {
      x,
      y,
      width,
      height,
      fill,
      name,
      depth,
      category_icon,
      percentage,
    } = props;
    if (!width || !height || width < 15 || height < 15) return null;

    // 2% 미만은 아이콘만, 그 이상은 텍스트 포함
    const showText = percentage >= 2;

    return (
      <g
        style={{ cursor: depth === 2 && !props.isEtc ? "pointer" : "default" }}
        onClick={(e) => {
          e.stopPropagation();
          if (depth === 2) handleNodeClick(props);
        }}
      >
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          stroke="#fff"
          strokeWidth={depth === 1 ? 4 : 1}
          fillOpacity={depth === 1 ? 0.05 : 1}
          rx={6}
        />
        {depth === 2 && width > 30 && height > 30 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill={fill.includes("90%") ? "#554400" : "#fff"}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {/* 1. 아이콘: 위치를 좀 더 위로(-0.8em) 이동 */}
            <tspan
              x={x + width / 2}
              dy={showText ? "-0.8em" : "0.3em"}
              fontSize={showText ? "18px" : "24px"}
              fontWeight="bold"
              className="native-emoji"
            >
              {category_icon}
            </tspan>

            {/* 2. 카테고리 이름: 아이콘과의 간격을 1.5em으로 벌림 */}
            {showText && (
              <tspan
                x={x + width / 2}
                dy="1.5em"
                fontSize="14px"
                fontWeight="900"
              >
                {name}
              </tspan>
            )}

            {/* 3. 퍼센트: 이름과의 간격을 1.4em으로 벌림 */}
            {showText && height > 70 && (
              <tspan
                x={x + width / 2}
                dy="1.4em"
                fontSize="13px"
                fillOpacity={0.6}
                fontWeight="800"
              >
                {percentage?.toFixed(1)}%
              </tspan>
            )}
          </text>
        )}
      </g>
    );
  };

  return (
    <Card className="pt-4 pb-0 px-5 border-none shadow-md">
      <div className="w-full h-[290px] min-2xl:h-[380px] bg-white border-none flex flex-col">
        <div className="flex justify-between items-end mb-1">
          <DashboardTitle title={t("dashboard.cards.treemap")} />
          <div className="flex gap-4 mr-4">
            <LegendItem color="bg-slate-400" label={t("dashboard.cards.fixed_expense")} />
            <LegendItem color="bg-orange-300" label={t("dashboard.cards.variable_expense")} />
          </div>
        </div>

        <div className="flex-1 w-full bg-slate-50 rounded-3xl overflow-hidden p-2">
          {displayData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={displayData}
                dataKey="value"
                content={renderCustomizedContent}
                isAnimationActive={false}
              >
                <Tooltip content={<CustomTooltip />} />
              </Treemap>
            </ResponsiveContainer>
          ) : (
            <EmptyState loading={loading} t={t} />
          )}
        </div>
      </div>
    </Card>
  );
};

// 보조 컴포넌트들
const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-3 h-3 rounded-full ${color}`} />
    <span className="text-xs font-bold text-slate-600">{label}</span>
  </div>
);

const CustomTooltip = ({ active, payload }: any) => {
  const { formatAmount } = useCurrencyFormatter();
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.depth === 1) return null;
    return (
      <div className="bg-white p-3 rounded-xl border shadow-xl flex flex-col gap-1 min-w-[150px]">
        <span className="text-[10px] font-bold text-slate-400 uppercase">
          {data.groupName}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-lg native-emoji">{data.category_icon}</span>
          <span className="text-sm font-bold text-slate-800">{data.name}</span>
        </div>
        <div className="mt-1 border-t pt-1 flex justify-between items-center text-xs font-black text-slate-700">
          <span>{formatAmount(data.value)}</span>
          <span className="text-blue-500">{data.percentage.toFixed(1)}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const EmptyState = ({ loading, t }: { loading: boolean; t: any }) => (
  <div className="flex h-full items-center justify-center text-slate-400 font-bold">
    {loading ? t("dashboard.cards.analyzing_data") : t("dashboard.cards.no_expense_this_month")}
  </div>
);
