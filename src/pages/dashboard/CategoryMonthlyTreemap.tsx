import React, { useMemo } from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { useDashboardStore } from "@/store/useDashboardStore";
import { getFixedColor, getVariableColor } from "@/lib/utils";

export const CategoryMonthlyTreemap: React.FC = () => {
  const { expenseTreemap, loading } = useDashboardStore();

  const displayData = useMemo(() => {
    if (!expenseTreemap?.children) return [];

    return expenseTreemap.children
      .map((group) => {
        const isFixed = group.name === "fixed";
        const children = group.children || [];
        const groupDisplayName = isFixed ? "고정 지출" : "변동 지출";

        // 금액순 정렬하여 인덱스 부여 (색상 농도 결정을 위해 정렬은 유지)
        const sortedChildren = [...children].sort(
          (a, b) => (b.value || 0) - (a.value || 0)
        );
        const totalItems = sortedChildren.length;

        return {
          name: groupDisplayName,
          value: group.value, // 백엔드에서 준 그룹 총액 사용
          fill: isFixed ? "hsl(215, 15%, 60%)" : "hsl(35, 90%, 65%)",
          children: sortedChildren.map((child, index) => ({
            ...child, // 백엔드에서 온 value, percentage 등이 모두 포함됨
            fill: isFixed
              ? getFixedColor(index, totalItems)
              : getVariableColor(index, totalItems),
            groupName: groupDisplayName,
          })),
        };
      })
      .filter((group) => group.value > 0);
  }, [expenseTreemap]);

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
      value,
      percentage,
    } = props;
    if (!width || !height || width < 5 || height < 5) return null;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          stroke="#fff"
          strokeWidth={depth === 1 ? 4 : 1}
          fillOpacity={depth === 1 ? 0.05 : 1}
          rx={4}
        />
        {depth === 2 && width > 45 && height > 35 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill={fill.includes("90%") ? "#554400" : "#fff"}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <tspan
              x={x + width / 2}
              dy="-0.2em"
              fontSize="13px"
              fontWeight="bold"
              className="font-emoji"
            >
              {`${category_icon || ""}${name}`}
            </tspan>
            {height > 55 && (
              <tspan
                x={x + width / 2}
                dy="1.5em"
                fontSize="12px"
                fillOpacity={0.9}
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
    <div className="w-full h-[380px] bg-white p-1 border-none flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-black text-slate-800">
            지출 한눈에 보기
          </h3>
        </div>
        <div className="flex gap-4 pb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-400" />
            <span className="text-xs font-bold text-slate-600">고정 지출</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-300" />
            <span className="text-xs font-bold text-slate-600">변동 지출</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full bg-slate-50 rounded-2xl overflow-hidden p-2">
        {displayData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={displayData}
              dataKey="value"
              content={renderCustomizedContent}
              isAnimationActive={false}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    if (data.depth === 1) return null;
                    const isFixed = data.groupName === "고정 지출";

                    return (
                      <div className="bg-white p-4 rounded-xl border shadow-xl flex flex-col gap-1 min-w-[200px]">
                        <span
                          className={`text-[10px] font-bold uppercase ${isFixed ? "text-slate-500" : "text-orange-500"}`}
                        >
                          {data.groupName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xl native-emoji">
                            {data.category_icon}
                          </span>
                          <span className="text-sm font-bold text-slate-800">
                            {data.name}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-col border-t pt-2 gap-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">지출액</span>
                            <span
                              className={`font-black ${isFixed ? "text-slate-700" : "text-orange-600"}`}
                            >
                              {data.value?.toLocaleString()}원
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">비중</span>
                            <span className="font-bold text-slate-700">
                              {data.percentage.toFixed(1)}%{" "}
                              {/* 백엔드 데이터 직접 연결 */}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            {loading ? "데이터 로딩 중..." : "데이터가 없습니다."}
          </div>
        )}
      </div>
    </div>
  );
};
