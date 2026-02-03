import React, { useState, useEffect, useMemo } from "react";
import CategoryForm from "./CategoryForm";
import type { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Plus, Pencil, Trash2 } from "lucide-react";
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

const CategorySettings = () => {
  const { setHeader, resetHeader } = useHeaderStore();
  const categories = useAppStore((s) => s.categories);
  const { editingCategoryId, startEditCategory, deleteCategory, resetCategoryForm, submitCategoryForm } = useCategoryStore();
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

  const handleDelete = async (id: number) => {
    if (window.confirm("정말로 이 카테고리를 삭제하시겠습니까?")) {
      try {
        await deleteCategory(id);
      } catch (error) {
        console.error("Failed to delete category:", error);
      }
    }
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white shadow-sm hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <CategoryIcon icon={cat.icon} type={cat.type} size="md" />
                  <span className="font-semibold text-sm">{cat.name}</span>
                </div>
                <div className="hidden group-hover:flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(cat)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>수정</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(cat.id!)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>삭제</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </li>
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

      <Tabs defaultValue="expense" value={activeTab} onValueChange={(value) => setActiveTab(value as "income" | "expense")}>
        <TabsList className="mb-4">
          <TabsTrigger value="income">
            수입
            <Badge variant="secondary" className="ml-2">
              {incomeCategories.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="expense">
            지출
            <Badge variant="secondary" className="ml-2">
              {expenseCategories.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income">
          <CategoryList title="수입 카테고리" categories={incomeCategories} type={0} />
        </TabsContent>
        <TabsContent value="expense">
          <CategoryList title="지출 카테고리" categories={expenseCategories} type={1} />
        </TabsContent>
      </Tabs>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} modal={false}>
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
            onSubmit={submitCategoryForm}
            onCancel={handleSheetClose}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CategorySettings;