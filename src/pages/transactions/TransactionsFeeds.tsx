import { useEffect, useMemo, useState } from "react";
import { useTransactionStore } from "@/store/useTransactionStore";
import { DailySummaryCard } from "./DailySummaryCard";
import { TransactionDetailTable } from "./components/TransactionDetailTable";
import { TransactionFilterPanel } from "./components/TransactionFilterPanel";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Search,
  FilterX,
  SlidersHorizontal,
  ChevronsDown,
  ChevronsUp,
} from "lucide-react";
import { TrendBadge } from "./TransactionBadge";
import { cn } from "@/lib/utils";
import { useConfirmStore } from "@/store/useConfirmStore";
import { Transaction } from "@/types";

export default function TransactionsFeeds() {
  const {
    selectedDate,
    setSelectedDate,
    dailySummaries,
    monthlySummaries,
    transactions, // 필터링된 전체 트랜잭션 목록
    fetchFilteredAll,
    setFilters,
    filters, // 필터 상태 가져오기
    loading,
    deleteTransaction,
    setEditingTransaction,
    setSheetOpen,
  } = useTransactionStore();

  const { confirm } = useConfirmStore();

  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

  // 필터가 활성화되었는지 확인 (검색어, 카테고리 등 하나라도 설정되었는지)
  const isFiltering = useMemo(() => {
    return Object.values(filters).some((v) => {
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== "" && v !== null;
    });
  }, [filters]);

  useEffect(() => {
    const loadData = async () => {
      // 초기 데이터 로딩 시 필터를 초기화하고 전체 데이터를 가져옵니다.
      setFilters({});
      await fetchFilteredAll({});

      // 데이터 로딩 후 "현재 월"을 기본으로 펼침
      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      setExpandedMonths([currentYearMonth]);
    };
    loadData();
  }, []);

  // 필터링 활성화 시 모든 월 펼치기
  useEffect(() => {
    if (isFiltering) {
      setExpandedMonths(monthlySummaries.map((m) => m.year_month));
    }
  }, [isFiltering, monthlySummaries]);

  const toggleMonth = (yearMonth: string) => {
    setExpandedMonths((prev) =>
      prev.includes(yearMonth)
        ? prev.filter((m) => m !== yearMonth)
        : [...prev, yearMonth],
    );
  };

  const handleExpandAll = () => {
    setExpandedMonths(monthlySummaries.map((m) => m.year_month));
  };

  const handleCollapseAll = () => {
    setExpandedMonths([]);
  };

  const handleDateClick = (date: string) => {
    if (selectedDate === date) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
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
      const isExpanded =
        isFiltering || expandedMonths.includes(currentYearMonth);

      if (isNewMonth) {
        lastYearMonth = currentYearMonth;
        const monthStats = monthlySummaries.find(
          (m) => m.year_month === currentYearMonth,
        );

        items.push(
          <div
            key={`header-${currentYearMonth}`}
            className="sticky top-16 z-30 pt-3 pb-0 mb-2 group cursor-pointer" // top-16 to account for sticky filter
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
        // [수정] 스토어에 이미 로드된 필터링된 데이터(transactions) 중 해당 날짜의 항목만 추출
        const dayTransactions = transactions.filter(
          (t) => t.date === summary.date,
        );

        const showDetails = isFiltering || selectedDate === summary.date;

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
          </div>,
        );
      }
    });

    return items;
  }, [
    dailySummaries,
    monthlySummaries,
    expandedMonths,
    selectedDate,
    transactions,
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
    <div className="flex flex-col min-h-full bg-transparent relative px-4">
      {/* 상단 고정 필터 패널 (항상 표시) */}
      <div
        className={cn(
          "sticky top-0 z-40 -mx-4 px-4 pb-2 pt-2 bg-slate-50/95 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 border-b border-slate-200/50 mb-1",
        )}
      >
        <div className="max-w-4xl mx-auto">
          <TransactionFilterPanel />
        </div>
      </div>

      <div className="flex flex-col w-full max-w-4xl mx-auto relative pb-20">
        {/* 모두 펼치기/접기 버튼 영역 */}
        {dailySummaries.length > 0 && (
          <div className="flex justify-end gap-1 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpandAll}
              className="h-7 px-2 text-[11px] text-slate-400 hover:text-slate-600 gap-1"
            >
              <ChevronsDown className="w-3 h-3" /> 모두 펼치기
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCollapseAll}
              className="h-7 px-2 text-[11px] text-slate-400 hover:text-slate-600 gap-1"
            >
              <ChevronsUp className="w-3 h-3" /> 모두 접기
            </Button>
          </div>
        )}

        {/* 타임라인 수직선 (데이터가 있을 때만 표시) */}
        {dailySummaries.length > 0 && (
          <div className="absolute left-[20px] top-10 bottom-0 w-[1px] bg-slate-200 z-0" />
        )}

        <div className="flex flex-col relative z-10">{renderItems}</div>
      </div>
    </div>
  );
}
