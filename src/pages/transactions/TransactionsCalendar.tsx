import { useEffect, useMemo, useState, useRef } from "react";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { TransactionFilterPanel } from "./components/TransactionFilterPanel";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { ko } from "date-fns/locale";
import { useConfirmStore } from "@/stores/useConfirmStore";
import { Transaction, TransactionWithCategory } from "@/types";
import { CategoryIcon, FixIcon } from "@/components/CategoryIcon";
import {
  Pin,
  Pencil,
  Trash2,
  ReceiptText,
  MinusCircle,
  PlusCircle,
  X,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useDateFormatter } from "@/hooks/useDateFormatter";
import { useTranslation } from "react-i18next";

export default function TransactionsCalendar() {
  const { t, i18n } = useTranslation();
  const {
    filters,
    dailySummaries,
    fetchTransactionsByDate,
    dateTransactions,
    deleteTransaction,
    setEditingTransaction,
    setSheetOpen,
  } = useTransactionStore();

  const { confirm } = useConfirmStore();
  const { formatAmount } = useCurrencyFormatter();
  const { formatYear, formatMonth, formatFullDate, getDateParts } = useDateFormatter();
  const filterRef = useRef<HTMLDivElement>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // 1. 필터 활성화 여부 계산
  const isFilterActive = useMemo(() => {
    return (
      (filters.keyword && filters.keyword.trim() !== "") ||
      filters.tx_type !== undefined ||
      filters.is_fixed !== undefined ||
      (filters.category_ids && filters.category_ids.length > 0) ||
      filters.start_date !== undefined ||
      filters.end_date !== undefined ||
      filters.min_amount !== undefined ||
      filters.max_amount !== undefined
    );
  }, [filters]);

  // 2. ESC 키 및 외부 클릭 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFilterVisible(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 1. 필터 패널 자체 내부를 클릭한 경우 무시
      if (filterRef.current && filterRef.current.contains(target)) {
        return;
      }

      // 2. 토글 버튼을 클릭한 경우 무시 (토글 버튼의 onClick에서 처리하므로)
      if (target.closest(".filter-toggle-button")) {
        return;
      }

      // 3. (중요) Radix UI나 Shadcn UI의 Portal 요소(Select, Popover 등) 내부 클릭인지 확인
      // 보통 data-radix-popper-content-wrapper 속성을 가집니다.
      const isInsidePortal = target.closest(
        "[data-radix-popper-content-wrapper]"
      );
      if (isInsidePortal) {
        return;
      }

      // 위 조건들에 해당하지 않는 "진짜 외부" 클릭 시에만 닫기
      setIsFilterVisible(false);
    };

    if (isFilterVisible) {
      // mousedown 대신 pointerdown을 사용하면 터치 환경에서도 더 정확합니다.
      window.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFilterVisible]);
  const dailyMap = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    dailySummaries.forEach((day) => {
      map.set(day.date, {
        income: day.income_total,
        expense: day.expense_total,
      });
    });
    return map;
  }, [dailySummaries]);

  const monthlySummary = useMemo(() => {
    const yearMonth = format(currentMonth, "yyyy-MM");
    const daysInMonth = dailySummaries.filter((d) =>
      d.date.startsWith(yearMonth)
    );
    const income = daysInMonth.reduce(
      (acc, curr) => acc + curr.income_total,
      0
    );
    const expense = daysInMonth.reduce(
      (acc, curr) => acc + curr.expense_total,
      0
    );
    const total = income - expense;
    return { income, expense, total };
  }, [dailySummaries, currentMonth]);

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    const dateStr = format(date, "yyyy-MM-dd");
    await fetchTransactionsByDate(dateStr);
    setIsDialogOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setSheetOpen(true);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    confirm({
      title: t("confirm_delete"),
      description: t("confirm_delete_transaction_message"),
      onConfirm: async () => {
        await deleteTransaction(id);
        if (selectedDate) {
          await fetchTransactionsByDate(format(selectedDate, "yyyy-MM-dd"));
        }
      },
    });
  };

  const handleMonthYearChange = (newYearMonth: string) => {
    const newDate = parse(newYearMonth, "yyyy-MM", new Date());
    setCurrentMonth(newDate);
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative px-4 py-1 overflow-hidden">
      {/* 1. 플로팅 필터 패널 */}
      {isFilterVisible && (
        <motion.div
          ref={filterRef}
          initial={false}
          animate={{
            opacity: isFilterVisible ? 1 : 0,
            y: isFilterVisible ? 0 : 20,
            scale: isFilterVisible ? 1 : 0.95,
            pointerEvents: isFilterVisible ? "auto" : "none", // 닫혔을 때 클릭 방지
          }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 right-8 z-[50] w-[80%] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800"
        >
          <TransactionFilterPanel />
        </motion.div>
      )}

      {/* 2. 플로팅 실행 버튼 */}
      <div className="fixed bottom-8 right-8 z-[50]">
        <Button
          onClick={() => setIsFilterVisible(!isFilterVisible)}
          className={cn(
            "filter-toggle-button w-14 h-14 rounded-full shadow-2xl transition-all duration-300 relative",
            isFilterVisible ? "bg-slate-800" : "bg-blue-600 hover:bg-blue-700"
          )}
        >
          {isFilterVisible ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Filter className="w-6 h-6 text-white" />
          )}

          {/* 필터 활성화 시 배지 표시 */}
          {isFilterActive && !isFilterVisible && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 border-2 border-white dark:border-slate-950 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
            >
              !
            </motion.span>
          )}
        </Button>
      </div>

      <div className="flex-1 w-full max-w-full mx-auto flex flex-col gap-2 pb-4 h-full mt-3">
        <div className="flex-1 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-2 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {formatMonth(currentMonth.toISOString(), "long")}
                </span>
                <span className="text-lg font-semibold text-slate-400">
                  {formatYear(currentMonth.getFullYear())}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2" />
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-slate-500 font-medium">{t("common.expense")}</span>
                  <span className="font-bold text-blue-600">
                    {formatAmount(monthlySummary.expense)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-500 font-medium">{t("common.income")}</span>
                  <span className="font-bold text-emerald-600">
                    {formatAmount(monthlySummary.income)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">{t("common.net_income")}</span>
                  <span
                    className={cn(
                      "font-bold",
                      monthlySummary.total >= 0
                        ? "text-slate-700 dark:text-slate-200"
                        : "text-rose-600"
                    )}
                  >
                    {formatAmount(monthlySummary.total)}
                  </span>
                </div>
              </div>
            </div>

            <MonthYearPicker
              selectedMonth={format(currentMonth, "yyyy-MM")}
              onMonthChange={handleMonthYearChange}
            />
          </div>

          <div className="flex-1 overflow-hidden mt-2">
            <Calendar
              mode="single"
              locale={i18n.language === "ko" ? ko : undefined}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              selected={selectedDate}
              onSelect={(date) => date && handleDateClick(date)}
              className="w-full h-full p-0 flex flex-col"
              classNames={{
                root: "flex-1 flex flex-col h-full",
                months: "flex-1 flex flex-col w-full h-full",
                month: "flex-1 flex flex-col w-full h-full space-y-0",
                table: "flex-1 w-full border-collapse table-fixed h-full",
                head_row:
                  "flex w-full border-b border-slate-100 dark:border-slate-800 pb-2 shrink-0",
                head_cell:
                  "text-slate-400 rounded-md w-full font-bold text-[0.8rem] uppercase tracking-wider text-center",
                row: "flex w-full flex-1 border-b last:border-0 border-slate-50 dark:border-slate-900 min-h-0",
                cell: "flex-1 w-full text-center text-sm p-0 relative border-r last:border-r-0 border-slate-100 dark:border-slate-800/50 focus-within:relative focus-within:z-20 h-full",
                day: "h-full w-full p-0 font-normal transition-colors flex flex-col items-start justify-start hover:bg-slate-50 dark:hover:bg-slate-900/50",
                month_caption: "hidden", // Hide default caption
                nav: "hidden", // Hide default navigation buttons
              }}
              components={{
                DayButton: ({ day, modifiers, ...props }) => {
                  const dateStr = format(day.date, "yyyy-MM-dd");
                  const data = dailyMap.get(dateStr);
                  const isSunday = day.date.getDay() === 0;
                  const isSaturday = day.date.getDay() === 6;
                  const isOutside = modifiers.outside;

                  return (
                    <button
                      {...props}
                      className={cn(
                        "h-full w-full p-1 font-normal transition-all flex flex-col items-start justify-start gap-1 group min-h-[100px] min-2xl:h-[130px]",
                        modifiers.selected &&
                          "bg-slate-100/80 dark:bg-slate-800/80 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]",
                        modifiers.today &&
                          "bg-slate-50/50 dark:bg-slate-900/30",
                        isOutside && "opacity-30",
                        !modifiers.selected &&
                          !isOutside &&
                          "hover:bg-slate-50 dark:hover:bg-slate-900"
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0",
                          "transition-all duration-300 ease-in-out group-hover:text-lg",
                          isSunday && "text-rose-500",
                          isSaturday && "text-blue-500",
                          modifiers.today &&
                            "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm",
                          !modifiers.today &&
                            !isSunday &&
                            !isSaturday &&
                            "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                        )}
                      >
                        {day.date.getDate()}
                      </span>

                      <div className="flex flex-col w-full gap-0.5 mt-auto pb-1 min-h-[50px] items-center">
                        {data && (
                          <>
                            {data.expense > 0 && (
                              <div className="flex items-center justify-between w-[80%] px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/30 text-[11px] text-blue-700 dark:text-blue-400 font-bold truncate min-2xl:text-[13px]">
                                <MinusCircle className="w-3 h-3" />
                                <span>{formatAmount(data.expense)}</span>
                              </div>
                            )}
                            {data.income > 0 && (
                              <div className="flex items-center justify-between w-[80%] px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold truncate min-2xl:text-[13px]">
                                <PlusCircle className="w-3 h-3" />
                                <span>{formatAmount(data.income)}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </button>
                  );
                },
              }}
            />
          </div>
        </div>
      </div>

      <TransactionDetailDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedDate={selectedDate}
        transactions={dateTransactions}
        summary={
          selectedDate
            ? dailyMap.get(format(selectedDate, "yyyy-MM-dd"))
            : undefined
        }
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

interface TransactionDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | undefined;
  transactions: TransactionWithCategory[];
  summary: { income: number; expense: number } | undefined;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => void;
}

function TransactionDetailDialog({
  isOpen,
  onOpenChange,
  selectedDate,
  transactions,
  summary,
  onEdit,
  onDelete,
}: TransactionDetailDialogProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrencyFormatter();
  const { formatFullDate, getDateParts } = useDateFormatter();
  const dateParts = selectedDate ? getDateParts(selectedDate.toISOString()) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-none bg-transparent shadow-none">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <DialogHeader className="p-5 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg shadow-slate-200 dark:shadow-none">
                      <ReceiptText className="w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-black text-slate-800 dark:text-slate-100">
                        {selectedDate && (
                          <span>{dateParts?.month} {dateParts?.day}</span>
                        )}
                      </DialogTitle>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {dateParts?.weekday} • {t("common.count", { count: transactions.length })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 mr-5">
                    {summary?.expense > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-500/80 uppercase">
                          {t("common.expense")}
                        </span>
                        <span className="text-sm font-black text-blue-600 tabular-nums">
                          {formatAmount(summary?.expense)}
                        </span>
                      </div>
                    )}
                    {summary?.income > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-500/80 uppercase">
                          {t("common.income")}
                        </span>
                        <span className="text-sm font-black text-emerald-600 tabular-nums">
                          {formatAmount(summary?.income)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="flex-1 overflow-y-auto min-h-[300px]">
                <div className="p-3 space-y-2">
                  {transactions.length > 0 ? (
                    transactions
                      .sort((a, b) => b.type - a.type)
                      .map((tx, idx) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <CategoryIcon
                                type={tx.type}
                                icon={tx.category_icon}
                                size="sm" // 아이콘 크기 축소
                              />
                              {tx.is_fixed === 1 && <FixIcon />}
                            </div>
                            <div className="flex flex-col">
                              {/* 마진 축소 및 줄간격(leading) 조정 */}
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-1">
                                {tx.category_name}
                              </span>
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[150px] leading-tight">
                                {tx.description || tx.category_name}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "text-sm font-black tabular-nums tracking-tight", // 금액 폰트 사이즈 조정
                                tx.type === 0
                                  ? "text-emerald-600"
                                  : "text-blue-600"
                              )}
                            >
                              {formatAmount(tx.amount)}
                            </span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                              {/* 버튼 사이즈 축소 */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                                onClick={() => onEdit(tx)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full hover:text-rose-600"
                                onClick={() => onDelete(tx.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                      <ReceiptText className="w-10 h-10 mb-3 opacity-20" />
                      <p className="text-sm font-medium">
                        {t("no_transactions_found")}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 shrink-0">
                <Button
                  variant="ghost"
                  className="w-full h-10 rounded-xl font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                  onClick={() => onOpenChange(false)}
                >
                  {t("common.close")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
