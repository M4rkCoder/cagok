import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ComparisonMetric } from "@/types/dashboard";
import { CardFooter } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, PieChart, Info } from "lucide-react";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useTranslation, Trans } from "react-i18next";
import { cn } from "@/lib/utils";

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
  const { t } = useTranslation();
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
      <div key="daily-avg" className="flex items-center whitespace-nowrap">
        <Wallet className="w-3.5 h-3.5 gap-1 text-slate-400" />
        <Trans
          i18nKey="dashboard.comparison.daily_avg_spent"
          values={{ amount: formatAmount(dailyAverage!) }}
          components={{
            1: (
              <span className="text-slate-900 font-extrabold bg-slate-100 px-1 py-0.5 rounded tracking-tighter mx-1" />
            ),
          }}
        />
      </div>
    );
  }

  if (!isEmpty) {
    sentences.push(
      isSame ? (
        <div
          key="same-month"
          className="flex items-center whitespace-nowrap gap-1"
        >
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>{t("dashboard.comparison.same_as_last_month")}</span>
        </div>
      ) : (
        <div
          key="month-comparison"
          className="flex items-center whitespace-nowrap gap-1"
        >
          {isIncrease ? (
            <TrendingUp className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-blue-400" />
          )}
          <Trans
            i18nKey={
              isIncrease
                ? "dashboard.comparison.spent_more_than_last_month"
                : "dashboard.comparison.spent_less_than_last_month"
            }
            values={{ amount: formatAmount(Math.abs(metric.diff)) }}
            components={{
              1: (
                <span
                  className={cn(
                    "bg-slate-50 px-1 py-0.5 rounded mx-1",
                    isIncrease ? "text-green-500" : "text-red-500"
                  )}
                />
              ),
            }}
          />
        </div>
      )
    );
  }

  if (hasExpenseRate) {
    sentences.push(
      <div
        key="expense-rate"
        className="flex items-center whitespace-nowrap gap-1"
      >
        <PieChart className="w-3.5 h-3.5 text-slate-400" />
        <Trans
          i18nKey="dashboard.comparison.expense_ratio_spent"
          values={{ ratio: expenseRate }}
          components={{
            1: <span className={expenseRateColor()} />,
          }}
        />
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
      className="pt-0 pb-0 text-[12px] md:text-sm min-h-[40px] text-muted-foreground cursor-pointer relative overflow-hidden px-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {sentences.length === 0 ? (
        <div className="w-full text-center">
          {t("dashboard.comparison.no_data")}
        </div>
      ) : (
        <div className="relative w-full h-10 flex items-center justify-start">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentSentenceIndex}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center w-full"
            >
              <div className="flex items-center w-full overflow-visible">
                {sentences[currentSentenceIndex]}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </CardFooter>
  );
}
