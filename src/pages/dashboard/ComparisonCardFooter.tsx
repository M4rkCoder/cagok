import { ComparisonMetric } from "@/types/dashboard";
import { CardFooter } from "@/components/ui/card";

interface Props {
  metric: ComparisonMetric | null;
  expenseRate: number | null;
}

export function ComparisonCardFooter({ metric, expenseRate }: Props) {
  const isEmpty = !metric || metric.previous === 0;

  const formatValue = () => {
    if (!metric) return "";
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(Math.abs(metric.diff));
  };

  const isIncrease = (metric?.diff ?? 0) > 0;
  const isSame = metric?.diff === 0;
  const hasExpenseRate =
    typeof expenseRate === "number" && Number.isFinite(expenseRate);

  const expenseRateColor = () => {
    if (!Number.isFinite(expenseRate)) return "text-muted-foreground";
    if (expenseRate >= 100)
      return "text-red-500 bg-slate-50 px-1 py-0.5 rounded";
    if (expenseRate >= 80)
      return "text-orange-500 bg-slate-50 px-1 py-0.5 rounded";
    return "text-green-500 bg-slate-50 px-1 py-0.5 rounded";
  };

  return (
    <CardFooter className="pt-2 text-sm min-h-[40px] text-muted-foreground">
      <div className="flex flex-col gap-1">
        {!isEmpty && (
          <span className="whitespace-nowrap overflow-hidden text-ellipsis">
            {isSame ? (
              "지난 달과 동일함"
            ) : (
              <>
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
              </>
            )}
          </span>
        )}
        {hasExpenseRate && (
          <span>
            수입의 <span className={expenseRateColor()}>{expenseRate}%</span>를
            썼어요.
          </span>
        )}
      </div>
    </CardFooter>
  );
}
