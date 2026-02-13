import React, { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Category } from "@/types";
import { toast } from "sonner";
import { cn, smartParseDate, evaluateExpression } from "@/lib/utils";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Check, CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";

interface RecurringTransaction {
  id?: number;
  description: string;
  amount: number | string;
  category_id?: number;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  start_date: string;
  end_date?: string;
  day_of_month?: number;
  day_of_week?: number;
  is_active: boolean;
  remarks?: string;
}

interface RecurringFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: RecurringTransaction;
  categories: Category[];
  onSave: (transaction: RecurringTransaction) => void;
}

const RecurringFormSheet: React.FC<RecurringFormSheetProps> = ({
  open,
  onOpenChange,
  transaction,
  categories,
  onSave,
}) => {
  const [form, setForm] = useState<RecurringTransaction>(transaction);
  const [transactionType, setTransactionType] = useState<0 | 1>(1); // 0: Income, 1: Expense

  useEffect(() => {
    const initialAmount = transaction.amount
      ? new Intl.NumberFormat().format(Number(transaction.amount))
      : "0";

    setForm({
      ...transaction,
      amount: initialAmount,
    });

    if (transaction.category_id) {
      const cat = categories.find((c) => c.id === transaction.category_id);
      if (cat) {
        setTransactionType(cat.type);
      }
    }
  }, [transaction, categories, open]);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => c.type === transactionType);
  }, [categories, transactionType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.length > 1 && val.startsWith("0") && !val.startsWith("0.")) {
      val = val.substring(1);
    }
    setForm((prev) => ({ ...prev, amount: val }));
  };

  const handleAmountBlur = () => {
    const result = evaluateExpression(form.amount.toString().replace(/,/g, ""));
    if (result !== null) {
      const formatted = new Intl.NumberFormat().format(Number(result));
      setForm((prev) => ({ ...prev, amount: formatted }));
    }
  };

  const handleDateBlur = (name: "start_date" | "end_date") => {
    const value = form[name];
    if (value) {
      const parsed = smartParseDate(value);
      setForm((prev) => ({ ...prev, [name]: parsed }));
    }
  };

  const handleSubmit = () => {
    if (!form.description.trim()) {
      toast.error("설명을 입력해주세요.");
      return;
    }

    const finalAmount = Number(form.amount.toString().replace(/,/g, ""));
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast.error("유효한 금액을 입력해주세요.");
      return;
    }
    if (!form.category_id) {
      toast.error("카테고리를 선택해주세요.");
      return;
    }

    onSave({
      ...form,
      amount: finalAmount,
    });
    onOpenChange(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const viewport = e.currentTarget.querySelector(
      '[data-slot="scroll-area-viewport"]',
    );
    if (viewport) {
      viewport.scrollLeft += e.deltaY;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="top-12 h-[calc(100vh-theme(spacing.12))] sm:max-w-[450px]"
      >
        <SheetHeader className="mb-2 space-y-1 px-1">
          <SheetTitle>{form.id ? "반복 기록 수정" : "새 반복 기록"}</SheetTitle>
          <SheetDescription className="text-xs">
            반복 수입/지출 기록을 설정합니다.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full pb-15">
          <ScrollArea className="flex-1 -mr-2 pr-2">
            <div className="space-y-4 pb-4 px-1">
              {/* 1. 수입/지출 선택 */}
              <div className="flex p-1 bg-slate-100 rounded-xl mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTransactionType(0);
                    setForm((prev) => ({ ...prev, category_id: undefined }));
                  }}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                    transactionType === 0
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-600",
                  )}
                >
                  수입
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTransactionType(1);
                    setForm((prev) => ({ ...prev, category_id: undefined }));
                  }}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                    transactionType === 1
                      ? "bg-white text-rose-500 shadow-sm"
                      : "text-slate-400 hover:text-slate-600",
                  )}
                >
                  지출
                </button>
              </div>

              {/* 2. 카테고리 선택 */}
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">
                  카테고리
                </Label>
                <div className="w-full max-w-[calc(100vw-3.5rem)] sm:max-w-[390px]">
                  <ScrollArea
                    className="w-full whitespace-nowrap rounded-xl border border-slate-100 bg-slate-50/50"
                    onWheel={handleWheel}
                  >
                    <div className="flex gap-2 p-2 w-max">
                      {filteredCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              category_id: cat.id,
                            }))
                          }
                          className={cn(
                            "flex flex-col items-center justify-center min-w-[60px] h-[60px] rounded-xl border transition-all relative shrink-0",
                            form.category_id === cat.id
                              ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-sm"
                              : "border-transparent bg-white hover:border-slate-200",
                          )}
                        >
                          <CategoryIcon
                            icon={cat.icon}
                            type={cat.type}
                            size="sm"
                          />
                          <span className="text-[9px] mt-1 font-bold text-slate-600 truncate w-full text-center px-1">
                            {cat.name}
                          </span>
                          {form.category_id === cat.id && (
                            <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                              <Check className="w-2 h-2" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" className="h-1.5" />
                  </ScrollArea>
                </div>
              </div>

              {/* 3. 내용 입력 */}
              <div className="space-y-1 px-0.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  내용 (필수)
                </Label>
                <Input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="예: 월세, 넷플릭스 구독"
                  className="h-10 bg-slate-50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20 text-sm font-bold w-full"
                />
              </div>

              {/* 4. 금액 입력 */}
              <div className="space-y-1 px-0.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  금액
                </Label>
                <div className="relative w-full">
                  <Input
                    type="text"
                    name="amount"
                    value={form.amount}
                    onFocus={(e) => e.target.select()}
                    onChange={handleAmountChange}
                    onBlur={handleAmountBlur}
                    placeholder="0"
                    className="text-lg font-black text-right h-10 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500/20 rounded-xl px-6 w-full"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm font-bold">
                    ₩
                  </span>
                </div>
              </div>

              {/* 5. 반복 주기 (탭 버튼) */}
              <div className="space-y-1 px-0.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  반복 주기
                </Label>
                <div className="flex p-1 bg-slate-100 rounded-xl w-full">
                  {[
                    { value: "daily", label: "매일" },
                    { value: "weekly", label: "매주" },
                    { value: "monthly", label: "매월" },
                    { value: "yearly", label: "매년" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          frequency: item.value as any,
                        }))
                      }
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                        form.frequency === item.value
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-400 hover:text-slate-600",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. 시작일 & 종료일 (가로 배치 정렬 수정) */}
              <div className="grid grid-cols-2 gap-3 px-0.5 w-full">
                <div className="space-y-1">
                  <div className="h-5 flex items-center">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      시작일
                    </Label>
                  </div>
                  <div className="relative group">
                    <Input
                      name="start_date"
                      value={form.start_date}
                      onChange={handleChange}
                      onBlur={() => handleDateBlur("start_date")}
                      className="h-10 bg-slate-50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20 pr-8 text-xs font-bold w-full"
                      placeholder="YYYY-MM-DD"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors">
                          <CalendarIcon className="w-3.5 h-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={
                            form.start_date
                              ? parseISO(form.start_date)
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              setForm((prev) => ({
                                ...prev,
                                start_date: format(date, "yyyy-MM-dd"),
                              }));
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="h-5 flex items-center justify-between">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      종료일 (선택)
                    </Label>
                    {form.end_date && (
                      <button
                        onClick={() =>
                          setForm((p) => ({ ...p, end_date: undefined }))
                        }
                        className="text-[9px] font-bold text-rose-400 hover:text-rose-600"
                      >
                        초기화
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Input
                      name="end_date"
                      value={form.end_date || ""}
                      onChange={handleChange}
                      onBlur={() => handleDateBlur("end_date")}
                      className="h-10 bg-slate-50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20 pr-8 text-xs font-bold w-full"
                      placeholder="무기한"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors">
                          <CalendarIcon className="w-3.5 h-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={
                            form.end_date ? parseISO(form.end_date) : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              setForm((prev) => ({
                                ...prev,
                                end_date: format(date, "yyyy-MM-dd"),
                              }));
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="pt-2 mt-auto">
            <Button
              className="w-full h-12 text-sm font-black rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-[0.98]"
              onClick={handleSubmit}
            >
              반복 설정 저장
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RecurringFormSheet;
