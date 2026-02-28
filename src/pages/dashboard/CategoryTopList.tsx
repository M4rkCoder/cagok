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
                <CategoryIcon icon={item.category_icon} type={1} size="sm" />
                <div className="min-w-0">
                  <div className="font-bold text-[13px] truncate text-slate-700 group-hover:text-blue-600 transition-colors">
                    {item.description}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium gap-2">
                    {item.category_name} · {item.date.slice(-2)}{t("common.day", { defaultValue: "일" })}
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
    <Card className="pt-4 pb-0 px-5 border-none shadow-md">
      <div className="flex gap-8 w-full mt-0 px-3 pb-3">
        {renderList(t("dashboard.cards.fixed_expense"), topFixed)}

        {/* 구분선 */}
        <div className="w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent self-stretch" />

        {renderList(t("dashboard.cards.variable_expense"), topVariable)}
      </div>
    </Card>
  );
};
