import { useEffect, useMemo, useState } from "react";
import { useTransactionStore } from "@/store/useTransactionStore";
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
import { useConfirmStore } from "@/store/useConfirmStore";
import { Transaction, TransactionWithCategory } from "@/types";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Pin, Pencil, Trash2, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { MonthYearPicker } from "@/components/MonthYearPicker";

export default function TransactionsCalendar() {
  const {
    dailySummaries,
    fetchFilteredAll,
    setFilters,
    loading,
    fetchTransactionsByDate,
    dateTransactions,
    deleteTransaction,
    setEditingTransaction,
    setSheetOpen,
  } = useTransactionStore();

  const { confirm } = useConfirmStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    setFilters({});
    fetchFilteredAll({});
  }, []);

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
    const daysInMonth = dailySummaries.filter((d) => d.date.startsWith(yearMonth));
    const income = daysInMonth.reduce((acc, curr) => acc + curr.income_total, 0);
    const expense = daysInMonth.reduce((acc, curr) => acc + curr.expense_total, 0);
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
      title: "가계부 기록 삭제",
      description: "이 거래 내역을 정말 삭제하시겠습니까? \n 삭제 후에는 복구할 수 없습니다.",
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
    <div className="flex flex-col h-auto max-h-[calc(100vh-80px)] bg-transparent relative px-4 py-1 overflow-hidden">
      <div className="sticky top-0 z-40 -mx-4 px-4 pb-2 pt-2 bg-background backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 mb-1 shrink-0">
        <div className="max-w-full mx-auto">
          <TransactionFilterPanel />
        </div>
      </div>

      <div className="flex-1 w-full max-w-full mx-auto flex flex-col gap-2 pb-4 overflow-hidden">
        <div className="flex-1 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-2 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {format(currentMonth, "M")}월
                </span>
                <span className="text-lg font-semibold text-slate-400">
                  {format(currentMonth, "yyyy")}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2" />
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-500 font-medium">수입</span>
                  <span className="font-bold text-emerald-600">{monthlySummary.income.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-slate-500 font-medium">지출</span>
                  <span className="font-bold text-rose-600">{monthlySummary.expense.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">합계</span>
                  <span className={cn("font-bold", monthlySummary.total >= 0 ? "text-slate-700 dark:text-slate-200" : "text-rose-600")}>
                    {monthlySummary.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <MonthYearPicker 
              selectedMonth={format(currentMonth, "yyyy-MM")} 
              onMonthChange={handleMonthYearChange} 
            />
          </div>

          <div className="flex-1 overflow-hidden">
            <Calendar
              mode="single"
              locale={ko}
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
                head_row: "flex w-full border-b border-slate-100 dark:border-slate-800 pb-2 shrink-0",
                head_cell: "text-slate-400 rounded-md w-full font-bold text-[0.8rem] uppercase tracking-wider text-center",
                row: "flex w-full flex-1 border-b last:border-0 border-slate-50 dark:border-slate-900 min-h-0",
                cell: "flex-1 w-full text-center text-sm p-0 relative focus-within:relative focus-within:z-20 h-full",
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
                        "h-full w-full p-1.5 font-normal transition-all flex flex-col items-start justify-start gap-1 group min-h-[85px]",
                        modifiers.selected && "bg-slate-100/80 dark:bg-slate-800/80 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]",
                        modifiers.today && "bg-slate-50/50 dark:bg-slate-900/30",
                        isOutside && "opacity-30",
                        !modifiers.selected && !isOutside && "hover:bg-slate-50 dark:hover:bg-slate-900"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors shrink-0",
                        isSunday && "text-rose-500",
                        isSaturday && "text-blue-500",
                        modifiers.today && "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm",
                        !modifiers.today && !isSunday && !isSaturday && "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                      )}>
                        {day.date.getDate()}
                      </span>
                      
                      <div className="flex flex-col w-full gap-0.5 mt-auto pb-1 min-h-[32px]">
                        {data && (
                          <>
                            {data.income > 0 && (
                              <div className="flex items-center justify-between w-full px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold truncate">
                                <span>+</span>
                                <span>{data.income.toLocaleString()}</span>
                              </div>
                            )}
                            {data.expense > 0 && (
                              <div className="flex items-center justify-between w-full px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/30 text-[10px] text-rose-700 dark:text-rose-400 font-bold truncate">
                                <span>-</span>
                                <span>{data.expense.toLocaleString()}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </button>
                  );
                }
              }}
            />
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-none bg-transparent shadow-none">
          <AnimatePresence>
            {isDialogOpen && (
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
                          {selectedDate && format(selectedDate, "M월 d일", { locale: ko })}
                        </DialogTitle>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          {selectedDate && format(selectedDate, "eeee", { locale: ko })} • 상세 내역 {dateTransactions.length}건
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">일일 합계</p>
                       <span className={cn(
                         "text-xl font-black tabular-nums tracking-tight",
                         (dateTransactions.reduce((acc, curr) => acc + (curr.type === 0 ? curr.amount : -curr.amount), 0)) >= 0 
                           ? "text-emerald-600" 
                           : "text-rose-600"
                       )}>
                         {(dateTransactions.reduce((acc, curr) => acc + (curr.type === 0 ? curr.amount : -curr.amount), 0)).toLocaleString()}
                         <small className="text-xs ml-0.5 font-bold opacity-70">원</small>
                       </span>
                    </div>
                  </div>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-y-auto min-h-[300px]">
                  <div className="p-4 space-y-3">
                    {dateTransactions.length > 0 ? (
                      dateTransactions.sort((a,b) => a.type - b.type).map((tx, idx) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <CategoryIcon type={tx.type} icon={tx.category_icon} size="md" />
                              {tx.is_fixed === 1 && (
                                <div className="absolute -top-1 -right-1 p-1 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                                  <Pin className="w-2.5 h-2.5 text-slate-400 fill-slate-400 rotate-45" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-400 mb-0.5 uppercase tracking-tighter">
                                {tx.category_name}
                              </span>
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[150px]">
                                {tx.description || tx.category_name}
                              </span>
                              {tx.remarks && (
                                <span className="text-[11px] text-slate-400 italic mt-0.5 line-clamp-1">
                                  "{tx.remarks}"
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right flex flex-col">
                              <span className={cn(
                                "text-base font-black tabular-nums tracking-tight",
                                tx.type === 0 ? "text-emerald-600" : "text-blue-600"
                              )}>
                                {tx.type === 0 ? "+" : "-"}{tx.amount.toLocaleString()}
                                <small className="text-xs ml-0.5 font-bold">원</small>
                              </span>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900"
                                onClick={() => handleEdit(tx)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600"
                                onClick={() => handleDelete(tx.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                        <ReceiptText className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm font-medium">기록된 내역이 없습니다</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 shrink-0">
                   <Button 
                    variant="ghost" 
                    className="w-full h-12 rounded-2xl font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                    onClick={() => setIsDialogOpen(false)}
                   >
                     닫기
                   </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}
