import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FinancialSummaryStats, MetricStats } from "@/types";
import { cn } from "@/lib/utils";

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
    },
    {
      title: "총 지출",
      data: stats.expense || emptyMetric,
      color: "text-rose-500",
    },
    { title: "순수입", data: stats.netIncome || emptyMetric, isNet: true },
    {
      title: "고정 지출",
      data: stats.fixedExpense || emptyMetric,
      color: "text-slate-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription
              className={cn(
                "text-2xl font-bold",
                item.isNet
                  ? item.data.total >= 0
                    ? "text-emerald-500"
                    : "text-rose-500"
                  : item.color
              )}
            >
              {formatCurrency(item.data.total)}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-500">
            <p>평균: {formatCurrency(item.data.average)}</p>
            <p>
              최대: {formatCurrency(item.data.max)}
              {/* {item.data.max_month && <span className="ml-1 text-xs">({item.data.max_month.split('-')[1]}월)</span>} */}
            </p>
            <p>최소: {formatCurrency(item.data.min)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
