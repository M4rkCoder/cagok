import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import {
  Transaction,
  Category,
  TransactionWithCategory,
  TransactionFormValues,
} from "@/types";
import { toast } from "sonner";
import { useAppStore } from "./useAppStore";

interface TransactionState {
  transactions: TransactionWithCategory[];
  loading: boolean;
  sheetOpen: boolean;
  editingTransaction: Transaction | null;
  isConfirmDialogOpen: boolean;
  transactionToDeleteId: number | null;

  // Actions
  fetchTransactions: () => Promise<void>;
  setSheetOpen: (open: boolean) => void;
  setEditingTransaction: (transaction: Transaction | null) => void;
  handleSheetClose: () => void;
  submitForm: (values: TransactionFormValues) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  addCategory: (category: { name: string; icon: string }) => Promise<void>;
  setConfirmDialogOpen: (open: boolean) => void;
  openDeleteConfirm: (id: number) => void;
  confirmDelete: () => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loading: false,
  sheetOpen: false,
  editingTransaction: null,
  isConfirmDialogOpen: false,
  transactionToDeleteId: null,

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

  addCategory: async (category: { name: string; icon: string }) => {
    try {
      await invoke("create_category", {
        name: category.name,
        icon: category.icon,
      });
      toast.success("카테고리가 추가되었습니다.");
      await useAppStore.getState().fetchCategories();
    } catch (error) {
      toast.error("카테고리 추가 실패");
    }
  },
  setConfirmDialogOpen: (open) => set({ isConfirmDialogOpen: open }),

  // 삭제 다이얼로그를 여는 함수
  openDeleteConfirm: (id) => {
    set({ transactionToDeleteId: id, isConfirmDialogOpen: true });
  },

  // 다이얼로그에서 '확인'을 눌렀을 때 실행
  confirmDelete: async () => {
    const { transactionToDeleteId, fetchTransactions } = get();
    if (transactionToDeleteId === null) return;

    try {
      await invoke("delete_transaction", { id: transactionToDeleteId });
      toast.success("삭제되었습니다.");
      await fetchTransactions();
    } catch (error) {
      console.error(error);
      toast.error("삭제에 실패했습니다.");
    } finally {
      // 상태 초기화
      set({ transactionToDeleteId: null, isConfirmDialogOpen: false });
    }
  },
}));
