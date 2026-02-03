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
import { useCategoryStore } from "./useCategoryStore";

type ConfirmType = "transaction" | "category" | null;

interface TransactionState {
  transactions: TransactionWithCategory[];
  loading: boolean;
  sheetOpen: boolean;
  editingTransaction: Transaction | null;
  //isConfirmOpen: boolean;
  //confirmType: ConfirmType;
  targetId: number | null;

  // Actions
  fetchTransactions: () => Promise<void>;
  setSheetOpen: (open: boolean) => void;
  setEditingTransaction: (transaction: Transaction | null) => void;
  handleSheetClose: () => void;
  submitForm: (values: TransactionFormValues) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  // setConfirmOpen: (open: boolean) => void;
  // openConfirm: (type: ConfirmType, id: number) => void;
  // closeConfirm: () => void;
  // handleConfirmAction: () => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  loading: false,
  sheetOpen: false,
  editingTransaction: null,
  isConfirmOpen: false,
  confirmType: null,
  targetId: null,

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

  // setConfirmOpen: (open) => set({ isConfirmOpen: open }),

  // // 삭제 다이얼로그를 여는 함수
  // openConfirm: (type, id) => {
  //   set({ isConfirmOpen: true, confirmType: type, targetId: id });
  // },
  // closeConfirm: () =>
  //   set({ isConfirmOpen: false, confirmType: null, targetId: null }),

  // handleConfirmAction: async () => {
  //   const { confirmType, targetId } = get();
  //   if (!targetId) return;

  //   try {
  //     if (confirmType === "transaction") {
  //       await invoke("delete_transaction", { id: targetId });
  //       toast.success("삭제되었습니다.");
  //       get().fetchTransactions();
  //     } else if (confirmType === "category") {
  //       await invoke("delete_category", { id: targetId });
  //       toast.success("삭제되었습니다.");
  //       useCategoryStore.getState().resetCategoryForm();
  //       await useAppStore.getState().fetchCategories();
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     toast.error("삭제에 실패했습니다.");
  //   } finally {
  //     get().closeConfirm();
  //   }
  // },
}));
