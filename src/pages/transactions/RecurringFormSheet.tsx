import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { Category, RecurringTransaction } from "@/types";
import { toast } from "sonner";
import { cn, smartParseDate, evaluateExpression } from "@/lib/utils";
import { CategoryIcon } from "@/components/CategoryIcon";
import {
  Check,
  CalendarIcon,
  Pin,
  CirclePlus,
  CircleMinus,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingStore } from "@/stores/useSettingStore";
import { recurringSchema } from "@/schemas/recurring";
import { useTranslation } from "react-i18next";

interface RecurringFormState extends Omit<RecurringTransaction, "amount"> {
  amount: string | number;
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
  const { t, i18n } = useTranslation();
  const { dateFormat } = useSettingStore();

  const [form, setForm] = useState<RecurringFormState>(
    transaction as RecurringFormState
  );
  const [transactionType, setTransactionType] = useState<0 | 1>(1);

  // 에러 상태 및 타이머 관리를 위한 Ref
  const [errors, setErrors] = useState<Record<string, string>>({});
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isStartDateFocused, setIsStartDateFocused] = useState(false);
  const [isEndDateFocused, setIsEndDateFocused] = useState(false);

  const getDisplayDate = (dateStr?: string, isFocused?: boolean) => {
    if (isFocused || !dateStr) return dateStr || "";
    try {
      const d = parseISO(dateStr);
      if (!isNaN(d.getTime())) {
        return format(d, dateFormat, {
          locale: i18n.language === "ko" ? ko : enUS,
        });
      }
    } catch {}
    return dateStr;
  };

  useEffect(() => {
    if (!open) {
      setErrors({});
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      return;
    }

    const initialAmount = transaction.amount
      ? new Intl.NumberFormat().format(Number(transaction.amount))
      : "0";

    setForm({
      ...transaction,
      amount: initialAmount,
      is_fixed: transaction.is_fixed ?? 0,
    });

    if (transaction.category_id) {
      const cat = categories.find((c) => c.id === transaction.category_id);
      if (cat) {
        setTransactionType(cat.type as 0 | 1);
      }
    }
  }, [transaction, categories, open]);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => c.type === transactionType);
  }, [categories, transactionType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
    const schema = recurringSchema(t);
    const result = schema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);

      // 기존 타이머가 있다면 클리어
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }

      // 3초 후 에러 상태를 초기화하여 툴팁과 붉은 테두리를 일시적으로만 보여줌
      errorTimeoutRef.current = setTimeout(() => {
        setErrors({});
      }, 3000);

      toast.error(
        t("recurring.form.validation.check_inputs", "입력 항목을 확인해주세요.")
      );
      return;
    }

    setErrors({});
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);

    onSave({
      ...form,
      amount: result.data.amount,
      category_id: result.data.category_id,
    } as RecurringTransaction);

    onOpenChange(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const viewport = e.currentTarget.querySelector(
      '[data-slot="scroll-area-viewport"]'
    );
    if (viewport) viewport.scrollLeft += e.deltaY;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="top-12 h-[calc(100vh-theme(spacing.12))] sm:max-w-[450px]"
      >
        <SheetHeader className="mb-2 space-y-1 px-1">
          <SheetTitle>
            {form.id
              ? t("recurring.form.title_edit")
              : t("recurring.form.title_add")}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full pb-15">
          <ScrollArea className="flex-1 -mr-2 pr-2">
            <div className="space-y-4 pb-4">
              {/* 1. 타입 및 고정핀 */}
              <div className="flex items-center gap-2 mt-1 min-h-[52px]">
                <div className="flex-1 p-1 bg-slate-100/60 rounded-2xl flex gap-1 h-12 items-center">
                  {[
                    {
                      id: 0,
                      name: t("common.income"),
                      icon: CirclePlus,
                      color: "text-emerald-500",
                    },
                    {
                      id: 1,
                      name: t("common.expense"),
                      icon: CircleMinus,
                      color: "text-blue-500",
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTransactionType(item.id as 0 | 1);
                        setForm((prev) => ({
                          ...prev,
                          category_id: undefined,
                          is_fixed: item.id === 0 ? 0 : prev.is_fixed,
                        }));
                      }}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl transition-all font-bold text-sm outline-none",
                        transactionType === item.id
                          ? "bg-white shadow-sm"
                          : "text-slate-400 hover:text-slate-500"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-4 h-4",
                          transactionType === item.id
                            ? item.color
                            : "text-slate-300"
                        )}
                      />
                      {item.name}
                    </button>
                  ))}
                </div>
                <AnimatePresence mode="popLayout">
                  {transactionType === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20, width: 0 }}
                      animate={{ opacity: 1, x: 0, width: "auto" }}
                      exit={{ opacity: 0, x: 10, width: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                      className="flex items-center"
                    >
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  is_fixed: prev.is_fixed === 1 ? 0 : 1,
                                }))
                              }
                              className={cn(
                                "w-12 h-12 flex items-center justify-center rounded-2xl transition-all border shrink-0 active:scale-90 ml-1",
                                form.is_fixed === 1
                                  ? "bg-black border-black text-white shadow-md shadow-slate-200"
                                  : "bg-slate-50 border-slate-100 text-slate-300"
                              )}
                            >
                              <Pin
                                className={cn(
                                  "w-4 h-4 transition-transform duration-300",
                                  form.is_fixed === 1 && "fill-white rotate-45"
                                )}
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-slate-800 text-white border-none text-[10px] font-bold"
                          >
                            {t("recurring.form.fixed_setting")}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. 카테고리 (가로 스크롤 + 임시 툴팁) */}
              <div className="space-y-2 w-full overflow-hidden">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">
                  {t("common.category")}
                </Label>

                <TooltipProvider delayDuration={0}>
                  {/* open 속성을 강제로 제어하여 에러가 있을 때만 툴팁이 열리게 함 */}
                  <Tooltip open={!!errors.category_id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "w-full max-w-[calc(450px-48px)] overflow-hidden rounded-xl transition-all duration-300"
                        )}
                      >
                        <ScrollArea
                          className={cn(
                            "w-full whitespace-nowrap rounded-xl border border-slate-100 bg-slate-50/50 transition-colors duration-300",
                            errors.category_id && "border-red-500 border-2"
                          )}
                          onWheel={handleWheel}
                        >
                          <div className="flex gap-2 p-2 w-max">
                            {filteredCategories.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setForm((prev) => ({
                                    ...prev,
                                    category_id: cat.id,
                                  }));
                                }}
                                className={cn(
                                  "flex flex-col items-center justify-center min-w-[60px] h-[60px] rounded-xl border transition-all relative shrink-0",
                                  form.category_id === cat.id
                                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-sm"
                                    : "border-transparent bg-white hover:border-slate-200"
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
                          <ScrollBar
                            orientation="horizontal"
                            className="h-1.5"
                          />
                        </ScrollArea>
                      </div>
                    </TooltipTrigger>
                    {errors.category_id && (
                      <TooltipContent className="bg-red-500 text-white border-none font-bold text-xs">
                        {errors.category_id}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* 3. 상세 내역 (임시 툴팁) */}
              <div className="space-y-1 px-0.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {t("quick_entry.headers.description")}
                </Label>
                <TooltipProvider delayDuration={0}>
                  <Tooltip open={!!errors.description}>
                    <TooltipTrigger asChild>
                      <Input
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder={t(
                          "transaction_form.description_placeholder"
                        )}
                        className={cn(
                          "h-10 border-none rounded-xl text-sm font-bold transition-all duration-300",
                          errors.description
                            ? "bg-red-50 ring-2 ring-red-500 text-red-900"
                            : "bg-slate-50"
                        )}
                      />
                    </TooltipTrigger>
                    {errors.description && (
                      <TooltipContent className="bg-red-500 text-white border-none font-bold text-xs">
                        {errors.description}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* 4. 금액 (임시 툴팁) */}
              <div className="space-y-1 px-0.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {t("common.amount")}
                </Label>
                <div className="relative">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip open={!!errors.amount}>
                      <TooltipTrigger asChild>
                        <Input
                          name="amount"
                          value={form.amount}
                          onChange={handleAmountChange}
                          onBlur={handleAmountBlur}
                          onFocus={(e) => e.target.select()}
                          className={cn(
                            "text-lg font-black text-right h-10 border-none rounded-xl px-6 transition-all duration-300",
                            errors.amount
                              ? "bg-red-50 ring-2 ring-red-500 text-red-900"
                              : "bg-slate-50"
                          )}
                        />
                      </TooltipTrigger>
                      {errors.amount && (
                        <TooltipContent
                          side="top"
                          className="bg-red-500 text-white border-none font-bold text-xs"
                        >
                          {errors.amount}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* 5. 메모 */}
              <div className="space-y-1 px-0.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {t("common.remarks")}
                </Label>
                <Input
                  name="remarks"
                  value={form.remarks || ""}
                  onChange={handleChange}
                  placeholder="..."
                  className="h-10 bg-slate-50 border-none rounded-xl text-xs font-bold"
                />
              </div>

              {/* 6. 반복 주기 */}
              <div className="space-y-1 px-0.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {t("recurring.form.frequency")}
                </Label>
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  {["daily", "weekly", "monthly", "yearly"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, frequency: f as any }))
                      }
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                        form.frequency === f
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-400"
                      )}
                    >
                      {t(`recurring.form.frequencies.${f}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. 기간 설정 */}
              <div className="grid grid-cols-2 gap-3 px-0.5">
                {/* 시작일 섹션 (임시 툴팁) */}
                <div className="space-y-1">
                  <div className="h-5 flex items-end">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">
                      {t("recurring.form.start_date")}
                    </Label>
                  </div>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip open={!!errors.start_date}>
                      <TooltipTrigger asChild>
                        <div className="relative group w-full">
                          <Input
                            name="start_date"
                            value={getDisplayDate(
                              form.start_date,
                              isStartDateFocused
                            )}
                            onChange={handleChange}
                            onFocus={() => setIsStartDateFocused(true)}
                            onBlur={() => {
                              setIsStartDateFocused(false);
                              handleDateBlur("start_date");
                            }}
                            className={cn(
                              "h-10 border-none rounded-xl focus-visible:ring-2 pr-8 text-xs font-bold w-full transition-all duration-300",
                              errors.start_date
                                ? "bg-red-50 ring-2 ring-red-500 text-red-900 focus-visible:ring-red-500"
                                : "bg-slate-50 focus-visible:ring-blue-500/20"
                            )}
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
                                locale={i18n.language === "ko" ? ko : enUS}
                                selected={
                                  form.start_date
                                    ? parseISO(form.start_date)
                                    : undefined
                                }
                                onSelect={(d) => {
                                  if (d) {
                                    setForm((p) => ({
                                      ...p,
                                      start_date: format(d, "yyyy-MM-dd"),
                                    }));
                                  }
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TooltipTrigger>
                      {errors.start_date && (
                        <TooltipContent
                          side="top"
                          className="bg-red-500 text-white border-none font-bold text-xs"
                        >
                          {errors.start_date}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* 종료일 섹션 */}
                <div className="space-y-1">
                  <div className="h-5 flex items-end justify-between">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">
                      {t("recurring.form.end_date")}
                    </Label>
                    {form.end_date && (
                      <button
                        onClick={() =>
                          setForm((p) => ({ ...p, end_date: undefined }))
                        }
                        className="text-[9px] font-bold text-rose-400 hover:text-rose-600 transition-colors pb-0.5"
                      >
                        {t("common.cancel")}
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Input
                      name="end_date"
                      value={getDisplayDate(form.end_date, isEndDateFocused)}
                      onChange={handleChange}
                      onFocus={() => setIsEndDateFocused(true)}
                      onBlur={() => {
                        setIsEndDateFocused(false);
                        handleDateBlur("end_date");
                      }}
                      className="h-10 bg-slate-50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20 pr-8 text-xs font-bold w-full"
                      placeholder={t("recurring.form.no_end_date")}
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
                          locale={i18n.language === "ko" ? ko : enUS}
                          selected={
                            form.end_date ? parseISO(form.end_date) : undefined
                          }
                          onSelect={(d) =>
                            d &&
                            setForm((p) => ({
                              ...p,
                              end_date: format(d, "yyyy-MM-dd"),
                            }))
                          }
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
              className="w-full h-12 text-sm font-black rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl"
              onClick={handleSubmit}
            >
              {t("recurring.form.save")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RecurringFormSheet;
