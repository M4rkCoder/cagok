import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  RefreshCw,
  Pin,
} from "lucide-react";
import { useHeaderStore } from "@/stores/useHeaderStore";
import { useConfirmStore } from "@/stores/useConfirmStore";
import RecurringFormSheet from "./RecurringFormSheet";
import { cn, getFrequencyText, getDayText } from "@/lib/utils";
import { CategoryIcon, FixIcon } from "@/components/CategoryIcon";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { RecurringTransaction } from "@/types";
import { useRecurringStore } from "@/stores/useRecurringStore";
import { useAppStore } from "@/stores/useAppStore";
import { useSettingStore } from "@/stores/useSettingStore";
import { format, parseISO } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

export default function RecurringSettings() {
  const { t } = useTranslation();
  const { setHeader, resetHeader } = useHeaderStore();
  const { confirm } = useConfirmStore();
  const { categoryList: categories } = useAppStore();
  const {
    recurringList,
    filterType,
    setFilterType,
    loadData,
    createRecurring,
    updateRecurring,
    toggleRecurring,
    deleteRecurring,
    processSingle,
    processAll,
  } = useRecurringStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<RecurringTransaction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setHeader(
      t("recurring.title"),
      <div className="flex items-center gap-2">
        <Button
          onClick={handleProcessAll}
          disabled={isProcessing}
          variant="outline" // 헤더에서는 ghost나 outline이 잘 어울립니다
          size="lg"
          className="cursor-pointer text-slate-600 hover:bg-slate-200"
        >
          <RefreshCw
            className={cn("w-4 h-4 mr-2", isProcessing && "animate-spin")}
          />
          <span className="hidden sm:inline">
            {isProcessing
              ? t("recurring.processing")
              : t("recurring.process_all")}
          </span>
        </Button>

        <Button
          onClick={() => {
            setEditingTransaction(null);
            setIsFormOpen(true);
          }}
          size="lg"
          className="cursor-pointer shadow-sm bg-slate-600 hover:bg-slate-700"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {t("recurring.input")}
        </Button>
      </div>
    );
    return () => resetHeader();
  }, [isProcessing, t, setHeader, resetHeader]);

  useEffect(() => {
    loadData();
  }, []);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const counts = useMemo(
    () => ({
      all: recurringList.length,
      income: recurringList.filter(
        (item) => categoryMap.get(item.category_id!)?.type === 0
      ).length,
      expense: recurringList.filter(
        (item) => categoryMap.get(item.category_id!)?.type === 1
      ).length,
    }),
    [recurringList, categoryMap]
  );

  const filteredList = useMemo(() => {
    let list = [...recurringList]; // 원본 배열 복사

    if (filterType !== "all") {
      list = list.filter((item) => {
        const cat = categoryMap.get(item.category_id!);
        return filterType === "income" ? cat?.type === 0 : cat?.type === 1;
      });
    }

    return list.sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [recurringList, filterType, categoryMap]);

  // Handlers
  const openEdit = (transaction: RecurringTransaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const onDeleteConfirm = (id: number) => {
    confirm({
      title: t("recurring.delete_title"),
      description: t("recurring.delete_confirm"),
      onConfirm: () => deleteRecurring(id),
    });
  };

  const handleProcessAll = async () => {
    setIsProcessing(true);
    await processAll();
    setIsProcessing(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-[1250px] mx-auto space-y-4"
      >
        {/* 탭 버튼 */}
        <div className="flex border-b border-slate-200 w-full relative mb-6">
          {[
            { id: "all", label: t("common.all"), count: counts.all },
            { id: "income", label: t("common.income"), count: counts.income },
            {
              id: "expense",
              label: t("common.expense"),
              count: counts.expense,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={cn(
                "relative px-6 py-3 text-sm font-bold transition-all flex items-center gap-2 outline-none",
                filterType === tab.id
                  ? "text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab.label}
              <Badge
                variant="secondary"
                className={cn(
                  "ml-1 h-5 px-1.5 text-[10px] font-black border-none shadow-none",
                  filterType === tab.id
                    ? "bg-slate-100 text-slate-900"
                    : "bg-transparent text-slate-300"
                )}
              >
                {tab.count}
              </Badge>
              {filterType === tab.id && (
                <motion.div
                  layoutId="recurringTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((recurring) => (
            <RecurringCard
              key={recurring.id}
              recurring={recurring}
              category={categoryMap.get(recurring.category_id!)}
              onEdit={() => openEdit(recurring)}
              onToggle={() => toggleRecurring(recurring.id!)}
              onDelete={() => onDeleteConfirm(recurring.id!)}
              onProcess={() => processSingle(recurring.id!)}
            />
          ))}
          {filteredList.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
              <RefreshCw className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">
                {t("recurring.no_recurring")}
              </p>
            </div>
          )}
        </div>
        <RecurringFormSheet
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          transaction={
            editingTransaction || {
              description: "",
              amount: 0,
              frequency: "monthly",
              start_date: new Date().toISOString().slice(0, 10),
              is_active: true,
            }
          }
          categories={categories}
          onSave={(data) =>
            editingTransaction
              ? updateRecurring(data.id!, data)
              : createRecurring(data)
          }
        />
      </motion.div>
    </div>
  );
}

function RecurringCard({
  recurring,
  category,
  onEdit,
  onToggle,
  onDelete,
  onProcess,
}: any) {
  const { t, i18n } = useTranslation();
  const { dateFormat } = useSettingStore();
  const { formatAmount } = useCurrencyFormatter();

  // 오늘 날짜 확인 (YYYY-MM-DD 형식)
  const isToday = useMemo(() => {
    if (!recurring.last_created_date) return false;
    const today = new Date().toISOString().split("T")[0];
    return recurring.last_created_date.startsWith(today);
  }, [recurring.last_created_date]);

  const localeObj = i18n.language === "ko" ? ko : enUS;

  const formatDateValue = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = parseISO(dateStr);
      if (!isNaN(d.getTime())) {
        return format(d, dateFormat, { locale: localeObj });
      }
    } catch {}
    return dateStr;
  };

  return (
    <Card
      className={cn(
        "relative group border-slate-200 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md",
        recurring.is_active
          ? "hover:border-blue-300/50"
          : "bg-slate-50/50 border-dashed opacity-80"
      )}
    >
      {/* 1. 상단 상태 바 (활성/비활성 배지) */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 transition-colors duration-500",
          recurring.is_active
            ? category?.type === 0
              ? "bg-emerald-500"
              : "bg-blue-500"
            : "bg-slate-300"
        )}
      />

      {/* 🔹 패딩 축소 (p-5 pt-6 -> p-4) */}
      <CardContent className="p-4">
        {/* 우측 상단 활성화 배지 */}
        <div className="absolute top-2.5 right-2.5">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-black border-none px-2 py-0 transition-colors",
              recurring.is_active
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-500"
            )}
          >
            {recurring.is_active
              ? t("recurring.status.active").toUpperCase()
              : t("recurring.status.paused").toUpperCase()}
          </Badge>
        </div>

        {/* 🔹 마진 축소 mb-5 -> mb-3 */}
        <div className="flex items-start justify-between mb-3 mt-1">
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              {/* 🔹 아이콘 컨테이너 축소 w-12 h-12 -> w-10 h-10 */}
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner transition-transform group-hover:scale-105",
                  category?.type === 0 ? "bg-emerald-50" : "bg-blue-50"
                )}
              >
                <CategoryIcon
                  icon={category?.icon || "❓"}
                  type={category?.type}
                  size="sm"
                />
              </div>
              {recurring.is_fixed === 1 && <FixIcon />}
            </div>

            <div className="flex flex-col min-w-0">
              <h3 className="font-black text-slate-800 truncate leading-tight text-sm">
                {recurring.description}
              </h3>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                {category?.name || t("recurring.uncategorized")}
              </span>
            </div>
          </div>
        </div>

        {/* 🔹 마진 축소 mb-5 -> mb-3 */}
        <div className="flex items-end justify-between mb-3">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase leading-none mb-1">
              {t("recurring.card_labels.amount")}
            </span>
            {/* 🔹 폰트 축소 text-xl -> text-lg */}
            <div
              className={cn(
                "font-black text-lg leading-none",
                category?.type === 0 ? "text-emerald-600" : "text-blue-600"
              )}
            >
              {formatAmount(recurring.amount)}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-slate-400 uppercase leading-none mb-1">
              {t("recurring.card_labels.frequency")}
            </span>
            <Badge
              variant="outline"
              className="text-xs font-black py-0.5 px-1.5 bg-slate-50 border-slate-200 text-slate-600"
            >
              {getFrequencyText(recurring.frequency, t)}{" "}
              {getDayText(recurring, t)}
            </Badge>
          </div>
        </div>

        {/* 2. 하단 인포 영역 (기록 강조) */}
        {/* 🔹 여백 축소 pt-4 -> pt-3, gap-2 -> gap-1.5 */}
        <div className="grid grid-cols-1 gap-1.5 pt-3 border-t border-slate-100">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-tighter">
              {t("recurring.card_labels.cycle")}
            </span>
            <span className="text-slate-600 font-black tabular-nums">
              {formatDateValue(recurring.start_date)} ~{" "}
              {recurring.end_date
                ? formatDateValue(recurring.end_date)
                : t("recurring.form.no_end_date")}
            </span>
          </div>

          <div
            className={cn(
              "flex justify-between items-center text-xs p-1 rounded-md transition-colors",
              isToday ? "bg-blue-50/50 ring-1 ring-blue-100" : "bg-transparent"
            )}
          >
            <span
              className={cn(
                "font-bold uppercase tracking-tighter",
                isToday ? "text-blue-600" : "text-slate-400"
              )}
            >
              {t("recurring.card_labels.last_run")}
            </span>
            <div className="flex items-center gap-2">
              {recurring.last_created_date ? (
                <span
                  className={cn(
                    "font-black tabular-nums",
                    isToday ? "text-blue-600 animate-pulse" : "text-slate-600"
                  )}
                >
                  {isToday
                    ? t("recurring.last_run_today")
                    : formatDateValue(recurring.last_created_date)}
                </span>
              ) : (
                <span className="text-slate-300 font-bold italic">
                  {t("recurring.no_record")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Hover Actions Overlay */}
        {/* 🔹 액션 버튼 레이아웃 튜닝 (간격 좁히고 아이콘 버튼 크기 축소) */}
        <div className="absolute inset-0 bg-white/95 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-2 z-10">
          {[
            {
              icon: Edit,
              onClick: () => onEdit(recurring),
              color: "hover:text-blue-600 hover:border-blue-200",
              title: t("recurring.actions.edit"),
            },
            {
              icon: recurring.is_active ? PowerOff : Power,
              onClick: () => onToggle(recurring.id!),
              color: recurring.is_active
                ? "hover:text-orange-600 hover:border-orange-200"
                : "hover:text-emerald-600 hover:border-emerald-200",
              title: recurring.is_active
                ? t("recurring.actions.pause")
                : t("recurring.actions.activate"),
            },
            {
              icon: RefreshCw,
              onClick: () => onProcess(recurring.id!),
              color: "hover:text-blue-600 hover:border-blue-200",
              title: t("recurring.actions.run_now"),
            },
            {
              icon: Trash2,
              onClick: () => onDelete(recurring.id!),
              color: "hover:text-rose-600 hover:border-rose-200",
              title: t("recurring.actions.delete"),
            },
          ].map((action, i) => (
            <Button
              key={i}
              variant="outline"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg shadow-sm bg-white transition-all hover:scale-110 active:scale-95", // h-10 w-10 -> h-8 w-8 축소
                action.color
              )}
              onClick={action.onClick}
              title={action.title}
            >
              <action.icon className="w-3.5 h-3.5" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
