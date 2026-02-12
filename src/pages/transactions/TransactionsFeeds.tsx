import { useEffect, useMemo, useState } from "react";
import { useTransactionStore } from "@/store/useTransactionStore";
import { DailySummaryCard } from "./DailySummaryCard";
import { TransactionDetailTable } from "./components/TransactionDetailTable";
import { TransactionFilterPanel } from "./components/TransactionFilterPanel";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Search,
  FilterX,
  ChevronsDown,
  ChevronsUp,
  ListTree,
} from "lucide-react";
import { TrendBadge } from "./TransactionBadge";
import { cn } from "@/lib/utils";
import { useConfirmStore } from "@/store/useConfirmStore";
import { Transaction, TransactionWithCategory } from "@/types";
import { FeedsSkeleton } from "./components/FeedsSkeleton";

export default function TransactionsFeeds() {
  const {
    dailySummaries,
    monthlySummaries,
    transactions,
    fetchFilteredAll,
    setFilters,
    filters,
    loading,
    deleteTransaction,
    setEditingTransaction,
    setSheetOpen,
  } = useTransactionStore();

  const { confirm } = useConfirmStore();

  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // 필터 활성화 여부
  const isFiltering = useMemo(() => {
    return Object.values(filters).some((v) => {
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== "" && v !== null;
    });
  }, [filters]);

  // 성능 최적화: 날짜별 트랜잭션 그룹화
  const transactionsByDate = useMemo(() => {
    const map = new Map<string, TransactionWithCategory[]>();
    transactions.forEach((t) => {
      const existing = map.get(t.date);
      if (existing) {
        existing.push(t);
      } else {
        map.set(t.date, [t]);
      }
    });
    return map;
  }, [transactions]);

  useEffect(() => {
    const loadData = async () => {
      setFilters({});
      await fetchFilteredAll({});
      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      setExpandedMonths([currentYearMonth]);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isFiltering) {
      setExpandedMonths(monthlySummaries.map((m) => m.year_month));
      setExpandedDays(new Set()); // 검색 시 상세 내역은 접음 (요약 위주)
    }
  }, [isFiltering, monthlySummaries]);

  const toggleMonth = (yearMonth: string) => {
    setExpandedMonths((prev) =>
      prev.includes(yearMonth)
        ? prev.filter((m) => m !== yearMonth)
        : [...prev, yearMonth]
    );
  };

  // 최상단 모두 펼치기: 모든 "월"을 펼침 (일별 상세는 건드리지 않음 or 초기화)
  const handleExpandAllMonths = () => {
    setExpandedMonths(monthlySummaries.map((m) => m.year_month));
    setExpandedDays(new Set()); // 깔끔하게 요약만 보이도록 상세는 접음
  };

  // 최상단 모두 접기: 모든 "월"을 접음
  const handleCollapseAllMonths = () => {
    setExpandedMonths([]);
    setExpandedDays(new Set());
  };

  // 월별 상세 일괄 펼치기/접기
  const toggleMonthDetails = (e: React.MouseEvent, yearMonth: string) => {
    e.stopPropagation(); // 월 토글 방지

    const datesInMonth = dailySummaries
      .filter((d) => d.date.startsWith(yearMonth))
      .map((d) => d.date);

    setExpandedDays((prev) => {
      const next = new Set(prev);
      const allExpanded = datesInMonth.every((d) => prev.has(d));

      if (allExpanded) {
        datesInMonth.forEach((d) => next.delete(d));
      } else {
        datesInMonth.forEach((d) => next.add(d));
      }
      return next;
    });
  };

  const handleDateClick = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setSheetOpen(true);
  };

  const handleDelete = (id: number) => {
    confirm({
      title: "가계부 기록 삭제",
      description:
        "이 거래 내역을 정말 삭제하시겠습니까? \n 삭제 후에는 복구할 수 없습니다.",
      onConfirm: async () => {
        await deleteTransaction(id);
      },
    });
  };

  const renderItems = useMemo(() => {
    if (dailySummaries.length === 0 && !loading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 bg-white/30 rounded-3xl border border-dashed border-slate-200 mt-8">
          <div className="p-4 rounded-full bg-slate-50 mb-4">
            <Search className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">
            검색 결과가 없습니다
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            필터 조건을 변경하거나 검색어를 다르게 입력해보세요.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilters({});
              fetchFilteredAll({});
            }}
            className="gap-2 rounded-full px-5"
          >
            <FilterX className="h-4 w-4" /> 필터 초기화
          </Button>
        </div>
      );
    }

    let lastYearMonth = "";
    const items: React.ReactNode[] = [];

    dailySummaries.forEach((summary) => {
      const date = new Date(summary.date);
      const currentYear = date.getFullYear().toString();
      const monthNumber = date.getMonth() + 1;
      const currentMonthDisplay = monthNumber.toString();
      const currentYearMonth = `${currentYear}-${monthNumber.toString().padStart(2, "0")}`;

      const isNewMonth = currentYearMonth !== lastYearMonth;
      const isExpanded = expandedMonths.includes(currentYearMonth);

      if (isNewMonth) {
        lastYearMonth = currentYearMonth;
        const monthStats = monthlySummaries.find(
          (m) => m.year_month === currentYearMonth
        );

        // 해당 월의 모든 날짜가 펼쳐져 있는지 확인
        const datesInMonth = dailySummaries
          .filter((d) => d.date.startsWith(currentYearMonth))
          .map((d) => d.date);
        const isAllDetailsExpanded =
          datesInMonth.length > 0 &&
          datesInMonth.every((d) => expandedDays.has(d));

        items.push(
          <div
            key={`header-${currentYearMonth}`}
            className="sticky top-14 z-30 pt-0 pb-0 mb-2 group cursor-pointer"
            onClick={() => toggleMonth(currentYearMonth)}
          >
            <div className="relative flex items-center justify-between gap-4 pt-1 p-4 pl-0 bg-white/60 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-white/40 hover:bg-white/80 transition-all duration-300">
              <div className="absolute left-[19px] top-0 bottom-0 w-[1px] bg-slate-200 group-hover:bg-slate-300 transition-colors" />
              <div className="absolute left-[19px] top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-white border-2 border-slate-200 shadow-sm group-hover:border-slate-800 group-hover:bg-slate-800 transition-all duration-300">
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

                <div className="flex items-center gap-3">
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
                  {/* 월별 상세 펼치기/접기 버튼 */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-slate-200 text-slate-400"
                    onClick={(e) => toggleMonthDetails(e, currentYearMonth)}
                    title={
                      isAllDetailsExpanded
                        ? "상세 내역 접기"
                        : "상세 내역 펼치기"
                    }
                  >
                    <ListTree
                      size={14}
                      className={cn(
                        "transition-colors",
                        isAllDetailsExpanded && "text-slate-800"
                      )}
                    />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      if (isExpanded) {
        const dayTransactions = transactionsByDate.get(summary.date) || [];
        const showDetails = expandedDays.has(summary.date);

        items.push(
          <div key={summary.date} className="relative z-10 flex flex-col mb-2">
            <DailySummaryCard
              summary={summary}
              isSelected={showDetails}
              onClick={() => handleDateClick(summary.date)}
            />
            {showDetails && (
              <div className="mt-4 mb-2">
                <TransactionDetailTable
                  transactions={dayTransactions}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            )}
          </div>
        );
      }
    });

    return items;
  }, [
    dailySummaries,
    monthlySummaries,
    expandedMonths,
    expandedDays,
    transactionsByDate, // Use grouped data
    loading,
    setFilters,
    fetchFilteredAll,
    isFiltering,
    deleteTransaction,
    setEditingTransaction,
    setSheetOpen,
    confirm,
  ]);

  return (
    <div className="flex flex-col min-h-full bg-transparent relative px-4 py-1">
      <div
        className={cn(
          "sticky top-0 z-40 -mx-4 px-4 pb-2 pt-2 bg-background backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 mb-1"
        )}
      >
        <div className="max-w-4xl mx-auto">
          <TransactionFilterPanel />
        </div>
      </div>

      <div className="flex flex-col w-full max-w-4xl mx-auto relative pb-20">
        {dailySummaries.length > 0 && (
          <div className="flex justify-end gap-1 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpandAllMonths}
              className="h-7 px-2 text-[11px] text-slate-400 hover:text-slate-600 gap-1"
            >
              <ChevronsDown className="w-3 h-3" /> 모두 펼치기
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCollapseAllMonths}
              className="h-7 px-2 text-[11px] text-slate-400 hover:text-slate-600 gap-1"
            >
              <ChevronsUp className="w-3 h-3" /> 모두 접기
            </Button>
          </div>
        )}

        {(dailySummaries.length > 0 || loading) && (
          <div className="absolute left-[20px] top-10 bottom-0 w-[1px] bg-slate-200 z-0" />
        )}

        <div className="flex flex-col relative z-10">
          {loading ? (
            <div className="space-y-8 mt-4">
              <FeedsSkeleton />
              <FeedsSkeleton />
            </div>
          ) : (
            renderItems
          )}
        </div>
      </div>
    </div>
  );
}
