import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import {
  Transaction,
  TransactionWithCategory,
  TransactionFormValues,
  DailySummary,
  MonthlyTotalSummary,
  TransactionFilters,
} from "@/types";
import { toast } from "sonner";
import i18n from "@/i18n"; // i18n 임포트 추가
import { useAppStore } from "./useAppStore";

interface TransactionState {
  transactions: TransactionWithCategory[];
  dailySummaries: DailySummary[];
  monthlySummaries: MonthlyTotalSummary[];
  dateTransactions: TransactionWithCategory[];
  loading: boolean;
  sheetOpen: boolean;
  editingTransaction: Transaction | null;
  targetId: number | null;
  defaultCategoryId: number | null;
  filters: TransactionFilters;
  selectedDate: string | null;

  fetchTransactions: () => Promise<void>;
  fetchAllDailySummaries: () => Promise<void>;
  fetchMonthlyTotalTrends: () => Promise<void>;
  fetchTransactionsByDate: (date: string) => Promise<void>;
  setSheetOpen: (open: boolean) => void;
  setEditingTransaction: (transaction: Transaction | null) => void;
  handleSheetClose: () => void;
  submitForm: (values: TransactionFormValues) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  deleteBulkTransactions: (ids: number[]) => Promise<void>;
  setDefaultCategoryId: (id: number | null) => void;
  setFilters: (filters: TransactionFilters) => void;
  fetchFilteredAll: (filters?: TransactionFilters) => Promise<void>;
  setSelectedDate: (date: string | null) => void;
  resetFilters: () => void;
}

