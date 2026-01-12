export type ComparisonMetric = {
  current: number;
  previous: number;
  diff: number;
  diff_rate: number | null;
};

export type ComparisonType = "Expense" | "Income" | "NetIncome" | "FixedRatio";
