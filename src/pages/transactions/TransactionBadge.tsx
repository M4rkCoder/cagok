import React from "react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { CircleMinus, CirclePlus, PinIcon } from "lucide-react";

export const IncomeBadge: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Badge
      className="
      h-5 px-1 py-1
      bg-gray-900 text-white
      border-none
      hover:bg-gray-900
      rounded-sm
      font-bold text-[10px]
      flex items-center gap-0.5
    "
    >
      <CirclePlus className="h-4 w-4 mr-0.5" />
      {t("income")}
    </Badge>
  );
};

export const ExpenseBadge: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Badge
      className="
      h-5 px-1 py-1
      bg-white text-gray-900
      border border-gray-300
      hover:bg-white
      rounded-sm
      font-bold text-[10px]
      flex items-center gap-0.5
    "
    >
      <CircleMinus className="w-4 h-4 mr-0.5" />
      {t("expense")}
    </Badge>
  );
};

export const FixedExpenseBadge: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Badge
      className="
      h-5 px-1 py-1
      bg-gray-200 text-black
      border border-gray-300
      hover:bg-gray-200
      rounded-sm
      font-bold text-[10px]
      flex items-center gap-0.5
    "
    >
      <PinIcon />
      {t("fixed")}
    </Badge>
  );
};