const initialFilters: TransactionFilters = {};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  dailySummaries: [],
  monthlySummaries: [],
  dateTransactions: [],
  loading: false,
  sheetOpen: false,
  editingTransaction: null,
  targetId: null,
  defaultCategoryId: null,
  filters: initialFilters,
  selectedDate: null,

  fetchMonthlyTotalTrends: async () => {
    set({ loading: true });
    try {
      const summaries = await invoke<MonthlyTotalSummary[]>(
        "get_all_monthly_total_trends"
      );
      set({ monthlySummaries: summaries });
    } catch (error) {
      console.error(error);
      toast.error(i18n.t("toast.fetch_transactions_failed")); // "가계부 내역을 불러오는 데 실패했습니다."
    } finally {
      set({ loading: false });
    }
  },

  fetchTransactions: async () => {
    await get().fetchFilteredAll();
  },

  fetchAllDailySummaries: async () => {
    set({ loading: true });
    try {
      const summaries = await invoke<DailySummary[]>("get_all_daily_summaries");
      set({ dailySummaries: summaries });
    } catch (error) {
      toast.error(i18n.t("toast.fetch_transactions_failed"));
    } finally {
      set({ loading: false });
    }
  },

  fetchTransactionsByDate: async (date: string) => {
    set({ loading: true });
    try {
      const details = await invoke<TransactionWithCategory[]>(
        "get_transactions_by_date",
        { date }
      );
      set({ dateTransactions: details });
    } catch (error) {
      // 날짜 포함 에러 메시지 처리 (필요 시 JSON에 별도 키 생성 가능)
      toast.error(i18n.t("toast.fetch_transactions_failed"));
    } finally {
      set({ loading: false });
    }
  },

  setSheetOpen: (open) => set({ sheetOpen: open }),

  setEditingTransaction: (transaction) =>
    set({ editingTransaction: transaction }),

  handleSheetClose: () => set({ sheetOpen: false, editingTransaction: null }),

  submitForm: async (values) => {
    const { editingTransaction, fetchTransactions, handleSheetClose } = get();
    try {
      if (editingTransaction) {
        await invoke("update_transaction", {
          id: editingTransaction.id,
          transaction: { ...values, remarks: values.remarks ?? null },
        });
        toast.success(i18n.t("toast.transaction_updated")); // "가계부가 성공적으로 업데이트되었습니다."
      } else {
        await invoke("create_transaction", {
          transaction: { ...values, remarks: values.remarks ?? null },
        });
        toast.success(i18n.t("toast.transaction_created")); // "가계부가 성공적으로 생성되었습니다."
      }
      handleSheetClose();
      await fetchTransactions();
    } catch (error) {
      toast.error(i18n.t("toast.save_transaction_failed")); // "가계부 저장에 실패했습니다."
    }
  },

  deleteTransaction: async (id) => {
    try {
      await invoke("delete_transaction", { id });
      toast.success(i18n.t("toast.transaction_deleted")); // "가계부가 성공적으로 삭제되었습니다."
      get().fetchTransactions();
    } catch (error) {
      toast.error(i18n.t("toast.delete_transaction_failed")); // "가계부 삭제에 실패했습니다."
    }
  },

  deleteBulkTransactions: async (ids: number[]) => {
    if (ids.length === 0) return;
    set({ loading: true });

    try {
      // 🔹 백엔드에서 삭제된 항목의 개수(숫자)를 반환받음
      const deletedCount = await invoke<number>("delete_bulk_transactions", {
        ids,
      });

      // 🔹 i18n을 통해 다국어 메시지에 count 값을 전달하여 렌더링
      toast.success(
        i18n.t("transaction.bulk_delete_success", { count: deletedCount })
      );

      await get().fetchTransactions();
    } catch (error) {
      console.error(error);
      toast.error(i18n.t("toast.delete_transaction_failed"));
    } finally {
      set({ loading: false });
    }
  },

  setDefaultCategoryId: (id) => set({ defaultCategoryId: id }),
  setFilters: (newFilters) => set({ filters: newFilters }),

  fetchFilteredAll: async (filters) => {
    const currentFilters = filters ?? get().filters;
    set({ loading: true });

    try {
      const results = await invoke<TransactionWithCategory[]>(
        "get_filtered_transactions_command",
        { filters: currentFilters }
      );

      set({ transactions: results });

      const { daily, monthly } = processSummaries(results);

      set({
        dailySummaries: daily,
        monthlySummaries: monthly,
        dateTransactions: results.filter((t) => t.date === get().selectedDate),
      });
    } catch (error) {
      console.error(error);
      toast.error(i18n.t("toast.fetch_transactions_failed"));
    } finally {
      set({ loading: false });
    }
  },

  resetFilters: () => set({ filters: initialFilters }),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));

// 데이터 가공 헬퍼 함수
function processSummaries(data: TransactionWithCategory[]) {
  const dailyMap = new Map<string, DailySummary>();
  const monthlyMap = new Map<string, MonthlyTotalSummary>();

  data.forEach((t) => {
    const date = t.date;
    const month = date.substring(0, 7);

    const d = dailyMap.get(date) || {
      date,
      income_total: 0,
      expense_total: 0,
      income_count: 0,
      expense_count: 0,
      total_count: 0,
    };

    d.total_count += 1;
    if (t.type === 0) {
      d.income_total += t.amount;
      d.income_count += 1;
    } else {
      d.expense_total += t.amount;
      d.expense_count += 1;
    }
    dailyMap.set(date, d as DailySummary);

    const m = monthlyMap.get(month) || {
      year_month: month,
      income_total: 0,
      expense_total: 0,
      income_count: 0,
      expense_count: 0,
      total_count: 0,
    };

    m.total_count += 1;
    if (t.type === 0) {
      m.income_total += t.amount;
      m.income_count += 1;
    } else {
      m.expense_total += t.amount;
      m.expense_count += 1;
    }
    monthlyMap.set(month, m as MonthlyTotalSummary);
  });

  return {
    daily: Array.from(dailyMap.values()).sort((a, b) =>
      b.date.localeCompare(a.date)
    ),
    monthly: Array.from(monthlyMap.values()).sort((a, b) =>
      b.year_month.localeCompare(a.year_month)
    ),
  };
}
