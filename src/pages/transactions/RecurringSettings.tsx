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
import { CategoryIcon } from "@/components/CategoryIcon";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { RecurringTransaction, RecurringHistoryItem } from "@/types";
import { useRecurringStore } from "@/stores/useRecurringStore";
import { useAppStore } from "@/stores/useAppStore";
import { PlusBadge, ProIcon } from "@/components/ui/PlusBadge";

const emptyForm: RecurringTransaction = {
  description: "",
  amount: 0,
  category_id: undefined,
  frequency: "monthly",
  start_date: new Date().toISOString().slice(0, 10),
  is_active: true,
};

export default function RecurringSettings() {
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
      <div className="flex items-center gap-2">
        반복 입력 <ProIcon />
      </div>,
      <div className="flex items-center gap-2">
        <Button
          onClick={handleProcessAll}
          disabled={isProcessing}
          variant="ghost" // 헤더에서는 ghost나 outline이 잘 어울립니다
          className="rounded-full px-3 h-9 text-blue-600 hover:bg-blue-50"
        >
          <RefreshCw
            className={cn("w-4 h-4 mr-2", isProcessing && "animate-spin")}
          />
          <span className="hidden sm:inline">
            {isProcessing ? "처리 중" : "전체 실행"}
          </span>
        </Button>

        <Button
          onClick={() => {
            setEditingTransaction(null);
            setIsFormOpen(true);
          }}
          size="sm"
          className="rounded-full px-4 h-9 shadow-sm bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          입력
        </Button>
      </div>
    );
    return () => resetHeader();
  }, [isProcessing]);

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
      title: "반복 지출 삭제",
      description: "정말 삭제하시겠습니까?",
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
      {/* 탭 버튼 */}
      <div className="flex border-b border-slate-200 w-full relative mb-6">
        {[
          { id: "all", label: "전체", count: counts.all },
          { id: "income", label: "수입", count: counts.income },
          { id: "expense", label: "지출", count: counts.expense },
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
            <p className="text-sm font-medium">등록된 반복 지출이 없습니다</p>
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
  // 오늘 날짜 확인 (YYYY-MM-DD 형식)
  const isToday = useMemo(() => {
    if (!recurring.last_created_date) return false;
    const today = new Date().toISOString().split("T")[0];
    return recurring.last_created_date.startsWith(today);
  }, [recurring.last_created_date]);

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

      <CardContent className="p-5 pt-6">
        {/* 우측 상단 활성화 배지 */}
        <div className="absolute top-3 right-3">
          <Badge
            variant="secondary"
            className={cn(
              "text-[9px] font-black border-none px-2 py-0 transition-colors",
              recurring.is_active
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-500"
            )}
          >
            {recurring.is_active ? "ACTIVE" : "PAUSED"}
          </Badge>
        </div>

        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-transform group-hover:scale-105",
                  category?.type === 0 ? "bg-emerald-50" : "bg-blue-50"
                )}
              >
                <CategoryIcon
                  icon={category?.icon || "❓"}
                  type={category?.type}
                />
              </div>
              {recurring.is_fixed === 1 && (
                <div className="absolute -bottom-1 -right-1 bg-black text-white rounded-full p-1 shadow-md ring-2 ring-white">
                  <Pin className="w-2.5 h-2.5 fill-white rotate-45" />
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <h3 className="font-black text-slate-800 truncate leading-tight text-base">
                {recurring.description}
              </h3>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">
                {category?.name || "미지정"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between mb-5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1.5">
              Amount
            </span>
            <div
              className={cn(
                "font-black text-xl leading-none",
                category?.type === 0 ? "text-emerald-600" : "text-blue-600"
              )}
            >
              {recurring.amount.toLocaleString()}
              <span className="text-sm ml-0.5">원</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1.5">
              Frequency
            </span>
            <Badge
              variant="outline"
              className="text-[10px] font-black py-0.5 px-2 bg-slate-50 border-slate-200 text-slate-600"
            >
              {getFrequencyText(recurring.frequency)} {getDayText(recurring)}
            </Badge>
          </div>
        </div>

        {/* 2. 하단 인포 영역 (기록 강조) */}
        <div className="grid grid-cols-1 gap-2 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-400 font-bold uppercase tracking-tighter">
              Cycle
            </span>
            <span className="text-slate-600 font-black tabular-nums">
              {recurring.start_date.slice(2, 10).replace(/-/g, ".")} ~{" "}
              {recurring.end_date
                ? recurring.end_date.slice(2, 10).replace(/-/g, ".")
                : "INF"}
            </span>
          </div>

          <div
            className={cn(
              "flex justify-between items-center text-[10px] p-1.5 rounded-lg transition-colors",
              isToday ? "bg-blue-50/50 ring-1 ring-blue-100" : "bg-transparent"
            )}
          >
            <span
              className={cn(
                "font-bold uppercase tracking-tighter",
                isToday ? "text-blue-600" : "text-slate-400"
              )}
            >
              Last Run
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
                    ? "오늘 실행됨 ✨"
                    : recurring.last_created_date
                        .slice(2, 10)
                        .replace(/-/g, ".")}
                </span>
              ) : (
                <span className="text-slate-300 font-bold italic">
                  No Record
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Hover Actions Overlay */}
        <div className="absolute inset-0 bg-white/95 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-2.5 z-10">
          {[
            {
              icon: Edit,
              onClick: () => onEdit(recurring),
              color: "hover:text-blue-600 hover:border-blue-200",
              title: "수정",
            },
            {
              icon: recurring.is_active ? PowerOff : Power,
              onClick: () => onToggle(recurring.id!),
              color: recurring.is_active
                ? "hover:text-orange-600 hover:border-orange-200"
                : "hover:text-emerald-600 hover:border-emerald-200",
              title: recurring.is_active ? "중단" : "활성화",
            },
            {
              icon: RefreshCw,
              onClick: () => onProcess(recurring.id!),
              color: "hover:text-blue-600 hover:border-blue-200",
              title: "즉시 실행",
            },
            {
              icon: Trash2,
              onClick: () => onDelete(recurring.id!),
              color: "hover:text-rose-600 hover:border-rose-200",
              title: "삭제",
            },
          ].map((action, i) => (
            <Button
              key={i}
              variant="outline"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-xl shadow-sm bg-white transition-all hover:scale-110 active:scale-95",
                action.color
              )}
              onClick={action.onClick}
              title={action.title}
            >
              <action.icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
