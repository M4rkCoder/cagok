import { CellContext } from "@tanstack/react-table";

// DB에서 조회되는 트랜잭션
export interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
  type: number; // 0: income, 1: expense
  remarks?: string;
  is_fixed: number; // 0: variable, 1: fixed
  category_id?: number;
}

// 생성용 (id 없음)
export type CreateTransaction = Omit<Transaction, "id">;

// 수정용 (일부만 바꿀 수 있음)
export type UpdateTransaction = Partial<CreateTransaction> & {
  id: number;
};

//카테고리 통합 조회 용
export interface TransactionWithCategory extends Transaction {
  category_name?: string;
  category_icon?: string;
}

export interface DailySummary {
  date: string;
  income_total: number;
  expense_total: number;
  income_count: number;
  expense_count: number;
  total_count: number;
}

export interface MonthlyTotalSummary {
  year_month: string;
  income_total: number;
  expense_total: number;
  income_count: number;
  expense_count: number;
  total_count: number;
}

export interface QuickEntryTransactionRow {
  id: string;
  date: string;
  type: number;
  category_id: string;
  is_fixed: number;
  description: string;
  amount: string;
  remarks: string;
  is_valid?: boolean;
  error_msg?: string;
}

export interface CellProps extends CellContext<QuickEntryTransactionRow, any> {
  colIdx: number;
  onPaste?: (e: React.ClipboardEvent, r: number, c: number) => void;
  error?: { message: string; timestamp: number };
}

export interface TransactionFilters {
  keyword?: string;
  tx_type?: number; // 0: 수입, 1: 지출
  is_fixed?: boolean; // 0: 변동, 1: 고정
  category_ids?: number[];
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface RecurringTransaction {
  id?: number;
  description: string;
  amount: number;
  category_id?: number;
  is_fixed?: number;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  start_date: string;
  end_date?: string;
  day_of_month?: number;
  day_of_week?: number;
  is_active: boolean;
  last_created_date?: string;
  remarks?: string;
}

export interface RecurringHistoryItem {
  id: number;
  recurring_id: number;
  transaction_id: number;
  created_at: string;
  amount: number;
  description: string;
  category_name?: string;
  category_icon?: string;
  category_type?: number;
}
