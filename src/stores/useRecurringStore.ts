import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
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
      toast.error("데이터 로딩 실패");
    }
  },

  createRecurring: async (recurring) => {
    await invoke("create_recurring_transaction", { recurring });
    get().loadData();
  },

  updateRecurring: async (id, recurring) => {
    await invoke("update_recurring_transaction", { id, recurring });
    get().loadData();
  },

  toggleRecurring: async (id) => {
    await invoke("toggle_recurring_transaction", { id });
    get().loadData();
  },

  deleteRecurring: async (id) => {
    await invoke("delete_recurring_transaction", { id });
    get().loadData();
  },

  processSingle: async (id) => {
    const count = await invoke<number>("process_single_recurring_transaction", {
      recurringId: id,
    });
    if (count > 0) toast.success("기록이 생성되었습니다.");
    else toast.info("조건을 충족하는 미생성 내역이 없습니다.");
    get().loadData();
  },

  processAll: async () => {
    try {
      // Rust의 process_recurring_transactions 실행
      const count = await invoke<number>("process_recurring_transactions");

      if (count > 0) {
        toast.success(`${count}건의 반복 내역이 처리되었습니다.`);
      } else {
        toast.info("오늘 처리할 반복 내역이 없습니다.");
      }

      // 데이터 새로고침
      get().loadData();
    } catch (e) {
      console.error(e);
      toast.error("반복 내역 처리 중 오류가 발생했습니다.");
    }
  },
}));
