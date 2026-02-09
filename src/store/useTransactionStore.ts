import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import {
  Transaction,
  Category,
  TransactionWithCategory,
  TransactionFormValues,
  DailySummary,
  MonthlyTotalSummary,
} from "@/types";
import { toast } from "sonner";
import { useAppStore } from "./useAppStore";
import { useCategoryStore } from "./useCategoryStore";

type ConfirmType = "transaction" | "category" | null;

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

  // Actions
  fetchTransactions: () => Promise<void>;
  fetchAllDailySummaries: () => Promise<void>;
  fetchMonthlyTotalTrends: () => Promise<void>;
  fetchTransactionsByDate: (date: string) => Promise<void>;
  setSheetOpen: (open: boolean) => void;
  setEditingTransaction: (transaction: Transaction | null) => void;
  handleSheetClose: () => void;
  submitForm: (values: TransactionFormValues) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  setDefaultCategoryId: (id: number | null) => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  dailySummaries: [],
  monthlySummaries: [],
  dateTransactions: [],
  loading: false,
  sheetOpen: false,
  editingTransaction: null,
  isConfirmOpen: false,
  confirmType: null,
  targetId: null,
  defaultCategoryId: null,

  fetchMonthlyTotalTrends: async () => {
    set({ loading: true });
    try {
      const summaries = await invoke<MonthlyTotalSummary[]>(
        "get_all_monthly_total_trends"
      );
      set({ monthlySummaries: summaries });
    } catch (error) {
      console.error(error);
      toast.error("월별 통계를 불러오는데 실패했습니다.");
    } finally {
      set({ loading: false });
    }
  },

  fetchTransactions: async () => {
    set({ loading: true });
    try {
      const fetched = await invoke<TransactionWithCategory[]>(
        "get_transactions_with_category"
      );
      set({ transactions: fetched });
    } catch (error) {
      toast.error("거래 내역을 불러오는데 실패했습니다.");
    } finally {
      set({ loading: false });
    }
  },

  fetchAllDailySummaries: async () => {
    set({ loading: true });
    try {
      const summaries = await invoke<DailySummary[]>("get_all_daily_summaries");
      set({ dailySummaries: summaries });
    } catch (error) {
      toast.error("일별 요약을 불러오는데 실패했습니다.");
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
      toast.error(`${date}의 내역을 불러오는데 실패했습니다.`);
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
        toast.success("수정되었습니다.");
      } else {
        await invoke("create_transaction", {
          transaction: { ...values, remarks: values.remarks ?? null },
        });
        toast.success("추가되었습니다.");
      }
      handleSheetClose();
      await fetchTransactions();
    } catch (error) {
      toast.error("저장에 실패했습니다.");
    }
  },

  deleteTransaction: async (id) => {
    try {
      await invoke("delete_transaction", { id });
      toast.success("삭제되었습니다.");
      get().fetchTransactions();
    } catch (error) {
      toast.error("삭제에 실패했습니다.");
    }
  },

  setDefaultCategoryId: (id) => set({ defaultCategoryId: id }),
}));
