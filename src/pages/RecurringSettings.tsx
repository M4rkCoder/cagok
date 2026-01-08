import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Power, PowerOff } from "lucide-react";

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

export default function RecurringSettings() {
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>(
    []
  );
  const emptyForm: RecurringTransaction = {
    description: "",
    amount: 0,
    frequency: "monthly",
    start_date: new Date().toISOString().slice(0, 10),
    is_active: true,
  };
  const [form, setForm] = useState<RecurringTransaction>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadRecurringTransactions();
  }, []);

  const loadRecurringTransactions = async () => {
    try {
      const data = await invoke<RecurringTransaction[]>(
        "get_recurring_transactions"
      );
      setRecurringList(data);
    } catch (error) {
      console.error("Failed to load recurring transactions:", error);
    }
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handleCreate = async () => {
    if (!form.description || !form.amount) {
      alert("설명과 금액을 입력해주세요");
      return;
    }

    try {
      await invoke("create_recurring_transaction", {
        recurring: form,
      });

      setShowForm(false);
      setForm(emptyForm);
      loadRecurringTransactions();
    } catch (error) {
      console.error("Failed to create recurring transaction:", error);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await invoke("toggle_recurring_transaction", { id });
      loadRecurringTransactions();
    } catch (error) {
      console.error("Failed to toggle:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 반복 지출을 삭제하시겠습니까?")) return;

    try {
      await invoke("delete_recurring_transaction", { id });
      loadRecurringTransactions();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const getFrequencyText = (frequency: string) => {
    const map: Record<string, string> = {
      daily: "매일",
      weekly: "매주",
      monthly: "매월",
      yearly: "매년",
    };
    return map[frequency] || frequency;
  };

  const getDayText = (recurring: RecurringTransaction) => {
    if (
      recurring.frequency === "weekly" &&
      recurring.day_of_week !== undefined
    ) {
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      return days[recurring.day_of_week] + "요일";
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
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          반복 지출 추가
        </Button>
      </div>

      <div className="space-y-4">
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>반복 지출 추가</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm">설명</label>
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm">금액</label>
                <input
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm">주기</label>
                <select
                  name="frequency"
                  value={form.frequency}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="daily">매일</option>
                  <option value="weekly">매주</option>
                  <option value="monthly">매월</option>
                  <option value="yearly">매년</option>
                </select>
              </div>

              <div>
                <label className="text-sm">시작일</label>
                <input
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  취소
                </Button>
                <Button onClick={handleCreate}>저장</Button>
              </div>
            </CardContent>
          </Card>
        )}
        {recurringList.map((recurring) => (
          <Card key={recurring.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">
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
                    <p>시작일: {recurring.start_date}</p>
                    {recurring.end_date && <p>종료일: {recurring.end_date}</p>}
                    {recurring.last_created_date && (
                      <p className="text-xs text-gray-400">
                        마지막 생성: {recurring.last_created_date}
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
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
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

        {recurringList.length === 0 && (
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
