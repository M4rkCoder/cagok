import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { Category } from "@/types";
import { toast } from "sonner";
import i18n from "@/i18n"; // i18n 임포트 추가
import { useAppStore } from "./useAppStore";

interface CategoryPayload {
  name: string;
  icon: string;
  type: number;
}

interface CategoryState {
  isAddingNewCategoryMode: boolean;
  editingCategoryId: number | null;
  newCategoryName: string;
  newCategoryIcon: string;
  newCategoryType: number;
  isEmojiPickerOpen: boolean;

  setCategoryState: (key: string, value: any) => void;
  resetCategoryForm: () => void;
  startEditCategory: (cat: Category) => void;
  addCategory: (payload: CategoryPayload) => Promise<void>;
  updateCategory: (id: number, payload: CategoryPayload) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  submitCategoryForm: (values: {
    name: string;
    icon: string;
    type: string;
  }) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  isAddingNewCategoryMode: false,
  editingCategoryId: null,
  newCategoryName: "",
  newCategoryIcon: "😀",
  newCategoryType: 1,
  isEmojiPickerOpen: false,

  setCategoryState: (key, value) =>
    set((state) => ({ ...state, [key]: value })),

  resetCategoryForm: () =>
    set({
      isAddingNewCategoryMode: false,
      editingCategoryId: null,
      newCategoryName: "",
      newCategoryIcon: "😀",
      newCategoryType: 1,
      isEmojiPickerOpen: false,
    }),

  startEditCategory: (cat) =>
    set({
      editingCategoryId: cat.id,
      newCategoryName: cat.name,
      newCategoryIcon: cat.icon,
      newCategoryType: cat.type,
      isAddingNewCategoryMode: true,
    }),

  addCategory: async (payload) => {
    try {
      await invoke("create_category", { category: payload });
      toast.success(i18n.t("toast.transaction_created"));
      await useAppStore.getState().fetchCategories();
    } catch (error) {
      toast.error(i18n.t("toast.save_transaction_failed"));
      console.error(error);
    }
  },

  updateCategory: async (id, payload) => {
    try {
      await invoke("update_category", { id, category: payload });
      get().resetCategoryForm();
      toast.success(i18n.t("toast.transaction_updated"));
      await useAppStore.getState().fetchCategories();
    } catch (error) {
      toast.error(i18n.t("toast.save_transaction_failed"));
      console.error(error);
    }
  },

  deleteCategory: async (id) => {
    try {
      await invoke("delete_category", { id });
      toast.success(i18n.t("toast.transaction_deleted"));
      if (get().editingCategoryId === id) get().resetCategoryForm();
      await useAppStore.getState().fetchCategories();
    } catch (error) {
      toast.error(i18n.t("toast.delete_transaction_failed"));
      console.error(error);
    }
  },

  submitCategoryForm: async (values) => {
    const { editingCategoryId } = get();
    const payload = {
      name: values.name,
      icon: values.icon,
      type: parseInt(values.type, 10),
    };

    try {
      if (editingCategoryId) {
        await invoke("update_category", {
          id: editingCategoryId,
          category: payload,
        });
        toast.success(i18n.t("toast.transaction_updated"));
      } else {
        await invoke("create_category", { category: payload });
        toast.success(i18n.t("toast.transaction_created"));
      }

      get().resetCategoryForm();
      await useAppStore.getState().fetchCategories();
    } catch (error: any) {
      const errorMsg = error?.toString?.() || String(error || "");

      // UNIQUE 제약 조건 위반 (이름 중복) 처리
      if (
        errorMsg.includes("UNIQUE constraint failed") &&
        errorMsg.includes("categories.name")
      ) {
        toast.error(i18n.t("settings.category.name_duplicate")); // "이미 존재하는 카테고리 이름입니다."
      } else {
        toast.error(i18n.t("toast.save_transaction_failed"));
      }
      console.error("Category save error:", error);
    }
  },
}));
