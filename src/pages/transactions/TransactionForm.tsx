import React, { useEffect, useState } from "react";
import { useForm, UseFormReturn, FieldError } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import ko from "emoji-picker-react/dist/data/emojis-ko";
import { ko as Korean, enUS } from "date-fns/locale";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Category } from "@/types";
import { cn, smartParseDate, evaluateExpression } from "@/lib/utils";
import {
  Calendar,
  Tag,
  FileText,
  Check,
  Plus,
  ChevronDown,
  Pin,
  Banknote,
  Scroll,
  Trash2,
  X,
  CirclePlus,
  CircleMinus,
  Pencil,
} from "lucide-react";
import { useTransactionStore } from "@/stores/useTransactionStore";
import { useAppStore } from "@/stores/useAppStore";
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useSettingStore } from "@/stores/useSettingStore";
import { CategoryIcon } from "@/components/CategoryIcon";
import { zodResolver } from "@hookform/resolvers/zod";
import { useConfirmStore } from "@/stores/useConfirmStore";
import {
  transactionSchema,
  TransactionFormValues,
} from "@/schemas/transaction";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";

// 1.5초 동안만 에러를 보여주는 툴팁 내부 로직
const TemporaryErrorTooltip = ({
  children,
  error,
  show,
  side = "top",
}: {
  children: React.ReactNode;
  error?: FieldError;
  show: boolean;
  side?: "top" | "bottom" | "left" | "right";
}) => {
  return (
    <Tooltip open={show && !!error}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        className="bg-rose-500 text-white border-none text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl mb-1 animate-in fade-in zoom-in duration-200"
      >
        {error?.message}
      </TooltipContent>
    </Tooltip>
  );
};

