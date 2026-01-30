import React, { useState } from "react";
import { useForm } from "react-hook-form";
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
import EmojiPicker, { EmojiClickData, EmojiStyle } from "emoji-picker-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Category } from "@/types";
import { cn } from "@/lib/utils";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Tag,
  FileText,
  Check,
  Plus,
  ChevronDown,
  Pin,
  Banknote,
  Scroll,
  Smile,
  Trash2,
  X,
  XCircle,
  SquarePen,
} from "lucide-react";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useAppStore } from "@/store/useAppStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { CategoryIcon } from "@/components/CategoryIcon";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const transactionSchema = z.object({
  type: z.number(),
  is_fixed: z.number(),
  amount: z.number().min(1, { message: "금액은 1원 이상이어야 합니다." }),
  date: z.string().min(1, { message: "날짜를 선택해주세요." }),
  description: z.string().min(1, { message: "내용을 입력해주세요." }),
  remarks: z.string().optional(),
  category_id: z.number().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const TransactionForm: React.FC = () => {
  const { t } = useTranslation();
  const {
    editingTransaction,
    submitForm,
    handleSheetClose,
    openConfirm,
    isConfirmOpen,
  } = useTransactionStore();
  const { categories } = useAppStore();
  const {
    isAddingNewCategoryMode,
    editingCategoryId,
    newCategoryIcon,
    newCategoryName,
    isEmojiPickerOpen,
    setCategoryState,
    resetCategoryForm,
    startEditCategory,
    addCategory,
    updateCategory,
  } = useCategoryStore();
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);

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

  const currentType = form.watch("type");
  const selectedCategory =
    categories.find((c: Category) => c.id === form.watch("category_id")) ||
    null;

  // 카테고리 저장 (추가/수정 통합)
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    const payload = {
      name: newCategoryName,
      icon: newCategoryIcon,
      type: currentType,
    };

    if (editingCategoryId) {
      await updateCategory(editingCategoryId, payload);
    } else {
      await addCategory(payload);
    }
  };

  const onInvalid = (errors: any) => {
    // 첫 번째 에러 메시지만 토스트로 노출
    const firstError = Object.values(errors)[0] as any;
    if (firstError) {
      toast.error(firstError.message, {
        description: "입력 내용을 다시 확인해주세요.",
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitForm, onInvalid)}
        className="flex flex-col h-[700px] px-2 pt-2 pb-2"
      >
        <div className="flex-1 space-y-7 scrollbar-hide pr-1">
          {/* 1. 타입 선택 (수입/지출) 및 고정 핀 */}
          <div className="flex items-center gap-0 overflow-hidden">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="flex-1 transition-all duration-500">
                  <div className="p-1.5 bg-slate-100/60 rounded-2xl flex gap-1">
                    {[
                      {
                        id: 0,
                        name: "수입",
                        icon: ArrowUpCircle,
                        color: "text-emerald-500",
                      },
                      {
                        id: 1,
                        name: "지출",
                        icon: ArrowDownCircle,
                        color: "text-rose-500",
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
                          "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl transition-all font-bold text-sm",
                          field.value === item.id
                            ? "bg-white shadow-sm"
                            : "text-slate-400"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-4 h-4",
                            field.value === item.id
                              ? item.color
                              : "text-slate-300"
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
                currentType === 1
                  ? "w-[60px] opacity-100 ml-3"
                  : "w-0 opacity-0 ml-0"
              )}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() =>
                      form.setValue(
                        "is_fixed",
                        form.watch("is_fixed") === 1 ? 0 : 1
                      )
                    }
                    className={cn(
                      "w-12 h-12 flex items-center justify-center rounded-2xl transition-all border shrink-0 active:scale-95",
                      form.watch("is_fixed") === 1
                        ? "bg-black border-black text-white shadow-md shadow-slate-200"
                        : "bg-slate-50 border-slate-100 text-slate-300"
                    )}
                  >
                    <Pin
                      className={cn(
                        "w-4 h-4 transition-transform",
                        form.watch("is_fixed") === 1 && "fill-white rotate-45"
                      )}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-slate-800 text-white border-none text-[10px] font-bold"
                >
                  고정 지출 설정
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* 2. 카테고리 선택 (수정/삭제 기능 포함) */}
          <div className="space-y-1.5">
            <FormLabel className="flex items-center gap-2 text-[10px] font-bold text-slate-400 ml-1 tracking-wider uppercase">
              <Tag className="w-3 h-3" /> {t("category")}
            </FormLabel>
            <Popover
              open={isCategoryPopoverOpen}
              onOpenChange={(open) => {
                if (isConfirmOpen) return;
                setIsCategoryPopoverOpen(open);
                if (!open) resetCategoryForm();
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-full h-12 px-4 flex items-center justify-between rounded-2xl bg-slate-50 transition-all",
                    isCategoryPopoverOpen && "ring-1 ring-slate-200 shadow-sm"
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
                      <span className="text-slate-400 text-sm font-bold">
                        카테고리 선택
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

              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
                <Command className="bg-white overflow-hidden">
                  {isEmojiPickerOpen ? (
                    <div className="flex flex-col animate-in fade-in zoom-in duration-200">
                      <div className="flex items-center justify-between p-2 border-b">
                        <span className="text-[10px] font-bold text-slate-400 ml-2">
                          아이콘 선택
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
                          onEmojiClick={(data) => {
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
                        placeholder="카테고리 검색..."
                        className="h-11"
                      />
                      <CommandList className="max-h-[350px] overflow-y-auto p-1 scrollbar-hide">
                        <CommandEmpty className="py-6 text-center text-xs text-slate-400">
                          결과가 없습니다.
                        </CommandEmpty>
                        <CommandGroup>
                          {categories
                            .filter((cat) => cat.type === currentType)
                            .map((cat) => (
                              <CommandItem
                                key={cat.id}
                                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer group mb-0.5"
                                onSelect={() => {
                                  form.setValue("category_id", cat.id);
                                  setIsCategoryPopoverOpen(false);
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <CategoryIcon
                                    icon={cat.icon}
                                    type={currentType}
                                    size="sm"
                                  />
                                  <span className="font-semibold text-slate-600 text-xs">
                                    {cat.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      openConfirm("category", cat.id);
                                    }}
                                    className="p-1.5 hover:bg-slate-200 rounded-md text-slate-400 hover:text-rose-500"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  {form.watch("category_id") === cat.id && (
                                    <Check className="w-3.5 h-3.5 text-black ml-1" />
                                  )}
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
                                setCategoryState(
                                  "newCategoryName",
                                  e.target.value
                                )
                              }
                              placeholder={
                                editingCategoryId
                                  ? "이름 수정..."
                                  : "새 이름..."
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
                          <Plus className="w-3.5 h-3.5" /> 새 카테고리 추가
                        </button>
                      )}
                    </>
                  )}
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* 3. 날짜 및 금액 */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-[10px] font-bold text-slate-400 ml-1 tracking-wider uppercase">
                    <Calendar className="w-3 h-3" /> {t("date")}
                  </FormLabel>
                  <Input
                    type="date"
                    className="h-12 bg-slate-50/80 border-none rounded-2xl text-xs font-bold"
                    {...field}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-[10px] font-bold text-slate-400 ml-1 tracking-wider uppercase">
                    <Banknote className="w-3 h-3" /> {t("amount")}
                  </FormLabel>
                  <Input
                    type="number"
                    className={cn(
                      "h-12 bg-slate-50/80 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300",
                      fieldState.error && "ring-2 ring-rose-500"
                    )}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormItem>
              )}
            />
          </div>

          {/* 4. 내용 및 메모 */}
          <FormField
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-[10px] font-bold text-slate-400 ml-1 tracking-wider uppercase">
                  <FileText className="w-3 h-3" /> {t("description")}
                </FormLabel>
                <Input
                  className={cn(
                    "h-12 bg-slate-50/80 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300",
                    fieldState.error && "ring-2 ring-rose-500"
                  )}
                  placeholder="내용 입력"
                  {...field}
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-[10px] font-bold text-slate-400 ml-1 tracking-wider uppercase">
                  <Scroll className="w-3 h-3" /> {t("remarks")}
                </FormLabel>
                <Textarea
                  className="resize-none rounded-3xl border-none bg-slate-50/80 p-5 text-sm font-medium placeholder:text-slate-300 min-h-[100px]"
                  placeholder="메모를 입력하세요"
                  {...field}
                />
              </FormItem>
            )}
          />
        </div>

        {/* 5. 하단 버튼 영역 */}
        <div className="shrink-0 pt-6 bg-white flex gap-3 mt-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSheetClose}
            className="flex-1 h-14 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-colors"
          >
            취소
          </Button>
          {editingTransaction && (
            <Button
              variant="outline"
              className="flex-1 h-14 rounded-2xl border-slate-100 text-rose-500 hover:bg-rose-50"
              onClick={() =>
                editingTransaction?.id &&
                openConfirm("transaction", editingTransaction.id)
              }
            >
              {t("delete")}
            </Button>
          )}
          <Button
            type="submit"
            className="flex-[2] h-14 bg-black hover:bg-slate-800 text-white rounded-2xl font-black text-base transition-all shadow-xl shadow-slate-100 active:scale-[0.98]"
          >
            저장
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TransactionForm;
