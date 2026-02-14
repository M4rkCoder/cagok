import React, { useState, useEffect, useMemo } from "react";
import CategoryForm from "./CategoryForm";
import type { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Plus,
  Pencil,
  Trash2,
  CirclePlus,
  CircleMinus,
  Shapes,
  LayoutGrid,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useHeaderStore } from "@/store/useHeaderStore";
import { cn } from "@/lib/utils";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useAppStore } from "@/store/useAppStore";
import { Badge } from "@/components/ui/badge";
import { useConfirmStore } from "@/store/useConfirmStore";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const CategorySettings = () => {
  const { setHeader, resetHeader } = useHeaderStore();
  const categoryList = useAppStore((s) => s.categoryList);
  console.log(categoryList);
  const {
    editingCategoryId,
    startEditCategory,
    deleteCategory,
    resetCategoryForm,
    submitCategoryForm,
  } = useCategoryStore();
  const { fetchCategories } = useAppStore();
  const { confirm } = useConfirmStore();
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "income" | "expense">("all");

  useEffect(() => {
    setHeader("설정");
    return () => resetHeader();
  }, [setHeader, resetHeader]);

  const { incomeCategories, expenseCategories } = useMemo(() => {
    return categoryList.reduce(
      (acc, category) => {
        if (category.type === 0) acc.incomeCategories.push(category);
        else acc.expenseCategories.push(category);
        return acc;
      },
      {
        incomeCategories: [] as Category[],
        expenseCategories: [] as Category[],
      },
    );
  }, [categoryList]);

  const currentCategories =
    activeTab === "all"
      ? categoryList
      : activeTab === "income"
      ? incomeCategories
      : expenseCategories;
      
  const currentType = activeTab === "income" ? 0 : 1; // Default to expense if 'all'

  const handleNew = () => {
    startEditCategory({ id: 0, name: "", icon: "➕", type: currentType });
    setSheetOpen(true);
  };

  const handleEdit = (category: Category) => {
    startEditCategory(category);
    setSheetOpen(true);
  };

  const onClickDeleteCategory = (e: React.MouseEvent, cat: Category) => {
    e.preventDefault();
    e.stopPropagation();
    confirm({
      title: "카테고리 삭제",
      description: `[${cat.name}] 카테고리를 삭제하시겠습니까? 관련 내역은 '미분류'로 변경됩니다.`,
      onConfirm: async () => {
        try {
          await deleteCategory(cat.id);
          fetchCategories();
        } catch (err) {
          toast.error("삭제에 실패했습니다.");
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Shapes className="w-5 h-5" /> 카테고리 관리
        </div>
        <CardHeader className="p-0 pb-6 flex flex-col items-center justify-between space-y-0">
          {/* 언더라인 탭 내비게이션 */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 w-full relative">
            {[
              {
                id: "all",
                label: "전체",
                icon: LayoutGrid,
                color: "text-slate-600",
                bg: "bg-slate-600",
                count: categoryList.length,
              },
              {
                id: "income",
                label: "수입",
                icon: CirclePlus,
                color: "text-emerald-600",
                bg: "bg-emerald-600",
                count: incomeCategories.length,
              },
              {
                id: "expense",
                label: "지출",
                icon: CircleMinus,
                color: "text-blue-600",
                bg: "bg-blue-600",
                count: expenseCategories.length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "all" | "income" | "expense")}
                className={cn(
                  "relative px-6 py-4 text-sm font-bold transition-all flex items-center gap-2 outline-none",
                  activeTab === tab.id
                    ? tab.color
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                <tab.icon
                  className={cn(
                    "w-4 h-4",
                    activeTab === tab.id ? tab.color : "text-slate-300",
                  )}
                />
                {tab.label}
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1 h-5 px-1.5 text-[10px] font-black border-none shadow-none",
                    activeTab === tab.id
                      ? "bg-slate-100"
                      : "bg-transparent text-slate-300",
                  )}
                >
                  {tab.count}
                </Badge>

                {activeTab === tab.id && (
                  <motion.div
                    layoutId="categoryTabUnderline"
                    className={cn(
                      "absolute bottom-0 left-0 right-0 h-0.5",
                      tab.bg,
                    )}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}

            {/* 우측 상단 추가 버튼 */}
            <div className="absolute right-0 bottom-2">
              <Button
                size="sm"
                onClick={handleNew}
                className="rounded-full shadow-sm px-4"
              >
                <Plus className="h-4 w-4 mr-1" /> 추가
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                  <p className="text-sm text-muted-foreground font-medium">
                    등록된 카테고리가 없습니다.
                  </p>
                  <Button
                    variant="link"
                    onClick={handleNew}
                    className="text-blue-600 mt-2"
                  >
                    새로 추가하기
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 pt-2">
                  {currentCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="group relative aspect-square flex flex-col items-center justify-between rounded-full overflow-hidden border border-border/40 shadow-sm hover:shadow-md transition-all bg-background cursor-pointer"
                    >
                      <div
                        className={cn(
                          "absolute inset-0 opacity-40 transition-opacity group-hover:opacity-50",
                          cat.type === 0 // Income
                            ? "bg-emerald-100"
                            : "bg-indigo-100", // Expense
                        )}
                      />

                      <div className="flex-1 flex items-center justify-center pt-2 z-10 w-full">
                        <span className="text-4xl filter drop-shadow-sm transform group-hover:scale-110 transition-transform duration-300 native-emoji">
                          {cat.icon}
                        </span>
                      </div>

                      <div
                        className={cn(
                          "w-full py-2 flex items-center justify-center z-10",
                          cat.type === 0
                            ? "bg-emerald-200/80 text-emerald-900"
                            : "bg-indigo-200/80 text-indigo-900",
                        )}
                      >
                        <span className="text-xs font-bold px-1 w-full text-center break-keep leading-tight">
                          {cat.name}
                        </span>
                      </div>

                      {/* 액션 오버레이 */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20 backdrop-blur-[1px]">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full shadow-lg bg-white border-none hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(cat);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate-700" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full shadow-lg bg-white border-none hover:bg-rose-50 hover:text-rose-600"
                          onClick={(e) => onClickDeleteCategory(e, cat)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="top-12 h-[calc(100vh-theme(spacing.12))]"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <SheetHeader className="mb-6">
            <SheetTitle>
              {editingCategoryId !== null ? "카테고리 수정" : "새 카테고리"}
            </SheetTitle>
            <SheetDescription>
              카테고리 정보를 입력하고 저장하세요.
            </SheetDescription>
          </SheetHeader>
          <CategoryForm
            onSubmit={() => setSheetOpen(false)}
            onCancel={() => {
              setSheetOpen(false);
              resetCategoryForm();
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CategorySettings;
