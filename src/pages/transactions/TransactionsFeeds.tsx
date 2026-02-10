import { useEffect, useMemo, useState } from "react";
import { useTransactionStore } from "@/store/useTransactionStore";
import { DailySummaryCard } from "./DailySummaryCard";
import { TransactionDetailTable } from "./components/TransactionDetailTable";
import {
  TransactionFilterPanel,
  FilterState,
} from "./components/TransactionFilterPanel";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronDown, ChevronRight } from "lucide-react";
import { TrendBadge } from "./TransactionBadge";
import { DailySummary, MonthlyTotalSummary } from "@/types";
import { isWithinInterval, parseISO, startOfDay } from "date-fns";

export default function TransactionsFeeds() {
  const {
    transactions, // All transactions
    fetchTransactions,
  } = useTransactionStore();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    keyword: "",
    categoryIds: [],
    dateRange: undefined,
    minAmount: "",
    maxAmount: "",
  });

  // Load all transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Set initial expanded month
  useEffect(() => {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    setExpandedMonths([currentYearMonth]);
  }, []);

  // 1. Filter Transactions Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Keyword
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const descMatch = t.description.toLowerCase().includes(keyword);
        const remarkMatch = t.remarks?.toLowerCase().includes(keyword);
        if (!descMatch && !remarkMatch) return false;
      }

      // Category
      if (
        filters.categoryIds.length > 0 &&
        t.category_id &&
        !filters.categoryIds.includes(t.category_id)
      ) {
        return false;
      }

      // Date Range
      if (filters.dateRange?.from) {
        const tDate = parseISO(t.date);
        const { from, to } = filters.dateRange;
        // If 'to' is undefined, it behaves like single day selection or open range?
        // Typically react-day-picker sets 'to' if range selected.
        // Let's assume strict range if 'to' is present, otherwise start >= from
        if (to) {
          if (
            !isWithinInterval(tDate, {
              start: startOfDay(from),
              end: endOfDay(to),
            })
          )
            return false;
        } else {
          // If only start date is selected, maybe show transactions on or after?
          // Or exact match? Usually Range picker implies range.
          // Let's check if just compare >= start
          if (tDate < startOfDay(from)) return false;
        }
      }

      // Amount Range
      if (filters.minAmount && t.amount < Number(filters.minAmount))
        return false;
      if (filters.maxAmount && t.amount > Number(filters.maxAmount))
        return false;

      return true;
    });
  }, [transactions, filters]);

  // Helper for Date Range
  function endOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  // 2. Aggregate Daily Summaries (Frontend)
  const computedDailySummaries = useMemo(() => {
    const map = new Map<string, DailySummary>();

    filteredTransactions.forEach((t) => {
      if (!map.has(t.date)) {
        map.set(t.date, {
          date: t.date,
          income_total: 0,
          expense_total: 0,
          income_count: 0,
          expense_count: 0,
          total_count: 0,
        });
      }
      const summary = map.get(t.date)!;
      if (t.type === 0) {
        summary.income_total += t.amount;
        summary.income_count += 1;
      } else {
        summary.expense_total += t.amount;
        summary.expense_count += 1;
      }
      summary.total_count += 1;
    });

    // Sort by date desc
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [filteredTransactions]);

  // 3. Aggregate Monthly Summaries (Frontend)
  const computedMonthlySummaries = useMemo(() => {
    const map = new Map<string, MonthlyTotalSummary>();

    filteredTransactions.forEach((t) => {
      const date = new Date(t.date);
      const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;

      if (!map.has(yearMonth)) {
        map.set(yearMonth, {
          year_month: yearMonth,
          income_total: 0,
          expense_total: 0,
          income_count: 0,
          expense_count: 0,
          total_count: 0,
        });
      }
      const summary = map.get(yearMonth)!;
      if (t.type === 0) {
        summary.income_total += t.amount;
        summary.income_count += 1;
      } else {
        summary.expense_total += t.amount;
        summary.expense_count += 1;
      }
      summary.total_count += 1;
    });

    return Array.from(map.values());
  }, [filteredTransactions]);

  const toggleMonth = (yearMonth: string) => {
    setExpandedMonths((prev) =>
      prev.includes(yearMonth)
        ? prev.filter((m) => m !== yearMonth)
        : [...prev, yearMonth],
    );
  };

  const handleDateClick = (date: string) => {
    if (selectedDate === date) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
      // No backend fetch needed, we have filteredTransactions
    }
  };

  // Get transactions for the selected date from filtered list
  const selectedDateTransactions = useMemo(() => {
    if (!selectedDate) return [];
    return filteredTransactions.filter((t) => t.date === selectedDate);
  }, [selectedDate, filteredTransactions]);

  const renderItems = useMemo(() => {
    let lastYearMonth = "";
    const items: React.ReactNode[] = [];

    computedDailySummaries.forEach((summary) => {
      const date = new Date(summary.date);
      const currentYear = date.getFullYear().toString();
      const monthNumber = date.getMonth() + 1;
      const currentMonthDisplay = monthNumber.toString();
      const currentYearMonth = `${currentYear}-${monthNumber
        .toString()
        .padStart(2, "0")}`;

      const isNewMonth = currentYearMonth !== lastYearMonth;
      const isExpanded = expandedMonths.includes(currentYearMonth);

      if (isNewMonth) {
        lastYearMonth = currentYearMonth;
        const monthStats = computedMonthlySummaries.find(
          (m) => m.year_month === currentYearMonth,
        );

        items.push(
          <div
            key={`header-${currentYearMonth}`}
            className="sticky top-[-24px] z-30 pt-3 pb-0 mb-2 group cursor-pointer"
            onClick={() => toggleMonth(currentYearMonth)}
          >
            <div className="relative flex items-center justify-between gap-4 pt-10 p-4 pl-0 rounded-2xl bg-white/60 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-white/40 hover:bg-white/80 transition-all duration-300">
              <div className="absolute left-[19px] top-0 bottom-0 flex flex-col items-center justify-center -translate-x-1/2">
                <div className="w-[1px] h-full pt-10 bg-slate-200 group-hover:bg-slate-300 transition-colors" />
                <div className="z-10 flex items-center justify-center w-7 h-7 rounded-full bg-white border-2 border-slate-200 shadow-sm group-hover:border-slate-800 group-hover:bg-slate-800 transition-all duration-300">
                  {isExpanded ? (
                    <ChevronDown
                      size={14}
                      className="text-slate-500 group-hover:text-white"
                      strokeWidth={3}
                    />
                  ) : (
                    <ChevronRight
                      size={14}
                      className="text-slate-500 group-hover:text-white"
                      strokeWidth={3}
                    />
                  )}
                </div>
                <div className="w-[1px] h-full bg-slate-200 group-hover:bg-slate-300 transition-colors" />
              </div>

              <div className="flex items-center justify-between w-full pl-12 pr-1">
                <div className="flex items-baseline gap-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold text-slate-400 tracking-tighter">
                      {currentYear}
                    </span>
                    <span className="text-2xl font-black text-slate-800 tracking-tight">
                      {currentMonthDisplay}월
                    </span>
                  </div>

                  {monthStats && (
                    <div className="flex items-center gap-1.2 ml-2 px-2.5 py-0.5 rounded-full bg-slate-100/80 text-[10px] font-bold text-slate-500 border border-slate-200/50 uppercase">
                      {monthStats.total_count} 건
                    </div>
                  )}
                </div>

                {monthStats && (
                  <div className="flex items-center gap-2">
                    <TrendBadge
                      type="income"
                      amount={monthStats.income_total}
                      className="shadow-none bg-transparent border-none min-w-fit gap-1"
                      isSimple
                    />
                    <div className="w-[1px] h-3 bg-slate-200" />
                    <TrendBadge
                      type="expense"
                      amount={monthStats.expense_total}
                      className="shadow-none bg-transparent border-none min-w-fit gap-1"
                      isSimple
                    />
                  </div>
                )}
              </div>
            </div>
          </div>,
        );
      }

      if (isExpanded) {
        items.push(
          <div key={summary.date} className="relative z-10 flex flex-col mb-2">
            <DailySummaryCard
              summary={summary}
              isSelected={selectedDate === summary.date}
              onClick={() => handleDateClick(summary.date)}
            />
            {selectedDate === summary.date && (
              <div className="mt-4 mb-2">
                <TransactionDetailTable
                  transactions={selectedDateTransactions}
                />
              </div>
            )}
          </div>,
        );
      }
    });

    return items;
  }, [
    computedDailySummaries,
    computedMonthlySummaries,
    expandedMonths,
    selectedDate,
    selectedDateTransactions,
  ]);

  return (
    <div className="flex flex-col min-h-full bg-transparent relative">
      {!isFilterVisible && (
        <div className="fixed top-1/2 -translate-y-1/2 right-6 z-50">
          <Button
            onClick={() => setIsFilterVisible(true)}
            className="rounded-l-full h-12 w-10 pl-3 pr-1 shadow-lg bg-slate-800 hover:bg-slate-700 text-white"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>
      )}

      <div className="flex relative items-start pr-6 w-full">
        <div
          className={`relative ${
            isFilterVisible ? "w-[70%] mr-8" : "w-full max-w-4xl mx-auto"
          }`}
        >
          <div className="absolute left-[19px] top-10 bottom-0 w-[1px] bg-slate-200 z-0" />
          <div className="flex flex-col relative z-10">{renderItems}</div>
        </div>

        {isFilterVisible && (
          <div className="sticky top-4 w-[25%] min-w-[280px] mt-12 shrink-0">
            <TransactionFilterPanel
              onClose={() => setIsFilterVisible(false)}
              onApplyFilter={setFilters}
              initialFilters={filters}
            />
          </div>
        )}
      </div>
    </div>
  );
}
