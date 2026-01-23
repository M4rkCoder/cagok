import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { Category } from "@/types";
import { toast } from "sonner";
import { useAppStore } from "./useAppStore";

interface CategoryState {
  // 상태 (UI 관련)
  isAddingNewCategoryMode: boolean;
  editingCategoryId: number | null;
  newCategoryName: string;
  newCategoryIcon: string;
  isEmojiPickerOpen: boolean;

  // 액션
  setCategoryState: (key: string, value: any) => void;
  resetCategoryForm: () => void;
  startEditCategory: (cat: Category) => void;

  // API 액션 (Tauri Invoke)
  addCategory: (category: {
    name: string;
    icon: string;
    type: number;
  }) => Promise<void>;
  updateCategory: (
    id: number,
    payload: { name: string; icon: string; type: number }
  ) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  // 초기 상태
  isAddingNewCategoryMode: false,
  editingCategoryId: null,
  newCategoryName: "",
  newCategoryIcon: "😀",
  isEmojiPickerOpen: false,

  // 단순 상태 변경
  setCategoryState: (key, value) =>
    set((state) => ({ ...state, [key]: value })),

  // 폼 초기화
  resetCategoryForm: () =>
    set({
      isAddingNewCategoryMode: false,
      editingCategoryId: null,
      newCategoryName: "",
      newCategoryIcon: "😀",
      isEmojiPickerOpen: false,
    }),

  // 수정 모드 진입
  startEditCategory: (cat) =>
    set({
      editingCategoryId: cat.id,
      newCategoryName: cat.name,
      newCategoryIcon: cat.icon,
      isAddingNewCategoryMode: true,
    }),

  // 백엔드 통신: 추가
  addCategory: async (category: {
    name: string;
    icon: string;
    type: number;
  }) => {
    try {
      await invoke("create_category", {
        category: {
          name: category.name,
          icon: category.icon,
          type: category.type,
        },
      });
      toast.success("카테고리가 추가되었습니다.");
      await useAppStore.getState().fetchCategories();
    } catch (error) {
      toast.error("카테고리 추가 실패");
      console.log(error);
    }
  },

  // 백엔드 통신: 수정
  updateCategory: async (id, payload) => {
    try {
      await invoke("update_category", { id, category: payload });
      get().resetCategoryForm();
      toast.success(`${payload.icon} ${payload.name}카테고리를 수정했습니다.`);
      await useAppStore.getState().fetchCategories();
    } catch (error) {
      toast.error("카테고리 수정 오류");
      console.log(error);
    }
  },

  // 백엔드 통신: 삭제
  deleteCategory: async (id) => {
    try {
      await invoke("delete_category", { id });
      toast.success("카테고리를 삭제했습니다.");
      // 삭제 후 만약 수정 중이던 아이템이라면 폼 초기화
      if (get().editingCategoryId === id) get().resetCategoryForm();
      await useAppStore.getState().fetchCategories();
    } catch (error) {
      toast.error("카테고리 삭제 오류");
      console.log(error);
    }
  },
}));
