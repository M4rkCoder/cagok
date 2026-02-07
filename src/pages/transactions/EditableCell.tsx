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
import { QuickEntryTransactionRow } from "./QuickEntry";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

interface EditableCellProps extends CellContext<QuickEntryTransactionRow, any> {
  colIdx: number;
  error?: { message: string; timestamp: number }; // Updated error prop type
}

const EditableCell = ({
  getValue,
  row,
  column,
  table,
  colIdx,
  error,
}: EditableCellProps): React.ReactNode => {
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
  const [categoryFilterType, setCategoryFilterType] = useState<number | null>(
    null,
  ); // null: all, 0: income, 1: expense
  const [commandSearchTerm, setCommandSearchTerm] = useState(""); // New state for command input search term
    const inputRef = useRef<HTMLInputElement>(null);
    const comboTriggerRef = useRef<HTMLButtonElement>(null);
    const [showErrorVisuals, setShowErrorVisuals] = useState(false);
  
    // Local state for new category type and delete confirmation
  
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
      null,
    );
  
    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);
  
    useEffect(() => {
      if (error && error.message && error.timestamp) {
        setShowErrorVisuals(true);
        const timer = setTimeout(() => {
          setShowErrorVisuals(false);
        }, 1000); // 1 second
        return () => clearTimeout(timer);
      } else {
        setShowErrorVisuals(false);
      }
    }, [error]);
  
    const isActive =
      activeCell?.rowIndex === row.index && activeCell?.colIdx === colIdx;
  
    // Filtered categories based on categoryFilterType
    const filteredCategories = categories.filter((cat: Category) => {
      if (categoryFilterType === null) return true;
      return cat.type === categoryFilterType;
    });
  
    useEffect(() => {
      if (isActive) {
        if (column.id === "category_id") {
          setOpenCombo(true);
          setCategoryFilterType(row.original.type ?? null); // Set initial filter based on transaction type
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
        setCategoryState("editingCategoryId", null);
        setCategoryToDelete(null);
        setCategoryFilterType(null); // Reset filter type
        setCommandSearchTerm(""); // Reset search term
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
  
    const currentType = row.original.type ?? 1; // Default to expense if type is undefined
  
    const handleSaveCategory = async () => {
      if (!newCategoryName) {
        toast.error(t("category_name_empty"));
        return;
      }
  
      const typeToSave = editingCategoryId
        ? categories.find((c) => c.id === editingCategoryId)?.type // Use existing category's type for edits
        : categoryFilterType !== null
          ? categoryFilterType
          : 1; // Default to expense if categoryFilterType is null (shouldn't happen with current UI logic)
  
      const payload = {
        name: newCategoryName,
        icon: newCategoryIcon,
        type: typeToSave,
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
        <div className="relative w-full h-full flex flex-col justify-center bg-transparent">
          <TooltipProvider delayDuration={0}>
            <Tooltip open={showErrorVisuals}>
              <TooltipTrigger asChild>
                <div className="relative flex items-center h-full">
                  <input
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
                      showErrorVisuals && "border-red-500 outline outline-2 outline-red-500",
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
                </div>
              </TooltipTrigger>
              {showErrorVisuals && error?.message && (
                <TooltipContent side="bottom" className="bg-red-500 text-white text-xs p-1 px-2 rounded-md">
                  {error.message}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
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
        <div className="relative w-full h-full flex flex-col justify-center bg-transparent">
          <TooltipProvider delayDuration={0}>
            <Tooltip open={showErrorVisuals}>
              <TooltipTrigger asChild>
                <div className="relative flex items-center h-full">
                  <Popover open={openCombo} onOpenChange={setOpenCombo}>
                    <PopoverTrigger asChild>
                      <button
                        ref={comboTriggerRef}
                        onKeyDown={handleKeyDown}
                        onClick={() => setOpenCombo(true)}
                        className={cn(
                          "flex h-full w-full items-center px-2 text-[13px] outline-none transition-colors",
                          "bg-transparent border-none rounded-none",
                          isActive ? "bg-blue-50/50" : "hover:bg-slate-50/50",
                          showErrorVisuals && "border-red-500 outline outline-2 outline-red-500",
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
                              value={commandSearchTerm} // Bind search term to state
                              onValueChange={setCommandSearchTerm} // Update state on change
                              onKeyDown={(e) => {
                                if (e.key === "Tab") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenCombo(false);
                                  if (e.shiftKey) moveNext(row.index, 1);
                                  else
                                    moveNext(
                                      row.index,
                                      row.original.type === 1 ? 3 : 4,
                                    );
                                } else if (e.key === "ArrowLeft") {
                                  e.preventDefault();
                                  setOpenCombo(false);
                                  moveNext(row.index, 1); // 날짜 열로 이동
                                } else if (e.key === "ArrowRight") {
                                  e.preventDefault();
                                  setOpenCombo(false);
                                  moveNext(
                                    row.index,
                                    row.original.type === 1 ? 3 : 4,
                                  );
                                }
                                if (e.key === "Enter" && isAddingNewCategoryMode) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }
                              }}
                            />
                            <div className="flex items-center justify-center border-b border-t p-1">
                              <button
                                type="button"
                                onClick={() => setCategoryFilterType(null)}
                                className={cn(
                                  "flex-1 py-1 text-xs font-bold rounded-l-md",
                                  categoryFilterType === null
                                    ? "bg-slate-200 text-slate-800"
                                    : "text-slate-500 hover:bg-slate-100",
                                )}
                              >
                                {t("all")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setCategoryFilterType(0)}
                                className={cn(
                                  "flex-1 py-1 text-xs font-bold",
                                  categoryFilterType === 0
                                    ? "bg-slate-200 text-slate-800"
                                    : "text-slate-500 hover:bg-slate-100",
                                )}
                              >
                                {t("income")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setCategoryFilterType(1)}
                                className={cn(
                                  "flex-1 py-1 text-xs font-bold rounded-r-md",
                                  categoryFilterType === 1
                                    ? "bg-slate-200 text-slate-800"
                                    : "text-slate-500 hover:bg-slate-100",
                                )}
                              >
                                {t("expense")}
                              </button>
                            </div>
                            <CommandList className="max-h-[350px] overflow-y-auto p-1 scrollbar-hide">
                              <CommandEmpty className="py-6 text-center text-xs text-slate-400">
                                {t("no_results")}
                              </CommandEmpty>
                              <CommandGroup>
                                {categories.map((cat: Category) => {
                                  // Apply type filter only if no search term is active
                                  if (
                                    commandSearchTerm === "" &&
                                    categoryFilterType !== null &&
                                    cat.type !== categoryFilterType
                                  ) {
                                    return null; // Skip rendering if category type doesn't match filter and no search term
                                  }
                                  return (
                                    <CommandItem
                                      key={cat.id}
                                      className={cn(
                                        "flex items-center justify-between px-3 py-1 rounded-xl cursor-pointer group mb-0.5",
                                        value === cat.id &&
                                          "bg-blue-100 dark:bg-blue-900",
                                      )}
                                      onSelect={() => {
                                        updateData(row.index, "category_id", cat.id);
                                        updateData(row.index, "type", cat.type);
                                        setOpenCombo(false);
                                        setTimeout(
                                          () =>
                                            moveNext(
                                              row.index,
                                              cat.type === 1 ? 3 : 4,
                                            ),
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
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
  
                              {isAddingNewCategoryMode && (
                                <div className="relative p-2 mt-1 border border-dashed rounded-xl bg-slate-50 border-slate-300 mx-1">
                                  <div className="flex items-center gap-2">
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
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="w-7 h-7 p-0 text-slate-400 rounded-md"
                                        onClick={resetCategoryForm}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </CommandList>
                            {!isAddingNewCategoryMode &&
                              commandSearchTerm === "" &&
                              categoryFilterType !== null && (
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
                </div>
              </TooltipTrigger>
              {showErrorVisuals && error?.message && (
                <TooltipContent side="bottom" className="bg-red-500 text-white text-xs p-1 px-2 rounded-md">
                  {error.message}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <div
            onMouseDown={(e) => onDragStart(e, row.index, colIdx)}
            className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair hidden group-hover:block z-40"
          />
        </div>
      );
    }
  
    // --- 일반 입력 열 ---
    return (
      <div className="relative w-full h-full flex flex-col justify-center bg-transparent">
        <TooltipProvider delayDuration={0}>
          <Tooltip open={showErrorVisuals}>
            <TooltipTrigger asChild>
              <div className="relative flex items-center h-full">
                <input
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
                    showErrorVisuals && "border-red-500 outline outline-2 outline-red-500",
                  )}
                />
              </div>
            </TooltipTrigger>
            {showErrorVisuals && error?.message && (
              <TooltipContent side="bottom" className="bg-red-500 text-white text-xs p-1 px-2 rounded-md">
                {error.message}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <div
          onMouseDown={(e) => onDragStart(e, row.index, colIdx)}
          className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair hidden group-hover:block z-20"
        />
      </div>
    );
  };
  
  export default EditableCell;
