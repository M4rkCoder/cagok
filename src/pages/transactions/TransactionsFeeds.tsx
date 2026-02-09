import { useEffect, useMemo, useState } from "react";
import { useTransactionStore } from "@/store/useTransactionStore";
import { DailySummaryCard } from "./DailySummaryCard";
import { TransactionDetailTable } from "./TransactionDetailTable";
import { TransactionFilterPanel } from "./TransactionFilterPanel";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  CirclePlus,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TrendBadge } from "./TransactionBadge";

export default function TransactionsFeeds() {
  const {
    dailySummaries,
    monthlySummaries,
    dateTransactions,
    fetchAllDailySummaries,
    fetchMonthlyTotalTrends,
    fetchTransactionsByDate,
  } = useTransactionStore();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchAllDailySummaries(), fetchMonthlyTotalTrends()]);

      // 데이터 로딩 후 "현재 월"을 기본으로 펼침
      const now = new Date();
      const currentYearMonth = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      setExpandedMonths([currentYearMonth]);
    };
    loadData();
  }, []);

  const toggleMonth = (yearMonth: string) => {
    setExpandedMonths((prev) =>
      prev.includes(yearMonth)
        ? prev.filter((m) => m !== yearMonth)
        : [...prev, yearMonth]
    );
  };

  const handleDateClick = async (date: string) => {
    if (selectedDate === date) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
      await fetchTransactionsByDate(date);
    }
  };

  const renderItems = useMemo(() => {
    let lastYearMonth = "";
    const items: React.ReactNode[] = [];

    dailySummaries.forEach((summary) => {
      const date = new Date(summary.date);
      const currentYear = date.getFullYear().toString();

      // [수정] 0을 제거하기 위해 숫자로 변환
      const monthNumber = date.getMonth() + 1;
      const currentMonthDisplay = monthNumber.toString(); // "5" (05가 아님)

      // 비교 및 ID 생성을 위한 연-월 문자열은 패딩을 유지하는 것이 안전합니다 (DB 포맷 일치)
      const currentYearMonth = `${currentYear}-${monthNumber.toString().padStart(2, "0")}`;

      const isNewMonth = currentYearMonth !== lastYearMonth;
      const isExpanded = expandedMonths.includes(currentYearMonth);

      if (isNewMonth) {
        lastYearMonth = currentYearMonth;
        const monthStats = monthlySummaries.find(
          (m) => m.year_month === currentYearMonth
        );

        items.push(
          <div
            key={`header-${currentYearMonth}`}
            className="sticky top-[-24px] z-30 pt-3 pb-0 mb-2 group cursor-pointer"
            onClick={() => toggleMonth(currentYearMonth)}
          >
            <div className="relative flex items-center justify-between gap-4 pt-10 p-4 pl-0 rounded-2xl bg-white/60 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-white/40 hover:bg-white/80 transition-all duration-300">
              {/* 타임라인 연결 포인트 (left-[19px] 중심 정렬) */}
              <div className="absolute left-[19px] top-0 bottom-0 flex flex-col items-center justify-center -translate-x-1/2">
                {/* 아이콘 위쪽 선 (헤더 내부 상단 연결) */}
                <div className="w-[1px] h-full pt-10 bg-slate-200 group-hover:bg-slate-300 transition-colors" />

                {/* 중심 아이콘/포인트 */}
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

                {/* 아이콘 아래쪽 선 (다음 아이템으로 연결) */}
                <div className="w-[1px] h-full bg-slate-200 group-hover:bg-slate-300 transition-colors" />
              </div>

              {/* 텍스트 및 통계 컨텐츠 (아이콘 너비만큼 여백 확보) */}
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

                  {/* 건수 표기 */}
                  {monthStats && (
                    <div className="flex items-center gap-1.2 ml-2 px-2.5 py-0.5 rounded-full bg-slate-100/80 text-[10px] font-bold text-slate-500 border border-slate-200/50 uppercase">
                      {monthStats.total_count} 건
                    </div>
                  )}
                </div>

                {/* 오른쪽: 통계 배지 섹션 */}
                {monthStats && (
                  <div className="flex items-center gap-2">
                    <TrendBadge
                      type="income"
                      amount={monthStats.income_total}
                      className="shadow-none bg-transparent border-none min-w-fit gap-1"
                      isSimple // 헤더 공간을 위해 심플 버전 추천
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
          </div>
        );
      }

      // --- [수정] 펼쳐진 달의 데이터만 렌더링 ---
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
                <TransactionDetailTable transactions={dateTransactions} />
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
    selectedDate,
    dateTransactions,
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
          {/* 타임라인 수직선 */}
          <div className="absolute left-[19px] top-10 bottom-0 w-[1px] bg-slate-200 z-0" />

          <div className="flex flex-col relative z-10">{renderItems}</div>
        </div>

        {/* 필터 패널: 우측 여백을 채우면서도 너무 넓지 않게 고정 */}
        {isFilterVisible && (
          <div className="sticky top-4 w-[15%] min-w-[150px] mt-12 shrink-0">
            <TransactionFilterPanel onClose={() => setIsFilterVisible(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
