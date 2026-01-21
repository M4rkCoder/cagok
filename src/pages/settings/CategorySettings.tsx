import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import CategoryForm from "./CategoryForm";
import type { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
// Dialog 대신 Sheet 관련 컴포넌트 임포트
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const CategorySettings = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false); // 이름을 sheetOpen으로 변경
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const fetchedCategories = await invoke<Category[]>("get_categories");
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingCategory(null);
  };

  const handleNew = () => {
    setEditingCategory(null);
    setSheetOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setSheetOpen(true);
  };

  const handleDelete = async (id: number) => {
    // Tauri/로컬 앱 감성을 위해 브라우저 confirm 대신 나중에 커스텀 AlertDialog를 쓰는 것이 좋지만,
    // 우선 로직 유지를 위해 남겨둡니다.
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await invoke("delete_category", { id });
        fetchCategories();
      } catch (error) {
        console.error("Failed to delete category:", error);
      }
    }
  };

  const handleFormSubmit = async (values: {
    name: string;
    icon: string;
    type: string;
  }) => {
    const payload = {
      ...values,
      type: parseInt(values.type, 10),
    };

    try {
      if (editingCategory) {
        await invoke("update_category", {
          id: editingCategory.id!,
          category: payload,
        });
      } else {
        await invoke("create_category", { category: payload });
      }
      handleSheetClose();
      fetchCategories();
    } catch (error) {
      console.error("Failed to save category:", error);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your transaction categories.
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" /> New Category
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 italic text-muted-foreground">
          Loading categories...
        </div>
      ) : (
        <div className="border rounded-md shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[100px]">Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="text-2xl leading-none">
                      {cat.icon}
                    </TableCell>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={cat.type === 0 ? "secondary" : "destructive"}
                      >
                        {cat.type === 0 ? "Income" : "Expense"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(cat)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cat.id!)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sheet 구현 부분 */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} modal={false}>
        <SheetContent
          side="right"
          data-tauri-drag-region={false}
          className="top-12 h-[calc(100vh-theme(spacing.12))]"
        >
          <SheetHeader className="mb-6">
            <SheetTitle>
              {editingCategory ? "Edit Category" : "New Category"}
            </SheetTitle>
            <SheetDescription>
              {editingCategory
                ? "Update the details for this category."
                : "Add a new category to organize your transactions."}
            </SheetDescription>
          </SheetHeader>
          <CategoryForm
            onSubmit={handleFormSubmit}
            onCancel={handleSheetClose}
            defaultValues={editingCategory || undefined}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CategorySettings;
