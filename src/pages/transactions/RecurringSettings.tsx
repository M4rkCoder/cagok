import React, { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Power, PowerOff, RefreshCw } from "lucide-react";
import type { Category } from "@/types";
import { useHeaderStore } from "@/store/useHeaderStore";
import { useConfirmStore } from "@/store/useConfirmStore";
import RecurringFormSheet from "./RecurringFormSheet";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface RecurringTransaction {
  id?: number;
  description: string;
  amount: number;
  category_id?: number;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  start_date: string;
  end_date?: string;
  day_of_month?: number;
  day_of_week?: number;
  is_active: boolean;
  last_created_date?: string;
  remarks?: string;
}

const emptyForm: RecurringTransaction = {
  description: "",
  amount: 0,
  category_id: undefined,
  frequency: "monthly",
  start_date: new Date().toISOString().slice(0, 10),
  is_active: true,
};

export default function RecurringSettings() {
  const resetHeader = useHeaderStore((state) => state.resetHeader);
  const setHeader = useHeaderStore((state) => state.setHeader);
  const { confirm } = useConfirmStore();
  useEffect(() => {
    setHeader("반복 지출 설정");
    return () => resetHeader();
  }, []);

  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>(
    []
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<RecurringTransaction | null>(null);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  const counts = useMemo(() => {
    const income = recurringList.filter((item) => {
      const cat = categoryMap.get(item.category_id!);
      return cat?.type === 0;
    }).length;
    const expense = recurringList.filter((item) => {
      const cat = categoryMap.get(item.category_id!);
      return cat?.type === 1;
    }).length;
    return {
      all: recurringList.length,
      income,
      expense,
    };
  }, [recurringList, categoryMap]);

  const filteredRecurringList = useMemo(() => {
    if (filterType === "all") return recurringList;
    return recurringList.filter((item) => {
      const cat = categoryMap.get(item.category_id!);
      if (!cat) return false;
      return filterType === "income" ? cat.type === 0 : cat.type === 1;
    });
  }, [recurringList, filterType, categoryMap]);

  const loadData = async () => {
    try {
      const [recurring, cats] = await Promise.all([
        invoke<RecurringTransaction[]>("get_recurring_transactions"),
        invoke<Category[]>("get_categories"),
      ]);
      setRecurringList(recurring);
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("데이터를 불러오는 데 실패했습니다.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (transaction: RecurringTransaction) => {
    try {
      await invoke("create_recurring_transaction", { recurring: transaction });
      toast.success("반복 지출이 추가되었습니다.");
      setIsFormOpen(false);
      loadData();
    } catch (error) {
      console.error("Failed to create recurring transaction:", error);
      toast.error(`추가에 실패했습니다: ${error}`);
    }
  };

  const handleUpdate = async (transaction: RecurringTransaction) => {
    if (!transaction.id) return;
    try {
      await invoke("update_recurring_transaction", {
        id: transaction.id,
        recurring: transaction,
      });
      toast.success("반복 지출이 수정되었습니다.");
      setEditingTransaction(null);
      setIsFormOpen(false); // Close sheet on update success
      loadData();
    } catch (error) {
      console.error("Failed to update recurring transaction:", error);
      toast.error(`수정에 실패했습니다: ${error}`);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await invoke("toggle_recurring_transaction", { id });
      toast.success("상태가 변경되었습니다.");
      loadData();
    } catch (error) {
      console.error("Failed to toggle:", error);
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  const handleDelete = (id: number) => {
    confirm({
      title: "반복 지출 삭제",
      description: "이 반복 지출 설정을 정말 삭제하시겠습니까?",
      onConfirm: async () => {
        try {
          await invoke("delete_recurring_transaction", { id });
          toast.success("삭제되었습니다.");
          loadData();
        } catch (error) {
          console.error("Failed to delete:", error);
          toast.error("삭제에 실패했습니다.");
        }
      },
    });
  };

  const handleProcessSingleRecurring = async (id: number) => {
    try {
      const count = await invoke<number>(
        "process_single_recurring_transaction",
        { recurringId: id }
      );
      if (count > 0) {
        toast.success(`반복 지출이 생성되었습니다.`);
      } else {
        toast.info(
          "새로 생성된 반복 지출이 없습니다. (이미 생성되었거나, 조건 불충족)"
        );
      }
      loadData();
    } catch (error) {
      console.error("Failed to process single recurring transaction:", error);
      toast.error(`반복 지출 실행에 실패했습니다: ${error}`);
    }
  };

  const getFrequencyText = (frequency: string) =>
    ({ daily: "매일", weekly: "매주", monthly: "매월", yearly: "매년" })[
      frequency
    ] || frequency;

  const getDayText = (recurring: RecurringTransaction) => {
    if (recurring.frequency === "weekly" && recurring.day_of_week != null) {
      return (
        ["일", "월", "화", "수", "목", "금", "토"][recurring.day_of_week] +
        "요일"
      );
    }
    if (recurring.frequency === "monthly" && recurring.day_of_month) {
      return recurring.day_of_month + "일";
    }
    return "";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">반복 지출 관리</h1>
          <p className="text-sm text-slate-500 mt-1">
            고정적으로 발생하는 수입과 지출을 자동으로 등록하세요.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTransaction(null);
            setIsFormOpen(true);
          }}
          className="rounded-full px-6 shadow-sm bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          새 반복 추가
        </Button>
      </div>

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

      <RecurringFormSheet
        open={isFormOpen || !!editingTransaction}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingTransaction(null);
        }}
        transaction={
          editingTransaction ||
          (categories.length > 0
            ? { ...emptyForm, category_id: categories[0].id }
            : emptyForm)
        }
        categories={categories}
        onSave={editingTransaction ? handleUpdate : handleCreate}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecurringList.map((recurring) => {
          const cat = categoryMap.get(recurring.category_id!);
          return (
            <Card
              key={recurring.id}
              className="relative overflow-hidden group hover:shadow-md transition-shadow border-slate-200"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        cat?.type === 0 ? "bg-emerald-100" : "bg-rose-100"
                      )}
                    >
                      <span className="text-lg">
                        {cat?.icon || "❓"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-700 truncate max-w-[120px]">
                        {recurring.description}
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">
                        {cat?.name || "미지정"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        "font-black text-lg",
                        cat?.type === 0 ? "text-emerald-600" : "text-rose-600"
                      )}
                    >
                      {recurring.amount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium bg-slate-50 px-1.5 py-0.5 rounded-md inline-block mt-1">
                      {getFrequencyText(recurring.frequency)}{" "}
                      {getDayText(recurring)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-3 border-t border-dashed border-slate-100">
                  <div className="flex gap-2">
                    <span>시작: {recurring.start_date.slice(0, 10)}</span>
                    {recurring.end_date && (
                      <span>~ {recurring.end_date.slice(0, 10)}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "font-bold px-1.5 py-0.5 rounded",
                      recurring.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {recurring.is_active ? "활성" : "중지됨"}
                  </span>
                </div>

                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full shadow-sm hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      setEditingTransaction(recurring);
                      setIsFormOpen(true);
                    }}
                    title="수정"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full shadow-sm hover:text-orange-600 hover:bg-orange-50"
                    onClick={() => handleToggle(recurring.id!)}
                    title={recurring.is_active ? "비활성화" : "활성화"}
                  >
                    {recurring.is_active ? (
                      <PowerOff className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full shadow-sm hover:text-green-600 hover:bg-green-50"
                    onClick={() => handleProcessSingleRecurring(recurring.id!)}
                    title="지금 즉시 실행"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full shadow-sm hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(recurring.id!)}
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredRecurringList.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
            <RefreshCw className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">등록된 반복 지출이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
