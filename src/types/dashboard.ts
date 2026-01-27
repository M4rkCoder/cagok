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
