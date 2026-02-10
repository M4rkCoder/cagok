import React, { useState, useEffect, useMemo } from "react";
import CategoryForm from "./CategoryForm";
import type { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useConfirmStore } from "@/store/useConfirmStore";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const CategorySettings = () => {
  const { setHeader, resetHeader } = useHeaderStore();
  const categories = useAppStore((s) => s.categories);
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
  const [activeTab, setActiveTab] = useState<"income" | "expense">("expense"); // Default to expense

  useEffect(() => {
    setHeader("카테고리 설정");
    return () => resetHeader();
  }, [setHeader, resetHeader]);

  const { incomeCategories, expenseCategories } = useMemo(() => {
    return categories.reduce(
      (acc, category) => {
        if (category.type === 0) {
          acc.incomeCategories.push(category);
        } else {
          acc.expenseCategories.push(category);
        }
        return acc;
      },
      {
        incomeCategories: [] as Category[],
        expenseCategories: [] as Category[],
      },
    );
  }, [categories]);

  const handleSheetClose = () => {
    setSheetOpen(false);
    resetCategoryForm();
  };

  const handleNew = (type: 0 | 1) => {
    startEditCategory({
      id: 0, // 임시 ID
      name: "",
      icon: "➕",
      type: type,
    });
    setSheetOpen(true);
  };

  const handleEdit = (category: Category) => {
    startEditCategory(category);
    setSheetOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      await submitCategoryForm(values);
      setSheetOpen(false);
    } catch (error) {
      // 에러 처리는 store에서 이미 수행함
    }
  };

  const onClickDeleteCategory = (e: React.MouseEvent, cat: Category) => {
    e.preventDefault();
    e.stopPropagation();

    confirm({
      title: t("delete_category") || "카테고리 삭제",
      description: `[${cat.name}] ${t("delete_category_confirm_msg") || "카테고리를 삭제하시겠습니까? 관련 내역은 '미분류'로 변경됩니다."}`,
      onConfirm: async () => {
        try {
          await deleteCategory(cat.id);
          fetchCategories(); // 데이터 갱신
        } catch (err) {
          toast.error("삭제에 실패했습니다.");
        }
      },
    });
  };

  const CategoryList = ({
    title,
    categories,
    type,
    className,
  }: {
    title: string;
    categories: Category[];
    type: 0 | 1;
    className?: string;
  }) => (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        <Button size="sm" variant="ghost" onClick={() => handleNew(type)}>
          <Plus className="h-4 w-4 mr-2" />
          추가
        </Button>
      </CardHeader>
      <CardContent>
        <Separator />
        {categories.length === 0 ? (
          <p className="text-center py-8 text-sm text-muted-foreground">
            카테고리가 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 mt-6">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="group relative aspect-square flex flex-col items-center justify-between rounded-full overflow-hidden border border-border/40 shadow-sm hover:shadow-md transition-all bg-background cursor-pointer"
              >
                {/* Background color based on type */}
                <div
                  className={cn(
                    "absolute inset-0 opacity-40 transition-opacity group-hover:opacity-50",
                    type === 0 ? "bg-emerald-100" : "bg-indigo-100",
                  )}
                />

                {/* Icon Positioned */}
                <div className="flex-1 flex items-center justify-center pt-2 z-10 w-full">
                  <span className="text-4xl filter drop-shadow-sm transform group-hover:scale-110 transition-transform duration-300 native-emoji">
                    {cat.icon}
                  </span>
                </div>

                {/* Text Label Area */}
                <div
                  className={cn(
                    "w-full py-2 flex items-center justify-center z-10",
                    type === 0
                      ? "bg-emerald-200/80 text-emerald-900"
                      : "bg-indigo-200/80 text-indigo-900",
                  )}
                >
                  <span className="text-xs font-bold truncate px-3 w-full text-center">
                    {cat.name}
                  </span>
                </div>

                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20 backdrop-blur-[1px]">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full shadow-lg bg-white hover:bg-gray-100 text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(cat);
                    }}
                  >
                    <Pencil className="h-4 w-4 text-gray-700" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full shadow-lg"
                    onClick={(e) => onClickDeleteCategory(e, cat)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">카테고리 관리</h1>
          <p className="text-muted-foreground">
            수입 및 지출 카테고리를 추가, 수정, 삭제할 수 있습니다.
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="expense"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "income" | "expense")}
        className="w-full"
      >
        <TabsList className="flex w-full justify-start gap-2 bg-transparent border-b border-slate-200 rounded-none h-12 p-0 mb-8">
          <TabsTrigger
            value="income"
            className={cn(
              "bg-transparent border-b-2 border-transparent transition-all duration-300 flex items-center justify-center font-bold text-sm h-12 px-1 rounded-none shadow-none data-[state=active]:shadow-none",
              "data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent",
              "text-slate-500 hover:text-emerald-500",
            )}
          >
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-300",
              activeTab === "income" ? "bg-emerald-50 text-emerald-600" : "hover:bg-slate-50"
            )}>
              <ArrowUpCircle className={cn(
                "w-4 h-4 transition-colors",
                activeTab === "income" ? "text-emerald-600" : "text-slate-400"
              )} />
              수입
              <Badge
                variant="secondary"
                className={cn(
                  "ml-1 font-black px-1.5 py-0 min-w-[20px] justify-center transition-all duration-300 shadow-none border-none",
                  activeTab === "income"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {incomeCategories.length}
              </Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="expense"
            className={cn(
              "bg-transparent border-b-2 border-transparent transition-all duration-300 flex items-center justify-center font-bold text-sm h-12 px-1 rounded-none shadow-none data-[state=active]:shadow-none",
              "data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent",
              "text-slate-500 hover:text-indigo-500",
            )}
          >
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-300",
              activeTab === "expense" ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-50"
            )}>
              <ArrowDownCircle className={cn(
                "w-4 h-4 transition-colors",
                activeTab === "expense" ? "text-indigo-600" : "text-slate-400"
              )} />
              지출
              <Badge
                variant="secondary"
                className={cn(
                  "ml-1 font-black px-1.5 py-0 min-w-[20px] justify-center transition-all duration-300 shadow-none border-none",
                  activeTab === "expense"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {expenseCategories.length}
              </Badge>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="animate-in fade-in slide-in-from-left-2 duration-300">
          <CategoryList
            title="수입 카테고리"
            categories={incomeCategories}
            type={0}
          />
        </TabsContent>
        <TabsContent value="expense" className="animate-in fade-in slide-in-from-right-2 duration-300">
          <CategoryList
            title="지출 카테고리"
            categories={expenseCategories}
            type={1}
          />
        </TabsContent>
      </Tabs>

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
          <CategoryForm onSubmit={handleSubmit} onCancel={handleSheetClose} />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CategorySettings;
