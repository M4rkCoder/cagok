import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ComparisonMetric } from "@/types/dashboard";
import { CardFooter } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, PieChart, Info } from "lucide-react";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

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
  const { formatAmount } = useCurrencyFormatter();

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

  const sentences: React.ReactNode[] = [];

  if (hasDailyAverage) {
    sentences.push(
      <div
        key="daily-avg"
        className="flex items-center gap-1.5 whitespace-nowrap"
      >
        <Wallet className="w-3.5 h-3.5 text-slate-400" />
        <span>하루 평균</span>
        <span className="text-slate-900 font-extrabold bg-slate-100 px-1.5 py-0.5 rounded tracking-tighter">
          {formatAmount(dailyAverage!)}
        </span>
        <span>썼어요</span>
      </div>
    );
  }

  if (!isEmpty) {
    sentences.push(
      isSame ? (
        <div
          key="same-month"
          className="flex items-center gap-1.5 whitespace-nowrap"
        >
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>지난 달과 동일함</span>
        </div>
      ) : (
        <div
          key="month-comparison"
          className="flex items-center gap-1.5 whitespace-nowrap"
        >
          {isIncrease ? (
            <TrendingUp className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-blue-400" />
          )}
          <span>
            전월 대비
            {isIncrease ? (
              <>
                <span className="text-green-500 bg-slate-50 px-1 py-0.5 rounded ml-1">
                  {formatAmount(Math.abs(metric.diff))}
                </span>
                늘었어요.
              </>
            ) : (
              <>
                <span className="text-red-500 bg-slate-50 px-1 py-0.5 rounded ml-1">
                  {formatAmount(Math.abs(metric.diff))}
                </span>
                줄었어요.
              </>
            )}
          </span>
        </div>
      )
    );
  }

  if (hasExpenseRate) {
    sentences.push(
      <div
        key="expense-rate"
        className="flex items-center gap-1.5 whitespace-nowrap"
      >
        <PieChart className="w-3.5 h-3.5 text-slate-400" />
        <span>
          수입의 <span className={expenseRateColor()}>{expenseRate}%</span>를
          썼어요.
        </span>
      </div>
    );
  }

  useEffect(() => {
    if (isPaused || sentences.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentSentenceIndex(
        (prevIndex) => (prevIndex + 1) % sentences.length
      );
    }, 3500); // Roll every 3.5 seconds

    return () => clearInterval(interval);
  }, [isPaused, sentences.length]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  const variants = {
    enter: { opacity: 0, y: 15 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <CardFooter
      className="pt-0 pb-0 text-sm min-h-[40px] text-muted-foreground cursor-pointer relative overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {sentences.length === 0 ? (
        <div className="w-full text-center">데이터가 없습니다.</div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-start">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentSentenceIndex}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="absolute w-full flex items-center"
            >
              {sentences[currentSentenceIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </CardFooter>
  );
}
