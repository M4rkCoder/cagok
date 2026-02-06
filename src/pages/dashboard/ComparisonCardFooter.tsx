import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ComparisonMetric } from "@/types/dashboard";
import { CardFooter } from "@/components/ui/card";

interface Props {
  metric: ComparisonMetric | null;
  expenseRate: number | null;
  dailyAverage?: number | null;
}

export function ComparisonCardFooter({
  metric,
  expenseRate,
  dailyAverage,
}: Props) {
  const isEmpty = !metric || metric.previous === 0;

  const formatValue = () => {
    if (!metric) return "";
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(Math.abs(metric.diff));
  };

  const formatKRW = (value: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isIncrease = (metric?.diff ?? 0) > 0;
  const isSame = metric?.diff === 0;
  const hasExpenseRate =
    typeof expenseRate === "number" && Number.isFinite(expenseRate);

  const hasDailyAverage = typeof dailyAverage === "number" && dailyAverage > 0;

  const expenseRateColor = () => {
    if (!Number.isFinite(expenseRate)) return "text-muted-foreground";
    if (expenseRate >= 100)
      return "text-red-500 bg-slate-50 px-1 py-0.5 rounded";
    if (expenseRate >= 80)
      return "text-orange-500 bg-slate-50 px-1 py-0.5 rounded";
    return "text-green-500 bg-slate-50 px-1 py-0.5 rounded";
  };

  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const sentences: React.ReactNode[] = [];

  if (hasDailyAverage) {
    sentences.push(
      <div key="daily-avg" className="flex items-center gap-1">
        <span>하루 평균</span>
        <span className="text-slate-900 font-extrabold bg-slate-100 px-1.5 py-0.5 rounded tracking-tighter">
          {formatKRW(dailyAverage!)}
        </span>
        <span>썼어요</span>
      </div>,
    );
  }

  if (!isEmpty) {
    sentences.push(
      isSame ? (
        <span key="same-month">지난 달과 동일함</span>
      ) : (
        <span key="month-comparison">
          지난 달보다
          {isIncrease ? (
            <>
              <span className="text-green-500 bg-slate-50 px-1 py-0.5 rounded">
                {formatValue()}
              </span>
              늘었어요.
            </>
          ) : (
            <>
              <span className="text-red-500 bg-slate-50 px-1 py-0.5 rounded">
                {formatValue()}
              </span>
              줄었어요.
            </>
          )}
        </span>
      ),
    );
  }

  if (hasExpenseRate) {
    sentences.push(
      <span key="expense-rate">
        수입의 <span className={expenseRateColor()}>{expenseRate}%</span>를
        썼어요.
      </span>,
    );
  }

  useEffect(() => {
    if (isPaused || isExpanded || sentences.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentSentenceIndex(
        (prevIndex) => (prevIndex + 1) % sentences.length,
      );
    }, 3500); // Roll every 4.5 seconds

    return () => clearInterval(interval);
  }, [isPaused, isExpanded, sentences.length]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);
  const handleClick = () => setIsExpanded((prev) => !prev);

  const variants = {
    enter: { opacity: 0, y: -10 }, // Adjusted to move slightly up
    center: { opacity: 1, y: -10 }, // Adjusted to move up
    exit: { opacity: 0, y: -10 }, // Adjusted to maintain relative movement
  };

  return (
    <CardFooter
      className="pt-0 text-sm min-h-[40px] text-muted-foreground cursor-pointer relative overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {sentences.length === 0 ? (
        <div className="w-full text-center">데이터가 없습니다.</div>
      ) : isExpanded ? (
        <div className="flex flex-col gap-1 w-full">
          {sentences.map((s, index) => (
            <div key={`expanded-${index}`}>{s}</div>
          ))}
        </div>
      ) : (
        <div className="relative w-full h-full flex items-start justify-start">
          {" "}
          {/* Changed items-center to items-start */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentSentenceIndex}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="absolute w-full"
            >
              {sentences[currentSentenceIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </CardFooter>
  );
}
