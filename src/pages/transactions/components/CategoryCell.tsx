import React, { useState, useEffect, useRef } from "react";
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
import { cn } from "@/lib/utils";
import { ExpenseBadge, IncomeBadge } from "../TransactionBadge";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import EmojiPicker, { EmojiClickData, EmojiStyle } from "emoji-picker-react";
import { Check, Plus, X, SquarePen, Trash2 } from "lucide-react";
import { Category, CellProps } from "@/types";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useAppStore } from "@/store/useAppStore";
import { useCategoryStore } from "@/store/useCategoryStore"; // Added useCategoryStore
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTableNavigation } from "@/pages/transactions/hooks/useTableNavigation";
import { useConfirmStore } from "@/store/useConfirmStore";

const CategoryCell = ({
  getValue,
  row,
  column,
  table,
  colIdx,
  onPaste,
  error,
}: CellProps): React.ReactNode => {
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
    deleteCategory,
    submitCategoryForm,
  } = useCategoryStore();
  const { confirm } = useConfirmStore();

  const value = getValue();
  const { updateData, setActiveCell, activeCell, categories, onDragStart } =
    table.options.meta as any;
  const { handleTableKeyDown, moveNext } = useTableNavigation(
    table,
    setActiveCell,
  );
  const [openCombo, setOpenCombo] = useState(false);
  const [categoryFilterType, setCategoryFilterType] = useState<number | null>(
    null,
  ); // null: all, 0: income, 1: expense
  const [commandSearchTerm, setCommandSearchTerm] = useState("");
  const comboTriggerRef = useRef<HTMLButtonElement>(null);
  const [showErrorVisuals, setShowErrorVisuals] = useState(false);

  useEffect(() => {
    if (error && error.message && error.timestamp) {
      setShowErrorVisuals(true);
      const timer = setTimeout(() => {
        setShowErrorVisuals(false);
      }, 2000); // 2 second
      return () => clearTimeout(timer);
    } else {
      setShowErrorVisuals(false);
    }
  }, [error]);

  const isActive =
    activeCell?.rowIndex === row.index && activeCell?.colIdx === colIdx;

  useEffect(() => {
    if (isActive) {
      setOpenCombo(true);
      setCategoryFilterType(row.original.type ?? null);
    } else {
      setOpenCombo(false);
      // Reset category creation states when combo closes
      setCategoryState("isAddingNewCategoryMode", false);
      setCategoryState("isEmojiPickerOpen", false);
      setCategoryState("newCategoryName", "");
      setCategoryState("newCategoryIcon", "➕");
      setCategoryState("editingCategoryId", null);
      setCategoryFilterType(null);
      setCommandSearchTerm("");
    }
  }, [isActive, row.original.type, setCategoryState]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    handleTableKeyDown(
      e,
      row.index,
      colIdx,
      column.id,
      row.original.type ?? 1,
      () => setOpenCombo(false),
      openCombo,
    );
  };

  const currentType = row.original.type ?? 1; // Default to expense if type is undefined

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error(t("category_name_empty"));
      return;
    }

    const typeToSave = editingCategoryId
      ? categories.find((c) => c.id === editingCategoryId)?.type
      : categoryFilterType !== null
        ? categoryFilterType
        : currentType;

    try {
      await submitCategoryForm({
        name: newCategoryName,
        icon: newCategoryIcon,
        type: String(typeToSave),
      });
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

          // 만약 현재 셀에 선택된 값이 삭제된 것이라면 비워주기
          if (value === cat.id) {
            updateData(row.index, "category_id", null);
          }

          toast.success(t("category_deleted") || "삭제되었습니다.");
        } catch (err) {
          toast.error("삭제에 실패했습니다.");
        }
      },
    });
  };

  const selected = categories.find((c: any) => c.id === value);

  return (
    <div
      className="relative w-full h-full flex flex-col justify-center bg-transparent"
      onPaste={(e) => onPaste(e, row.index, colIdx)}
    >
      <Tooltip open={showErrorVisuals}>
        <TooltipTrigger asChild>
          <div className="relative flex items-center h-full">
            <Popover open={openCombo} onOpenChange={setOpenCombo}>
              <PopoverTrigger asChild>
                <button
                  ref={comboTriggerRef}
                  onKeyDown={onKeyDown}
                  onClick={() => setOpenCombo(true)}
                  className={cn(
                    "flex h-full w-full items-center px-2 text-sm outline-none transition-colors",
                    "bg-transparent border-none rounded-none",
                    isActive ? "bg-blue-50/50" : "hover:bg-slate-50/50",
                    showErrorVisuals &&
                      "border-red-500 outline-2 outline-red-500",
                  )}
                >
                  {selected ? (
                    <div className="flex items-center gap-1 truncate text-sm">
                      {selected.type === 0 ? <IncomeBadge /> : <ExpenseBadge />}
                      <span>
                        {selected.icon} {selected.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm">
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
                        onKeyDown={onKeyDown}
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
                            if (
                              commandSearchTerm === "" &&
                              categoryFilterType !== null &&
                              cat.type !== categoryFilterType
                            ) {
                              return null;
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
                                    onClick={(e) =>
                                      onClickDeleteCategory(e, cat)
                                    }
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
                                  editingCategoryId
                                    ? t("edit_name")
                                    : t("new_name")
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
                            <Plus className="w-3.5 h-3.5" />{" "}
                            {t("add_new_category")}
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
          <TooltipContent
            side="bottom"
            className="bg-red-500 text-white text-xs p-1 px-2 rounded-md"
          >
            {error.message}
          </TooltipContent>
        )}
      </Tooltip>
      <div
        onMouseDown={(e) => onDragStart(e, row.index, colIdx)}
        className="absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-crosshair hidden group-hover:block z-40"
      />
    </div>
  );
};

export default CategoryCell;
