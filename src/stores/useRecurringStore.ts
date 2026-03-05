import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import i18n from "@/i18n"; // i18n 임포트 추가
import { RecurringTransaction, RecurringHistoryItem } from "@/types";

interface RecurringState {
  recurringList: RecurringTransaction[];
  history: RecurringHistoryItem[];
  filterType: "all" | "income" | "expense";
  setFilterType: (type: "all" | "income" | "expense") => void;
  loadData: () => Promise<void>;
  createRecurring: (recurring: RecurringTransaction) => Promise<void>;
  updateRecurring: (
    id: number,
    recurring: RecurringTransaction
  ) => Promise<void>;
  toggleRecurring: (id: number) => Promise<void>;
  deleteRecurring: (id: number) => Promise<void>;
  processSingle: (id: number) => Promise<void>;
  processAll: () => Promise<void>;
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
  recurringList: [],
  history: [],
  filterType: "all",

  setFilterType: (filterType) => set({ filterType }),

  loadData: async () => {
    try {
      const [recurring, hist] = await Promise.all([
        invoke<RecurringTransaction[]>("get_recurring_transactions"),
        invoke<RecurringHistoryItem[]>("get_recurring_history", { limit: 10 }),
      ]);
      set({ recurringList: recurring, history: hist });
    } catch (e) {
      toast.error(i18n.t("toast.fetch_transactions_failed"));
    }
  },

  createRecurring: async (recurring) => {
    try {
      await invoke("create_recurring_transaction", { recurring });
      toast.success(i18n.t("toast.transaction_created"));
      get().loadData();
    } catch (e) {
      toast.error(i18n.t("toast.save_transaction_failed"));
    }
  },

  updateRecurring: async (id, recurring) => {
    try {
      await invoke("update_recurring_transaction", { id, recurring });
      toast.success(i18n.t("toast.transaction_updated"));
      get().loadData();
    } catch (e) {
      toast.error(i18n.t("toast.save_transaction_failed"));
    }
  },

  toggleRecurring: async (id) => {
    try {
      await invoke("toggle_recurring_transaction", { id });
      get().loadData();
    } catch (e) {
      toast.error(i18n.t("toast.save_transaction_failed"));
    }
  },

  deleteRecurring: async (id) => {
    try {
      await invoke("delete_recurring_transaction", { id });
      toast.success(i18n.t("toast.transaction_deleted"));
      get().loadData();
    } catch (e) {
      toast.error(i18n.t("toast.delete_transaction_failed"));
    }
  },

  processSingle: async (id) => {
    try {
      const count = await invoke<number>(
        "process_single_recurring_transaction",
        {
          recurringId: id,
        }
      );
      if (count > 0) {
        toast.success(i18n.t("notification.recurring_created", { count }));
      } else {
        toast.info(i18n.t("recurring.last_run_today"));
      }
      get().loadData();
    } catch (e) {
      toast.error(i18n.t("toast.save_transaction_failed"));
    }
  },

  processAll: async () => {
    try {
      const count = await invoke<number>("process_recurring_transactions");

      if (count > 0) {
        toast.success(i18n.t("notification.recurring_created", { count }));
      } else {
        toast.info(i18n.t("recurring.last_run_today"));
      }

      get().loadData();
    } catch (e) {
      console.error(e);
      toast.error(i18n.t("toast.save_transaction_failed"));
    }
  },
}));
