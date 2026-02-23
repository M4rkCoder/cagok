export type ComparisonMetric = {
  current: number;
  previous: number;
  diff: number;
  diff_rate: number | null;
};

export type ComparisonType =
  | "Expense"
  | "Income"
  | "NetIncome"
  | "Fixed"
  | "FixedRatio";

// 타입 정의
export interface MonthlyOverview {
  total_income: number;
  total_expense: number;
  net_income: number;
  fixed_expense: number;
  fixed_expense_ratio: number;
  daily_average: number;
}

export interface CategoryExpense {
  category_id: number;
  category_name: string;
  category_icon: string;
  total_amount: number;
  percentage: number;
  transaction_count: number;
  [key: string]: string | number;
}

export interface DailyExpense {
  date: string;
  total_amount: number;
  transaction_count: number;
  [key: string]: string | number;
}

export interface MonthlyExpense {
  year_month: string;
  total_amount: number;
  transaction_count: number;
  [key: string]: string | number;
}

export interface MonthlyFinancialSummaryItem {
  yearMonth: string;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  fixedExpense: number;
  variableExpense: number;
}

export interface YearlySummaryItem {
  year: number;
  total_income: number;
  total_expense: number;
  net_income: number;
}

export interface CategoryMonthlyAmount {
  year_month: string;
  category_id: number;
  category_name: string;
  category_icon: string;
  total_amount: number;
  transaction_count: number;
  type: number; // 0: income, 1: expense
}

export interface MetricStats {
  total: number;
  average: number;
  max: number;
  min: number;
  maxMonth?: string;
  minMonth?: string;
}

export interface FinancialSummaryStats {
  income: MetricStats;
  expense: MetricStats;
  netIncome: MetricStats;
  fixedExpense: MetricStats;
}

export interface TransactionWithCategory {
  id: number;
  description: string;
  amount: number;
  date: string;
  type: number;
  is_fixed: number;
  remarks: string | null;
  category_id: number | null;
  category_name: string | null;
  category_icon: string | null;
}

export type DialogState = {
  open: boolean;
  title: string;
  transactions: TransactionWithCategory[];
  showDate: boolean;
};

export interface DailyCategoryTransaction {
  date: string;
  category_id: number;
  category_name: string;
  category_icon: string;
  total_amount: number;
  tx_type: number;
  transaction_count: number;
}

export interface TreemapNode {
  name: string;
  value: number;
  percentage: number;
  category_id?: number;
  category_icon?: string;
  item_type: "root" | "group" | "category";
  children?: TreemapNode[];
  [key: string]: any;
}

export interface DailyDetailResponse {
  items: TransactionWithCategory[];
  total_amount: number;
  categoryId?: number | null;
  is_fixed_view?: boolean;
}

export interface CategoryFixedVariableSummary {
  category_id: number;
  category_name: string;
  category_icon: string;
  fixed_total: number;
  variable_total: number;
  fixed_items: TransactionWithCategory[];
  variable_items: TransactionWithCategory[];
}

export interface MonthAmountStat {
  month: string;
  amount: number;
}

export interface CategoryStat {
  name: string;
  icon: string;
  value: number; // amount or count
}

export interface DayOfWeekStat {
  day: string;
  amount: number;
}

export interface BadgeStats {
  maxExpenseMonth?: MonthAmountStat;
  maxIncomeMonth?: MonthAmountStat;
  netIncomeRatio: number;
  maxExpenseCategory?: CategoryStat;
  mostFrequentCategory?: CategoryStat;
  maxExpenseDayOfWeek?: DayOfWeekStat;
}

export interface DayOfWeekCategoryStat {
  dayOfWeek: number; // 0: Sun, 1: Mon, ...
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  totalAmount: number;
  transactionCount: number;
  dayCount: number;
  averageAmount: number;
}

export interface DayOfWeekTotalStat {
  dayOfWeek: number;
  totalAmount: number;
  transactionCount: number;
  dayCount: number;
  averageAmount: number;
}

export interface DayOfWeekResponse {
  categories: DayOfWeekCategoryStat[];
  totals: DayOfWeekTotalStat[];
}
