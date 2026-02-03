import React, { useState, useEffect, useRef } from "react";
import { CellContext } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { format, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ExpenseBadge, IncomeBadge } from "./TransactionBadge";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import EmojiPicker, { EmojiClickData, EmojiStyle } from "emoji-picker-react";
import {
  Check,
  Plus,
  X,
  SquarePen,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  CalendarIcon,
  CirclePlus,
  CircleMinus,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Category } from "@/types";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useAppStore } from "@/store/useAppStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useCategoryStore } from "@/store/useCategoryStore"; // Added useCategoryStore

const smartParseDate = (input: string): string => {
  if (!input) return "";
  const today = new Date();
  const year = today.getFullYear();
  const clean = input.replace(/[^0-9]/g, "");
  let res: Date;
  if (clean.length === 8)
    res = new Date(
      parseInt(clean.slice(0, 4)),
      parseInt(clean.slice(4, 6)) - 1,
      parseInt(clean.slice(6, 8)),
    );
  else if (clean.length === 4)
    res = new Date(
      year,
      parseInt(clean.slice(0, 2)) - 1,
      parseInt(clean.slice(2, 4)),
    );
  else if (clean.length === 2 || clean.length === 1)
    res = new Date(year, today.getMonth(), parseInt(clean));
  else {
    const p = input.split(/[-./]/);
    if (p.length === 3)
      res = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
    else return input;
  }
  return isNaN(res.getTime()) ? input : format(res, "yyyy-MM-dd");
};

interface TransactionRow {
  id: string;
  date: string;
  type?: number; // Made optional
  category_id?: string; // Made optional
  is_fixed: number;
  description: string;
  amount: string;
  remarks: string;
}

