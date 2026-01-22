import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Category, TransactionFormValues } from "@/types";
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
} from "lucide-react";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useAppStore } from "@/store/useAppStore";

const TransactionForm: React.FC = () => {
  const { t } = useTranslation();
  const {
    editingTransaction,
    submitForm,
    handleSheetClose,
    addCategory,
    deleteTransaction,
    openDeleteConfirm,
  } = useTransactionStore();
  const { categories } = useAppStore();
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const [isAddingNewCategoryMode, setIsAddingNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState<string>("😀"); // Changed type to string and default emoji
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const form = useForm<TransactionFormValues>({
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

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitForm)}
        className="flex flex-col h-[700px] px-2 pt-2 pb-2" // top-12에 맞춰 pt-12 적용
      >
        {/* 상단 입력 영역: 가변 높이 및 스크롤 */}
        <div className="flex-1 space-y-7 scrollbar-hide pr-1">
          {/* 1. 상단 탭 + 핀 버튼 애니메이션 */}
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

            {/* 고정 지출 미니 핀 버튼 */}
            <div
              className={cn(
                "transition-all duration-500 ease-in-out flex items-center overflow-hidden",
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

          {/* Category Selection (Full Width) */}
          <div className="space-y-1.5">
            <FormLabel className="flex items-center gap-2 text-[10px] font-bold text-slate-400 ml-1 tracking-wider uppercase">
              <Tag className="w-3 h-3" /> {t("category")}
            </FormLabel>
            <Popover
              open={isCategoryPopoverOpen}
              onOpenChange={setIsCategoryPopoverOpen}
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
                        <span className="text-base">
                          {selectedCategory.icon}
                        </span>{" "}
                        <span className="font-bold text-sm">
                          {selectedCategory.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 text-sm font-bold">
                        선택하세요
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
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                {isAddingNewCategoryMode ? (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsEmojiPickerOpen(true)}
                        >
                          <span className="text-xl">{newCategoryIcon}</span>
                        </Button>
                        {isEmojiPickerOpen && (
                          <div className="absolute z-50 top-full left-0 mt-2 w-72 h-80">
                            <EmojiPicker
                              onEmojiClick={(emojiData: EmojiClickData) => {
                                setNewCategoryIcon(emojiData.emoji);
                                setIsEmojiPickerOpen(false);
                              }}
                              height="100%"
                              width="100%"
                              searchDisabled
                              skinTonesDisabled
                            />
                          </div>
                        )}
                      </div>
                      <Input
                        placeholder="새 카테고리 이름"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsAddingNewCategoryMode(false);
                          setNewCategoryName("");
                          setNewCategoryIcon("😀");
                        }}
                      >
                        {t("cancel")}
                      </Button>
                      <Button
                        onClick={() => {
                          if (newCategoryName.trim() && newCategoryIcon) {
                            addCategory?.({
                              name: newCategoryName,
                              icon: newCategoryIcon,
                            });
                            setIsAddingNewCategoryMode(false);
                            setIsCategoryPopoverOpen(false);
                            setNewCategoryName("");
                            setNewCategoryIcon("😀");
                          }
                        }}
                        disabled={!newCategoryName.trim() || !newCategoryIcon}
                      >
                        {t("save")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Command className="bg-transparent">
                    <CommandList>
                      <CommandGroup>
                        {categories.map((cat: Category) => (
                          <div
                            key={cat.id}
                            onClick={() => {
                              form.setValue("category_id", cat.id);
                              setIsCategoryPopoverOpen(false);
                            }}
                            className="flex items-center justify-between px-3 py-2.5 hover:bg-white rounded-xl cursor-pointer text-xs mb-0.5 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-base">{cat.icon}</span>
                              <span className="font-semibold text-slate-600">
                                {cat.name}
                              </span>
                            </div>
                            {form.watch("category_id") === cat.id && (
                              <Check className="w-3.5 h-3.5 text-black" />
                            )}
                          </div>
                        ))}
                      </CommandGroup>
                    </CommandList>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAddingNewCategoryMode(true);
                      }}
                      className="w-full py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-black text-emerald-500 border-t border-slate-100/50 mt-1 uppercase"
                    >
                      <Plus className="w-3 h-3" /> 새 카테고리 추가
                    </button>
                  </Command>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Date and Amount in one row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date Field */}
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

            {/* Amount Field */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-[10px] font-bold text-slate-400 ml-1 tracking-wider uppercase">
                    <Banknote className="w-3 h-3" /> {t("amount")}
                  </FormLabel>
                  <Input
                    type="number"
                    className="h-12 bg-slate-50/80 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormItem>
              )}
            />
          </div>

          {/* Description Field */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-[10px] font-bold text-slate-400 ml-1 tracking-wider uppercase">
                  <FileText className="w-3 h-3" /> {t("description")}
                </FormLabel>
                <Input
                  className="h-12 bg-slate-50/80 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300"
                  placeholder="내용 입력"
                  {...field}
                />
              </FormItem>
            )}
          />

          {/* Remarks Field */}
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

        {/* 4. 하단 고정 버튼 영역 */}
        <div className="shrink-0 pt-6 bg-white flex gap-3 mt-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSheetClose}
            className="flex-1 h-14 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-colors"
          >
            취소
          </Button>
          <Button
            type="submit"
            className="flex-[2] h-14 bg-black hover:bg-slate-800 text-white rounded-2xl font-black text-base transition-all shadow-xl shadow-slate-100 active:scale-[0.98]"
          >
            저장
          </Button>
          {editingTransaction && (
            <Button
              variant="outline"
              onClick={() => {
                if (!editingTransaction?.id) return;
                openDeleteConfirm(editingTransaction.id);
              }}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};

export default TransactionForm;
