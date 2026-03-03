import React from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { formatCurrency } from "@/lib/utils";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { DashboardTitle } from "./components/DashboardTitle";
import { Card } from "@/components/ui/card";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useTranslation } from "react-i18next";

interface ExpenseItem {
  id: string | number;
  description: string;
  category_name: string;
  category_icon: string;
  amount: number;
  date: string;
}

export const CategoryTopList: React.FC = () => {
  const { t } = useTranslation();
  const { formatAmount } = useCurrencyFormatter();
  const { topFixedExpenses: topFixed, topVariableExpenses: topVariable } =
    useDashboardStore();
  const renderList = (title: string, data: ExpenseItem[]) => (
    <div className="flex-1 flex flex-col min-w-0">
      {/* 헤더 섹션 */}
      <div className="flex items-center gap-1 mb-1">
        <DashboardTitle title={`${title} (TOP 5)`} />
      </div>

      {/* 리스트 섹션 */}
      <div className="flex flex-col gap-0">
        {data && data.length > 0 ? (
          data.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-1 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group border border-transparent hover:border-slate-100"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* 🔹 수정된 날짜 원형 표시 UI */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex flex-col items-center justify-center border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                  <span className="text-[14px] font-black text-slate-700 group-hover:text-blue-600 leading-none">
                    {item.date.slice(-2)}
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase">
                    {t("common.day_short", { defaultValue: "DAY" })}
                  </span>
                </div>

                <div className="relative">
                  <CategoryIcon icon={item.category_icon} type={1} size="sm" />
                  {/* 아이콘 우측 하단에 작은 장식 등을 추가할 수 있는 여지 */}
                </div>

                <div className="min-w-0">
                  <div className="font-bold text-[13px] truncate text-slate-700 group-hover:text-blue-600 transition-colors">
                    {item.description || t("transaction.no_description")}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {item.category_name}
                  </div>
                </div>
              </div>

              <div className="text-right ml-2">
                <div className="font-black text-[13px] text-slate-800">
                  {formatAmount(item.amount)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-24 flex items-center justify-center text-xs text-slate-300 italic bg-slate-50/50 rounded-2xl border border-dashed">
            {t("transaction.no_found")}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="pt-4 pb-2 px-5 border-none shadow-md bg-white/50 backdrop-blur-sm">
      <div className="flex gap-6 w-full mt-0 pb-2">
        {renderList(t("dashboard.cards.fixed_expense"), topFixed)}

        {/* 구분선: 점선 스타일로 변경하여 시각적 부담 감소 */}
        <div className="w-px border-r border-dashed border-slate-200 self-stretch my-2" />

        {renderList(t("dashboard.cards.variable_expense"), topVariable)}
      </div>
    </Card>
  );
};
