import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from "lucide-react";
import { ComparisonCardFooter } from "../ComparisonCardFooter";
import { ComparisonMetric, ComparisonType, MonthlyOverview } from "@/types";

interface Props {
  overview: MonthlyOverview;
  comparisons: Record<ComparisonType, ComparisonMetric | null>;
}

export function SummaryCards({ overview, comparisons }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            총 수입
          </CardTitle>
          <TrendingUp className="w-4 h-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(overview.total_income)}
          </div>
        </CardContent>
        <ComparisonCardFooter
          metric={comparisons.Income}
          isPositiveGood={true}
        />
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            총 지출
          </CardTitle>
          <TrendingDown className="w-4 h-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(overview.total_expense)}
          </div>
        </CardContent>
        <ComparisonCardFooter
          metric={comparisons.Expense}
          isPositiveGood={false}
        />
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            순수익
          </CardTitle>
          <DollarSign className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              overview.net_income >= 0 ? "text-blue-600" : "text-red-600"
            }`}
          >
            {formatCurrency(overview.net_income)}
          </div>
        </CardContent>
        <ComparisonCardFooter
          metric={comparisons.NetIncome}
          isPositiveGood={true}
        />
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            고정비 비율
          </CardTitle>
          <PiggyBank className="w-4 h-4 text-purple-500" />`
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {overview.fixed_expense_ratio.toFixed(1)}%
          </div>
        </CardContent>
        <ComparisonCardFooter metric={comparisons.FixedRatio} unit="percent" />
      </Card>
    </div>
  );
}