const TransactionForm: React.FC = () => {
  const { t } = useTranslation();
  const { confirm } = useConfirmStore();
  const {
    editingTransaction,
    submitForm,
    handleSheetClose,
    deleteTransaction,
    defaultCategoryId,
  } = useTransactionStore();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: editingTransaction?.type ?? 1,
      is_fixed: editingTransaction?.is_fixed ?? 0,
      amount: editingTransaction?.amount || 0,
      date: editingTransaction?.date || new Date().toISOString().split("T")[0],
      description: editingTransaction?.description || "",
      remarks: editingTransaction?.remarks || "",
      category_id: editingTransaction?.category_id,
    },
  });

  useEffect(() => {
    if (!editingTransaction && defaultCategoryId) {
      form.setValue("category_id", defaultCategoryId, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [defaultCategoryId, editingTransaction, form]);

  const handleDelete = () => {
    confirm({
      title: t("transaction_form.delete_title"),
      description: t("transaction_form.delete_description"),
      onConfirm: async () => {
        if (editingTransaction?.id) {
          deleteTransaction(editingTransaction.id);
          handleSheetClose();
        }
      },
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitForm)}
        className="flex flex-col h-[calc(100vh-120px)] max-h-[700px] pt-2 pb-2"
      >
        <div className="flex-1 overflow-y-auto space-y-2.5 scrollbar-hide pb-2">
          <TransactionTypeSection form={form} />
          <CategorySection form={form} />
          <DescriptionSection form={form} />
          <DateAmountSection form={form} />
          <RemarksSection form={form} />
        </div>

        <ActionButtons
          onCancel={handleSheetClose}
          onDelete={editingTransaction ? handleDelete : undefined}
        />
      </form>
    </Form>
  );
};

/**
 * 1. 타입 선택 (수입/지출) 및 고정 핀
 */
const TransactionTypeSection: React.FC<{
  form: UseFormReturn<TransactionFormValues>;
}> = ({ form }) => {
  const { t } = useTranslation();
  const currentType = form.watch("type");
  const isFixed = form.watch("is_fixed");

  return (
    <div className="flex items-center overflow-hidden">
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem className="flex-1 transition-all duration-500">
            <div className="p-1 bg-slate-100/60 rounded-2xl flex gap-1">
              {[
                {
                  id: 0,
                  name: t("common.income"),
                  icon: CirclePlus,
                  color: "text-emerald-500",
                },
                {
                  id: 1,
                  name: t("common.expense"),
                  icon: CircleMinus,
                  color: "text-blue-500",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    field.onChange(item.id);
                    form.setValue("category_id", undefined);
                    if (item.id === 0) form.setValue("is_fixed", 0);
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 h-8 rounded-xl transition-all font-bold text-sm",
                    field.value === item.id
                      ? "bg-white shadow-sm"
                      : "text-slate-400"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-4 h-4",
                      field.value === item.id ? item.color : "text-slate-300"
                    )}
                  />
                  {item.name}
                </button>
              ))}
            </div>
          </FormItem>
        )}
      />
      <div
        className={cn(
          "transition-all duration-500 flex items-center overflow-hidden",
          currentType === 1 ? "w-[60px] opacity-100 ml-3" : "w-0 opacity-0 ml-0"
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => form.setValue("is_fixed", isFixed === 1 ? 0 : 1)}
              className={cn(
                "w-12 h-12 flex items-center justify-center rounded-2xl transition-all border shrink-0 active:scale-95",
                isFixed === 1
                  ? "bg-black border-black text-white shadow-md shadow-slate-200"
                  : "bg-slate-50 border-slate-100 text-slate-300"
              )}
            >
              <Pin
                className={cn(
                  "w-4 h-4 transition-transform",
                  isFixed === 1 && "fill-white rotate-45"
                )}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-slate-800 text-white border-none text-xs font-bold"
          >
            {t("transaction_form.fixed_expense_setting")}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

/**
 * 2. 카테고리 선택 (항목)
 */
const CategorySection: React.FC<{
  form: UseFormReturn<TransactionFormValues>;
}> = ({ form }) => {
  const { t, i18n } = useTranslation();
  const { confirm, isOpen } = useConfirmStore();
  const { categoryList: categories } = useAppStore();
  const {
    isAddingNewCategoryMode,
    editingCategoryId,
    newCategoryIcon,
    newCategoryName,
    isEmojiPickerOpen,
    setCategoryState,
    resetCategoryForm,
    startEditCategory,
    deleteCategory,
    submitCategoryForm,
  } = useCategoryStore();

  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const [showVisualError, setShowVisualError] = useState(false);

  const currentType = form.watch("type");
  const selectedCategoryId = form.watch("category_id");
  const selectedCategory =
    categories.find((c: Category) => c.id === selectedCategoryId) || null;

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    await submitCategoryForm({
      name: newCategoryName,
      icon: newCategoryIcon,
      type: String(currentType),
    });
  };

  const onClickDeleteCategory = (e: React.MouseEvent, cat: Category) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    confirm({
      title: t("settings.category.delete"),
      description: t("settings.category.delete_confirm", { name: cat.name }),
      onConfirm: async () => {
        await deleteCategory(cat.id);
        if (form.getValues("category_id") === cat.id) {
          form.setValue("category_id", undefined);
        }
      },
    });
  };

  const { error } = form.getFieldState("category_id", form.formState);

  useEffect(() => {
    if (error) {
      setShowVisualError(true);
      const timer = setTimeout(() => setShowVisualError(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="space-y-1">
      <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-400 ml-2 tracking-wider uppercase">
        {t("common.category")}
      </FormLabel>
      <Popover
        open={isCategoryPopoverOpen}
        onOpenChange={(open) => {
          if (isOpen) return;
          setIsCategoryPopoverOpen(open);
          if (!open) resetCategoryForm();
        }}
        modal={false}
      >
        <TemporaryErrorTooltip error={error} show={showVisualError}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "ml-1 w-[97%] h-12 px-4 flex items-center justify-between rounded-xl bg-slate-50 transition-all",
                isCategoryPopoverOpen && "ring-1 ring-slate-200 shadow-sm",
                showVisualError && error && "ring-2 ring-rose-500/50 bg-rose-50"
              )}
            >
              <div className="flex items-center gap-2">
                {selectedCategory ? (
                  <>
                    <CategoryIcon
                      icon={selectedCategory.icon}
                      type={currentType}
                      size="md"
                    />
                    <span className="font-bold text-md">
                      {selectedCategory.name}
                    </span>
                  </>
                ) : (
                  <span
                    className={cn(
                      "text-sm font-bold",
                      showVisualError && error
                        ? "text-rose-400"
                        : "text-slate-400"
                    )}
                  >
                    {t("transaction.select_category")}
                  </span>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-slate-300 transition-transform",
                  isCategoryPopoverOpen && "rotate-180"
                )}
              />
            </button>
          </PopoverTrigger>
        </TemporaryErrorTooltip>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onWheel={(e) => e.stopPropagation()}
        >
          <Command className="bg-white overflow-hidden">
            {isEmojiPickerOpen ? (
              <div className="flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-2 border-b">
                  <span className="text-[10px] font-bold text-slate-400 ml-2">
                    {t("settings.category.select_icon")}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setCategoryState("isEmojiPickerOpen", false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="w-full h-[300px]">
                  <EmojiPicker
                    onEmojiClick={(data) => {
                      setCategoryState("newCategoryIcon", data.emoji);
                      setCategoryState("isEmojiPickerOpen", false);
                    }}
                    height="100%"
                    width="100%"
                    emojiData={i18n.language.startsWith("ko") ? ko : undefined}
                    emojiStyle={EmojiStyle.NATIVE}
                    previewConfig={{ showPreview: false }}
                    skinTonesDisabled
                  />
                </div>
              </div>
            ) : (
              <>
                <CommandInput
                  placeholder={t("transaction_form.search_category")}
                  className="h-11"
                />
                <CommandList className="max-h-[350px] overflow-y-auto p-1 scrollbar-hide">
                  <CommandEmpty className="py-6 text-center text-xs text-slate-400">
                    {t("transaction_form.no_results")}
                  </CommandEmpty>
                  <CommandGroup>
                    {categories
                      .filter((cat) => cat.type === currentType)
                      .map((cat) => (
                        <CommandItem
                          key={cat.id}
                          className={cn(
                            "relative flex items-center px-3 py-2.5 rounded-xl cursor-pointer group mb-0.5 transition-colors",
                            selectedCategoryId === cat.id
                              ? "bg-slate-200 text-slate-900 data-[selected='true']:bg-slate-300"
                              : "text-slate-600"
                          )}
                          onSelect={() => {
                            form.setValue("category_id", cat.id);
                            setIsCategoryPopoverOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-3 truncate mr-12">
                            <CategoryIcon
                              icon={cat.icon}
                              type={currentType}
                              size="sm"
                            />
                            <span
                              className={cn(
                                "font-bold text-xs truncate",
                                selectedCategoryId === cat.id
                                  ? "text-slate-900"
                                  : "text-slate-600"
                              )}
                            >
                              {cat.name}
                            </span>
                          </div>
                          <div
                            className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-inherit pr-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                startEditCategory(cat);
                              }}
                              className={cn(
                                "p-1.5 rounded-md transition-colors",
                                selectedCategoryId === cat.id
                                  ? "hover:bg-slate-300 text-slate-500 hover:text-blue-600"
                                  : "hover:bg-slate-200 text-slate-400 hover:text-blue-500"
                              )}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                onClickDeleteCategory(e, cat);
                              }}
                              className={cn(
                                "p-1.5 rounded-md transition-colors",
                                selectedCategoryId === cat.id
                                  ? "hover:bg-slate-300 text-slate-500 hover:text-rose-600"
                                  : "hover:bg-slate-200 text-slate-400 hover:text-rose-500"
                              )}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>

                  {isAddingNewCategoryMode && (
                    <div className="flex items-center gap-2 px-2 py-2 bg-slate-50 rounded-xl mt-1 border border-dashed border-slate-300 mx-1">
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
                          setCategoryState("newCategoryName", e.target.value)
                        }
                        placeholder={
                          editingCategoryId
                            ? t("transaction_form.edit_name")
                            : t("transaction_form.new_name")
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
                          className="w-7 h-7 text-slate-400"
                          onClick={resetCategoryForm}
                        >
                          <X className="w-4 h-4" />
                        </Button>
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
                    <Plus className="w-3.5 h-3.5" />{" "}
                    {t("transaction_form.add_new_category")}
                  </button>
                )}
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

/**
 * 3. 내역 (Description)
 */
const DescriptionSection: React.FC<{
  form: UseFormReturn<TransactionFormValues>;
}> = ({ form }) => {
  const { t } = useTranslation();
  const [showError, setShowError] = useState(false);

  return (
    <FormField
      control={form.control}
      name="description"
      render={({ field, fieldState }) => {
        useEffect(() => {
          if (fieldState.error) {
            setShowError(true);
            const timer = setTimeout(() => setShowError(false), 1500);
            return () => clearTimeout(timer);
          }
        }, [fieldState.error]);

        return (
          <FormItem>
            <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-400 ml-2 tracking-wider uppercase">
              {t("common.description")}
            </FormLabel>
            <TemporaryErrorTooltip error={fieldState.error} show={showError}>
              <Input
                className={cn(
                  "ml-1 w-[97%] h-10 bg-slate-50/80 border-none rounded-xl text-sm font-bold placeholder:text-slate-300",
                  showError &&
                    fieldState.error &&
                    "ring-2 ring-rose-500/50 bg-rose-50"
                )}
                placeholder={t("transaction_form.description_placeholder")}
                {...field}
              />
            </TemporaryErrorTooltip>
          </FormItem>
        );
      }}
    />
  );
};

/**
 * 4. 금액 및 날짜
 */
const DateAmountSection: React.FC<{
  form: UseFormReturn<TransactionFormValues>;
}> = ({ form }) => {
  const { t, i18n } = useTranslation();
  const { dateFormat } = useSettingStore();
  const [preview, setPreview] = useState<string>("0");
  const [showAmountError, setShowAmountError] = useState(false);
  const [showDateError, setShowDateError] = useState(false);
  const [isDateFocused, setIsDateFocused] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* 금액 (Amount) */}
      <FormField
        control={form.control}
        name="amount"
        render={({ field, fieldState }) => {
          useEffect(() => {
            if (fieldState.error) {
              setShowAmountError(true);
              const timer = setTimeout(() => setShowAmountError(false), 1500);
              return () => clearTimeout(timer);
            }
          }, [fieldState.error]);

          const showMathPreview =
            !!field.value && field.value.toString().match(/[+\-*/]/) !== null;

          return (
            <FormItem className="flex flex-col">
              <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-400 ml-2 tracking-wider uppercase">
                {t("common.amount")}
              </FormLabel>

              <Tooltip
                open={
                  showMathPreview || (showAmountError && !!fieldState.error)
                }
              >
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Input
                      {...field}
                      type="text"
                      placeholder="0"
                      className={cn(
                        "ml-1 w-[97%] h-10 bg-slate-50/80 border-none rounded-xl text-sm font-bold placeholder:text-slate-300 transition-all",
                        showAmountError && fieldState.error
                          ? "ring-2 ring-rose-500/50 bg-rose-50"
                          : "focus-visible:ring-2 focus-visible:ring-blue-500/20"
                      )}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (
                          val.length > 1 &&
                          val.startsWith("0") &&
                          !val.startsWith("0.")
                        ) {
                          val = val.substring(1);
                        }
                        field.onChange(val);
                        const result = evaluateExpression(val);
                        if (result !== null) {
                          setPreview(
                            new Intl.NumberFormat().format(Number(result))
                          );
                        }
                      }}
                      onBlur={() => {
                        const result = evaluateExpression(
                          field.value?.toString() || ""
                        );
                        if (result !== null) {
                          const formatted = new Intl.NumberFormat().format(
                            Number(result)
                          );
                          field.onChange(formatted);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className={cn(
                    "border-none text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl mb-1",
                    showAmountError && fieldState.error
                      ? "bg-rose-500 text-white"
                      : "bg-blue-600 text-white"
                  )}
                >
                  {showAmountError && fieldState.error
                    ? fieldState.error.message
                    : t("transaction_form.calculation_result", {
                        amount: preview,
                      })}
                </TooltipContent>
              </Tooltip>
            </FormItem>
          );
        }}
      />

      {/* 날짜 (Date) */}
      <FormField
        control={form.control}
        name="date"
        render={({ field, fieldState }) => {
          useEffect(() => {
            if (fieldState.error) {
              setShowDateError(true);
              const timer = setTimeout(() => setShowDateError(false), 1500);
              return () => clearTimeout(timer);
            }
          }, [fieldState.error]);

          return (
            <FormItem className="flex flex-col">
              <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-400 ml-2 tracking-wider uppercase">
                {t("common.date")}
              </FormLabel>

              <TemporaryErrorTooltip
                error={fieldState.error}
                show={showDateError}
              >
                <div className="relative group">
                  <Input
                    {...field}
                    value={
                      !isDateFocused && field.value
                        ? (() => {
                            try {
                              const d = parseISO(field.value);
                              if (!isNaN(d.getTime())) {
                                return format(d, dateFormat, {
                                  locale:
                                    i18n.language === "ko" ? Korean : enUS,
                                });
                              }
                            } catch {}
                            return field.value;
                          })()
                        : field.value
                    }
                    placeholder={t("transaction_form.date_placeholder")}
                    className={cn(
                      "ml-1 w-[97%] h-10 bg-slate-50/80 border-none rounded-xl text-xs font-bold pr-10 transition-all",
                      showDateError && fieldState.error
                        ? "ring-2 ring-rose-500/50 bg-rose-50"
                        : "focus-visible:ring-2 focus-visible:ring-blue-500/20"
                    )}
                    onFocus={() => setIsDateFocused(true)}
                    onBlur={(e) => {
                      setIsDateFocused(false);
                      const parsed = smartParseDate(e.target.value);
                      field.onChange(parsed);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const parsed = smartParseDate(
                          (e.target as HTMLInputElement).value
                        );
                        field.onChange(parsed);
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                  />

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 text-slate-400 hover:bg-transparent hover:text-blue-500 transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="end">
                      <CalendarPicker
                        mode="single"
                        locale={i18n.language === "ko" ? Korean : undefined}
                        selected={
                          field.value ? parseISO(field.value) : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(format(date, "yyyy-MM-dd"));
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </TemporaryErrorTooltip>
            </FormItem>
          );
        }}
      />
    </div>
  );
};

/**
 * 5. 메모 (Remarks)
 */
const RemarksSection: React.FC<{
  form: UseFormReturn<TransactionFormValues>;
}> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <FormField
      control={form.control}
      name="remarks"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-400 ml-2 tracking-wider uppercase">
            {t("common.remarks")}
          </FormLabel>
          <Textarea
            className="ml-1 w-[97%] resize-none rounded-xl border-none bg-slate-50/80 p-4 text-sm font-medium placeholder:text-slate-300 min-h-[50px]"
            placeholder={t("transaction_form.remarks_placeholder")}
            {...field}
          />
        </FormItem>
      )}
    />
  );
};

/**
 * 하단 버튼 영역
 */
const ActionButtons: React.FC<{
  onCancel: () => void;
  onDelete?: () => void;
}> = ({ onCancel, onDelete }) => {
  const { t } = useTranslation();

  return (
    <div className="shrink-0 pt-2 bg-white flex gap-3 mt-auto">
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        className="flex-1 h-10 text-slate-400 font-bold hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
      >
        {t("common.cancel")}
      </Button>
      {onDelete && (
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-10 rounded-xl border-slate-100 text-rose-500 hover:bg-rose-50 cursor-pointer"
          onClick={onDelete}
        >
          {t("common.delete")}
        </Button>
      )}
      <Button
        type="submit"
        className="cursor-pointer flex-[2] h-10 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-black text-base transition-all shadow-xl shadow-slate-100 active:scale-[0.98]"
      >
        {t("common.save")}
      </Button>
    </div>
  );
};

export default TransactionForm;
