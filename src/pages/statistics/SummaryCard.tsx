import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FinancialSummaryStats, MetricStats } from "@/types";
import { cn } from "@/lib/utils";
import { ArrowUpCircleIcon, ArrowDownCircleIcon, WalletIcon, CreditCardIcon } from "lucide-react";

const emptyMetric: MetricStats = { total: 0, average: 0, max: 0, min: 0 };

interface SummaryCardsProps {
  stats: FinancialSummaryStats;
  formatCurrency: (amount: number) => string;
}

export function SummaryCards({ stats, formatCurrency }: SummaryCardsProps) {
  const items = [
    {
      title: "총 수입",
      data: stats.income || emptyMetric,
      color: "text-emerald-500",
      icon: ArrowUpCircleIcon,
    },
    {
      title: "총 지출",
      data: stats.expense || emptyMetric,
      color: "text-rose-500",
      icon: ArrowDownCircleIcon,
    },
    {
      title: "순수입",
      data: stats.netIncome || emptyMetric,
      isNet: true,
      icon: WalletIcon,
    },
    {
      title: "고정 지출",
      data: stats.fixedExpense || emptyMetric,
      color: "text-slate-700",
      icon: CreditCardIcon,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon; // Component for the icon
        const textColor = item.isNet
          ? item.data.total >= 0
            ? "text-emerald-500"
            : "text-rose-500"
          : item.color;

        return (
          <Card key={item.title} className="rounded-lg border shadow-md p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">{item.title}</CardTitle>
              {Icon && <Icon className={cn("h-4 w-4", textColor)} />}
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
              <div className={cn("text-2xl font-bold", textColor)}>
                {formatCurrency(item.data.total)}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm">
                <p className="text-muted-foreground">
                  평균: <span className="font-medium text-foreground">{formatCurrency(item.data.average)}</span>
                </p>
                <p className="text-muted-foreground">
                  최대: <span className="font-medium text-foreground">{formatCurrency(item.data.max)}</span>
                </p>
                <p className="text-muted-foreground">
                  최소: <span className="font-medium text-foreground">{formatCurrency(item.data.min)}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
