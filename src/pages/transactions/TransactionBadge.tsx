import React from "react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export const IncomeBadge: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Badge className="h-5 px-1.5 py-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold text-[10px] gap-0.5">
      <span className="text-[10px] native-emoji">💰</span>
      {t("income")}
    </Badge>
  );
};

export const ExpenseBadge: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Badge className="h-5 px-1.5 py-0 bg-rose-100 text-rose-700 hover:bg-rose-100 border-none font-bold text-[10px] gap-0.5">
      <span className="text-[10px] native-emoji">💸</span>
      {t("expense")}
    </Badge>
  );
};

export const FixedExpenseBadge: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Badge className="h-5 px-1.5 py-0 bg-slate-400 hover:bg-slate-400 text-[10px] font-bold gap-0.5 flex items-center justify-center border-none">
      <span className="text-[10px]">📌</span>
      {t("fixed")}
    </Badge>
  );
};
