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
        const groupDisplayName = isFixed
          ? t("dashboard.cards.fixed_expense")
          : t("dashboard.cards.variable_expense");
        const safeChildren = group.children || [];
        const groupTotal = group.value || 0;

        const mainChildren: any[] = [];
        let etcValue = 0;

        // 1. 1% 미만 항목 "기타"로 묶기
        safeChildren.forEach((child) => {
          const ratio = (child.value || 0) / groupTotal;
          // API_TYPES의 TreemapNode 구조를 참고하여 value 기반 계산
          if (ratio < 0.01) {
            etcValue += child.value || 0;
          } else {
            mainChildren.push({
              ...child,
              percentage: ratio * 100, // 퍼센트 미리 계산
            });
          }
        });

        if (etcValue > 0) {
          mainChildren.push({
            name: t("common.other"),
            value: etcValue,
            category_icon: "📦",
            isEtc: true,
            percentage: (etcValue / groupTotal) * 100,
          });
        }

        const sortedChildren = [...mainChildren].sort(
          (a, b) => b.value - a.value
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
      .filter((group) => group.value > 0);
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

    // 너무 작은 박스는 아예 렌더링 제외
    if (!width || !height || width < 10 || height < 10) return null;

    // 💡 물리적 크기(width, height)를 기준으로 판단하도록 변경
    const area = width * height;

    // 텍스트(이름, 퍼센트)를 보여주기 위한 최소 크기 조건 (가로 45px 이상, 세로 45px 이상)
    const showText = width > 50 && height > 50 && area > 2100;

    // 텍스트와 퍼센트를 모두 보여주기 위한 넉넉한 세로 공간 조건
    const showPercentage = showText && height > 70;

    // 아이콘 크기 결정 로직 (박스 면적 또는 짧은 변 기준)
    let iconSize = "24px";
    if (area < 500 || Math.min(width, height) < 30) {
      iconSize = "10px"; // 아주 작은 영역
    } else if (area < 1000 || Math.min(width, height) < 40) {
      iconSize = "14px"; // 중간보다 작은 영역
    } else if (showText) {
      iconSize = "18px"; // 텍스트와 함께 표시될 때의 아이콘 크기
    }

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
        {depth === 2 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill={fill.includes("90%") ? "#554400" : "#fff"}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            {/* 아이콘: showText 여부에 따라 위치 조정 */}
            <tspan
              x={x + width / 2}
              dy={showText ? "-0.6em" : "0.3em"}
              fontSize={iconSize}
              fontWeight="bold"
              className="native-emoji"
            >
              {category_icon}
            </tspan>

            {showText && (
              <>
                <tspan
                  x={x + width / 2}
                  dy="1.4em"
                  fontSize="12px"
                  fontWeight="900"
                >
                  {name}
                </tspan>
                {showPercentage && (
                  <tspan
                    x={x + width / 2}
                    dy="1.3em"
                    fontSize="10px"
                    fillOpacity={0.7}
                    fontWeight="800"
                  >
                    {percentage?.toFixed(1)}%
                  </tspan>
                )}
              </>
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
            <LegendItem
              color="bg-slate-400"
              label={t("dashboard.cards.fixed_expense")}
            />
            <LegendItem
              color="bg-orange-300"
              label={t("dashboard.cards.variable_expense")}
            />
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
  <div className="flex h-full items-center justify-center text-slate-400 text-sm font-medium italic">
    {loading
      ? t("dashboard.cards.analyzing_data")
      : t("dashboard.comparison.no_data")}
  </div>
);
