import React from "react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import {
  CircleMinus,
  CirclePlus,
  Minus,
  PinIcon,
  Plus,
  TrendingUpDownIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendBadgeProps {
  type: "income" | "expense";
  amount: string | number;
  isSimple?: boolean; // 텍스트(수입/지출) 숨김 여부
  className?: string;
}

export const IncomeBadge: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Badge
      className="
      h-5 px-1 py-1
      bg-emerald-600 text-white
      border-none
      hover:bg-emerald-700
      rounded-sm
      font-bold text-[10px]
      flex items-center gap-0.5
    "
    >
      <CirclePlus className="h-4 w-4 mr-0.5 text-white" />
      {t("common.in")}
    </Badge>
  );
};

export const ExpenseBadge: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Badge
      className="
      h-5 px-1 py-1
      bg-blue-600 text-white
      border-none
      hover:bg-blue-700
      rounded-sm
      font-bold text-[10px]
      flex items-center gap-0.5
    "
    >
      <CircleMinus className="w-4 h-4 mr-0.5 text-white" />
      {t("common.out")}
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
      hover:bg-gray-300
      rounded-sm
      font-bold text-[10px]
      flex items-center gap-0.5
    "
    >
      <PinIcon className="w-4 h-4 mr-0.5 text-black" />
      {t("common.fixed")}
    </Badge>
  );
};

export const VariableExpenseBadge: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Badge
      className="
      h-5 px-1 py-1
      bg-amber-300 text-black
      border border-amber-300
      hover:bg-amber-400
      rounded-sm
      font-bold text-[10px]
      flex items-center gap-0.5
    "
    >
      <TrendingUpDownIcon className="w-4 h-4 mr-0.5 text-black" />
      {t("common.variable")}
    </Badge>
  );
};

export function TrendBadge({
  type,
  amount,
  isSimple = false,
  className,
}: TrendBadgeProps) {
  const isIncome = type === "income";

  // 타입에 따른 스타일 및 아이콘 설정
  const config = {
    label: isIncome ? "수입" : "지출",
    icon: isIncome ? (
      <CirclePlus size={12} strokeWidth={3} />
    ) : (
      <CircleMinus size={12} strokeWidth={3} />
    ),
    baseClass: isIncome
      ? "bg-emerald-50/50 text-emerald-600 border-emerald-100/50"
      : "bg-blue-50/50 text-blue-600 border-blue-100/50",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg min-w-[140px] justify-between border",
        config.baseClass,
        isSimple && "min-w-[110px] justify-start",
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        {/* 아이콘 */}
        <span className="shrink-0">{config.icon}</span>

        {/* 심플 버전이 아닐 때만 텍스트 노출 */}
        {!isSimple && (
          <span className="text-[11px] font-bold uppercase shrink-0 tracking-tight">
            {config.label}
          </span>
        )}
      </div>

      {/* 금액 */}
      <span
        className={cn("text-sm font-bold tabular-nums", isSimple && "ml-1")}
      >
        {amount}
      </span>
    </Badge>
  );
}