const EditableCell = ({
  getValue,
  row,
  column,
  table,
  colIdx,
}: CellContext<TransactionRow, any> & { colIdx: number }): React.ReactNode => {
  const { t } = useTranslation();
  const { fetchCategories } = useAppStore();
  const {
    isAddingNewCategoryMode,
    isEmojiPickerOpen,
    newCategoryName,
    newCategoryIcon,
    editingCategoryId,
    setCategoryState,
    resetCategoryForm,
    startEditCategory: startEditCategoryFromStore,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryStore();

  const initialValue = getValue();
  const {
    updateData,
    setActiveCell,
    activeCell,
    categories,
    onDragStart,
    batchUpdate,
  } = table.options.meta as any;
  const [value, setValue] = useState(initialValue);
  const [openCombo, setOpenCombo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const comboTriggerRef = useRef<HTMLButtonElement>(null);

  // Local state for new category type and delete confirmation
  const [newCategoryType, setNewCategoryType] = useState<number>(1); // Default to expense
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const isActive =
    activeCell?.rowIndex === row.index && activeCell?.colIdx === colIdx;

  useEffect(() => {
    if (isActive) {
      if (column.id === "category_id") {
        setOpenCombo(true);
        setNewCategoryType(row.original.type ?? 1); // Set initial type for new category based on transaction type
      } else {
        inputRef.current?.focus();
      }
    } else {
      setOpenCombo(false);
      // Reset category creation states when combo closes
      setCategoryState("isAddingNewCategoryMode", false);
      setCategoryState("isEmojiPickerOpen", false);
      setCategoryState("newCategoryName", "");
      setCategoryState("newCategoryIcon", "😀");
      setNewCategoryType(1); // Reset to default expense
      setCategoryState("editingCategoryId", null);
      setCategoryToDelete(null);
    }
  }, [isActive, column.id, row.original.type, setCategoryState]);

  const moveNext = (r: number, c: number) =>
    setActiveCell({ rowIndex: r, colIdx: c });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const maxRows = table.getRowModel().rows.length;

    if (e.key === "Tab") {
      e.preventDefault();
      if (column.id === "category_id") {
        if (e.shiftKey)
          moveNext(row.index, 1); // Shift+Tab: 날짜로
        else moveNext(row.index, row.original.type === 1 ? 3 : 4); // Tab: 고정 또는 설명으로
      } else if (e.shiftKey) {
        const prevCol = colIdx === 1 ? 6 : colIdx - 1;
        const prevRow = colIdx === 1 ? Math.max(0, row.index - 1) : row.index;
        moveNext(prevRow, prevCol);
      } else {
        const nextCol = colIdx === 6 ? 1 : colIdx + 1;
        const nextRow =
          colIdx === 6 ? Math.min(maxRows - 1, row.index + 1) : row.index;
        moveNext(nextRow, nextCol);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      moveNext(Math.min(maxRows - 1, row.index + 1), 1); // Move to the 'date' column (colIdx 1) of the next row
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveNext(Math.max(0, row.index - 1), colIdx);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveNext(Math.min(maxRows - 1, row.index + 1), colIdx);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveNext(row.index, Math.max(1, colIdx - 1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      moveNext(row.index, Math.min(6, colIdx + 1));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasteData = e.clipboardData.getData("text");
    const rows = pasteData.split(/\r\n|\n|\r/).map((r) => r.split("\t"));
    if (rows.length > 0) {
      e.preventDefault();
      batchUpdate(row.index, colIdx, rows);
    }
  };

  // Helper functions for category creation/editing/deletion
  // Using store's resetCategoryForm

  const currentType = row.original.type ?? 1; // Default to expense if type is undefined

  const handleSaveCategory = async () => {
    if (!newCategoryName) {
      toast.error(t("category_name_empty"));
      return;
    }

    const payload = {
      name: newCategoryName,
      icon: newCategoryIcon,
      type: newCategoryType,
    };

    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, payload);
      } else {
        await addCategory(payload);
      }
      fetchCategories();
      resetCategoryForm();
      setOpenCombo(false);
    } catch (error) {
      console.error("Failed to save category:", error);
    }
  };

  const startEditCategory = (category: Category) => {
    startEditCategoryFromStore(category); // Use store's action
    setNewCategoryType(category.type); // Keep local state updated
    setOpenCombo(true); // Open the combo to edit
  };

  const onClickDeleteCategory = (category: Category) => {
    setCategoryToDelete(category); // Set local state for confirmation dialog
    setDeleteConfirmOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete.id);
      fetchCategories();
      setDeleteConfirmOpen(false);
      setOpenCombo(false); // Close popover after deletion
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  // --- 날짜 열 (Popover + Calendar) ---
  if (column.id === "date") {
    return (
      <div className="relative w-full h-full group">
        <Input
          ref={inputRef}
          value={value ?? ""}
          onChange={(e) => setValue(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            let f = value;
            if (value) f = smartParseDate(value);
            if (initialValue !== f) updateData(row.index, column.id, f);
          }}
          className={cn(
            "w-full h-full bg-transparent border-none focus-visible:ring-0 pr-10 pl-2 text-[13px] rounded-none",
            isActive && "z-20",
          )}
        />
        <Popover open={openCombo} onOpenChange={setOpenCombo}>
          <PopoverTrigger asChild>
            <button
              className="absolute right-0 top-0 size-10 z-30 flex items-center justify-center"
              onClick={() => setOpenCombo(true)}
              onKeyDown={handleKeyDown}
              tabIndex={-1}
            >
              <CalendarIcon className="size-4 text-slate-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <Calendar
              mode="single"
              selected={value ? parseISO(value) : undefined}
              onSelect={(date) => {
                if (date) {
                  const formattedDate = format(date, "yyyy-MM-dd");
                  updateData(row.index, "date", formattedDate);
                  setValue(formattedDate);
                  setOpenCombo(false);
                  inputRef.current?.focus();
                }
              }}
            />
          </PopoverContent>
        </Popover>
        <div
          onMouseDown={(e) => onDragStart(e, row.index, colIdx)}
          className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair hidden group-hover:block z-40"
        />
      </div>
    );
  }

  // --- 항목 열 (Popover + Command) ---
  if (column.id === "category_id") {
    const selected = categories.find((c: any) => c.id === value);

    return (
      <div className="relative w-full h-full group">
        <Popover open={openCombo} onOpenChange={setOpenCombo}>
          <PopoverTrigger asChild>
            <button
              ref={comboTriggerRef}
              onKeyDown={handleKeyDown}
              onClick={() => setOpenCombo(true)}
              className={cn(
                "w-full h-full flex items-center px-2 outline-none transition-colors",
                isActive && "bg-blue-50/50",
              )}
            >
              {selected ? (
                <div className="flex items-center gap-1 truncate text-[12px]">
                  {selected.type === 0 ? <IncomeBadge /> : <ExpenseBadge />}
                  <span>
                    {selected.icon} {selected.name}
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 text-[12px]">
                  {t("select")}...
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-[250px]"
            align="start"
            onOpenAutoFocus={(e) => {
              /* CommandInput autoFocus 작동을 위해 비워둠 */
            }}
          >
            <Command>
              {isEmojiPickerOpen ? (
                <div className="flex flex-col animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center justify-between p-2 border-b">
                    <span className="text-[10px] font-bold text-slate-400 ml-2">
                      {t("select_icon")}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        setCategoryState("isEmojiPickerOpen", false)
                      }
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="w-full h-[300px]">
                    <EmojiPicker
                      onEmojiClick={(data: EmojiClickData) => {
                        setCategoryState("newCategoryIcon", data.emoji);
                        setCategoryState("isEmojiPickerOpen", false);
                      }}
                      height="100%"
                      width="100%"
                      emojiStyle={EmojiStyle.NATIVE}
                      previewConfig={{ showPreview: false }}
                      skinTonesDisabled
                    />
                  </div>
                </div>
              ) : (
                <>
                  <CommandInput
                    placeholder={t("search_category")}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Tab") {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenCombo(false);
                        if (e.shiftKey) moveNext(row.index, 1);
                        else
                          moveNext(row.index, row.original.type === 1 ? 3 : 4);
                      } else if (e.key === "ArrowLeft") {
                        e.preventDefault();
                        setOpenCombo(false);
                        moveNext(row.index, 1); // 날짜 열로 이동
                      } else if (e.key === "ArrowRight") {
                        e.preventDefault();
                        setOpenCombo(false);
                        // 지출(type:1)이면 고정열(3), 수입(type:0)이면 설명열(4)로 이동
                        moveNext(row.index, row.original.type === 1 ? 3 : 4);
                      }
                      // Allow default Enter behavior when not creating a new category
                      // This enables selecting a highlighted item in the CommandList
                      if (e.key === "Enter" && isAddingNewCategoryMode) {
                        e.preventDefault();
                        e.stopPropagation();
                        // The Command component should handle the selection itself
                        // We only prevent default here to avoid form submission if applicable
                      }
                    }}
                  />
                  <CommandList className="max-h-[350px] overflow-y-auto p-1 scrollbar-hide">
                    <CommandEmpty className="py-6 text-center text-xs text-slate-400">
                      {t("no_results")}
                    </CommandEmpty>
                    <CommandGroup>
                      {categories.map((cat: Category) => (
                        <CommandItem
                          key={cat.id}
                          className="flex items-center justify-between px-3 py-1 rounded-xl cursor-pointer group mb-0.5"
                          onSelect={() => {
                            updateData(row.index, "category_id", cat.id);
                            updateData(row.index, "type", cat.type);
                            setOpenCombo(false);
                            setTimeout(
                              () => moveNext(row.index, cat.type === 1 ? 3 : 4),
                              50,
                            );
                          }}
                        >
                          <div className="flex items-center gap-1">
                            {cat.type === 0 ? (
                              <IncomeBadge />
                            ) : (
                              <ExpenseBadge />
                            )}
                            <CategoryIcon
                              icon={cat.icon}
                              type={currentType}
                              size="xs"
                            />
                            <span className="font-semibold text-slate-600 text-xs">
                              {cat.name}
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                startEditCategory(cat);
                              }}
                              className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 hover:text-blue-500"
                            >
                              <SquarePen className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                onClickDeleteCategory(cat);
                              }}
                              className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {value === cat.id && (
                              <Check className="w-3.5 h-3.5 text-black ml-1" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>

                    {isAddingNewCategoryMode && (
                      <div className="relative p-2 mt-1 border border-dashed rounded-xl bg-slate-50 border-slate-300 mx-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute w-7 h-7 p-0 text-slate-400 rounded-md top-1 right-1"
                          onClick={resetCategoryForm}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2 pr-8">
                          {/* Type Selection */}
                          <Select
                            value={String(newCategoryType)}
                            onValueChange={(value) =>
                              setNewCategoryType(Number(value))
                            }
                          >
                            <SelectTrigger className="w-fit h-9 text-[10px] font-bold bg-white rounded-lg shadow-sm px-2">
                              <SelectValue>
                                {newCategoryType === 0 ? (
                                  <CirclePlus className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <CircleMinus className="w-3.5 h-3.5 text-rose-500" />
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">
                                <IncomeBadge />
                              </SelectItem>
                              <SelectItem value="1">
                                <ExpenseBadge />
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <button
                            type="button"
                            onClick={() =>
                              setCategoryState("isEmojiPickerOpen", true)
                            }
                            className="w-9 h-9 flex items-center justify-center bg-white border rounded-lg shadow-sm text-lg shrink-0 native-emoji"
                          >
                            {newCategoryIcon}
                          </button>
                          <Input
                            autoFocus
                            value={newCategoryName}
                            onChange={(e) =>
                              setCategoryState(
                                "newCategoryName",
                                e.target.value,
                              )
                            }
                            placeholder={
                              editingCategoryId ? t("edit_name") : t("new_name")
                            }
                            className="h-9 text-xs border-none bg-transparent focus-visible:ring-0 px-1 flex-1 font-bold"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveCategory();
                              }
                            }}
                          />
                          <div className="flex gap-1 shrink-0">
                            <Button
                              type="button"
                              size="icon"
                              className="w-7 h-7 bg-black text-white rounded-md"
                              onClick={handleSaveCategory}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CommandList>
                  {!isAddingNewCategoryMode && (
                    <button
                      type="button"
                      onClick={() =>
                        setCategoryState("isAddingNewCategoryMode", true)
                      }
                      className="w-full py-3 flex items-center justify-center gap-1.5 text-[10px] font-black text-emerald-500 border-t border-slate-50 hover:bg-slate-50 transition-colors uppercase"
                    >
                      <Plus className="w-3.5 h-3.5" /> {t("add_new_category")}
                    </button>
                  )}
                </>
              )}
            </Command>
          </PopoverContent>
        </Popover>

        <AlertDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("confirm_delete_category")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("delete_category_warning")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCategory}
                className="bg-rose-500 hover:bg-rose-600"
              >
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div
          onMouseDown={(e) => onDragStart(e, row.index, colIdx)}
          className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair hidden group-hover:block z-40"
        />
      </div>
    );
  }

  // --- 일반 입력 열 ---
  return (
    <div className="relative w-full h-full group">
      <Input
        ref={inputRef}
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          let f = value;
          if (column.id === "date" && value) f = smartParseDate(value);
          if (initialValue !== f) updateData(row.index, column.id, f);
        }}
        className={cn(
          "w-full h-full bg-transparent border-none focus-visible:ring-0 px-2 text-[13px] rounded-none",
          (column.columnDef.meta as any)?.type === "number" &&
            "text-right font-mono",
        )}
      />
      <div
        onMouseDown={(e) => onDragStart(e, row.index, colIdx)}
        className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair hidden group-hover:block z-20"
      />
    </div>
  );
};

export default EditableCell;

export type { TransactionRow };
