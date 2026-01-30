import React, { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Power, PowerOff, RefreshCw } from "lucide-react";
import type { Category } from "@/types";
import { useHeaderStore } from "@/store/useHeaderStore";

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

// RecurringTransactionForm Component
const RecurringTransactionForm = ({
  transaction,
  categories,
  onSave,
  onCancel,
}: {
  transaction: RecurringTransaction;
  categories: Category[];
  onSave: (transaction: RecurringTransaction) => void;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState(transaction);

  useEffect(() => {
    setForm(transaction);
  }, [transaction]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    const isNumeric = ["category_id"].includes(name);
    setForm((prev) => ({
      ...prev,
      [name]: isNumeric ? Number(value) : value,
    }));
  };

  const handleSubmit = () => {
    if (!form.description || !form.amount) {
      toast.error("설명과 금액을 입력해주세요");
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {form.id ? "반복 지출 수정" : "반복 지출 추가"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Input
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">금액</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category_id">카테고리</Label>
            <Select
              name="category_id"
              value={form.category_id?.toString()}
              onValueChange={(v) => handleSelectChange("category_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequency">주기</Label>
            <Select
              name="frequency"
              value={form.frequency}
              onValueChange={(v) => handleSelectChange("frequency", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="주기 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">매일</SelectItem>
                <SelectItem value="weekly">매주</SelectItem>
                <SelectItem value="monthly">매월</SelectItem>
                <SelectItem value="yearly">매년</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_date">시작일</Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              value={form.start_date.slice(0, 10)}
              onChange={handleChange}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button onClick={handleSubmit}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function RecurringSettings() {
  const resetHeader = useHeaderStore((state) => state.resetHeader);
  const setHeader = useHeaderStore((state) => state.setHeader);
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

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  const getCategoryIcon = (categoryId?: number) => {
    if (!categoryId) return "💸";
    return categoryMap.get(categoryId)?.icon ?? "❓";
  };

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

  const handleDelete = async (id: number) => {
    if (!window.confirm("이 반복 지출을 삭제하시겠습니까?")) return;
    try {
      await invoke("delete_recurring_transaction", { id });
      toast.success("삭제되었습니다.");
      loadData();
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("삭제에 실패했습니다.");
    }
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
      loadData(); // Refresh to update last_created_date
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">고정 반복 지출 설정</h1>
          <p className="text-gray-500 mt-1">
            정기적으로 발생하는 지출을 자동으로 등록하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            반복 지출 추가
          </Button>
        </div>
      </div>

      {(isFormOpen || editingTransaction) && (
        <RecurringTransactionForm
          transaction={
            editingTransaction ||
            (categories.length > 0
              ? { ...emptyForm, category_id: categories[0].id }
              : emptyForm)
          }
          categories={categories}
          onSave={editingTransaction ? handleUpdate : handleCreate}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingTransaction(null);
          }}
        />
      )}

      <div className="space-y-4">
        {recurringList.map((recurring) => (
          <Card key={recurring.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      {getCategoryIcon(recurring.category_id)}{" "}
                      {recurring.description}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        recurring.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {recurring.is_active ? "활성" : "비활성"}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>금액: {recurring.amount.toLocaleString()}원</p>
                    <p>
                      주기: {getFrequencyText(recurring.frequency)}{" "}
                      {getDayText(recurring)}
                    </p>
                    <p>시작일: {recurring.start_date.slice(0, 10)}</p>
                    {recurring.end_date && (
                      <p>종료일: {recurring.end_date.slice(0, 10)}</p>
                    )}
                    {recurring.last_created_date && (
                      <p className="text-xs text-gray-400">
                        마지막 생성: {recurring.last_created_date.slice(0, 10)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(recurring.id!)}
                  >
                    {recurring.is_active ? (
                      <PowerOff className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTransaction(recurring)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProcessSingleRecurring(recurring.id!)}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(recurring.id!)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {recurringList.length === 0 && !isFormOpen && !editingTransaction && (
          <Card>
            <CardContent className="p-12 text-center text-gray-400">
              등록된 반복 지출이 없습니다
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
