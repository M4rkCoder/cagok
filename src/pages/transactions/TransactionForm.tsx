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
} from "lucide-react";

const TransactionForm: React.FC<any> = ({
  onSubmit,
  onCancel,
  onAddNewCategory,
  categories,
  defaultValues,
}) => {
  const { t } = useTranslation();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const form = useForm<TransactionFormValues>({
    defaultValues: {
      type: defaultValues?.type ?? 1,
      is_fixed: defaultValues?.is_fixed ?? 0,
      amount: defaultValues?.amount || 0,
      date: defaultValues?.date || new Date().toISOString().split("T")[0],
      description: defaultValues?.description || "",
      remarks: defaultValues?.remarks || "",
      category_id: defaultValues?.category_id,
    },
  });

  const currentType = form.watch("type");
  const selectedCategory = categories.find(
    (c: Category) => c.id === form.watch("category_id")
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-[700px] px-2 pt-2 pb-2" // top-12에 맞춰 pt-12 적용
      >
        {/* 상단 입력 영역: 가변 높이 및 스크롤 */}
        <div className="flex-1 space-y-7 overflow-y-auto scrollbar-hide pr-1">
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
              <TooltipProvider delayDuration={200}>
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
              </TooltipProvider>
            </div>
          </div>

          {/* 2. 금액 섹션 */}
          <div className="text-center space-y-0">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              Amount
            </span>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <Input
                  type="number"
                  className="h-16 bg-transparent border-0 border-b-2 border-slate-100 rounded-none text-4xl font-black text-center focus-visible:ring-0 focus-visible:border-black transition-all px-0"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
          </div>

          {/* 3. 입력 필드 그룹 */}
          <div className="space-y-5 px-1">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-[10px] font-bold text-slate-400 ml-1 tracking-wider uppercase">
                      <Calendar className="w-3 h-3" /> Date
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-[10px] font-bold text-slate-400 ml-1 tracking-wider uppercase">
                      <FileText className="w-3 h-3" /> Description
                    </FormLabel>
                    <Input
                      className="h-12 bg-slate-50/80 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300"
                      placeholder="내용 입력"
                      {...field}
                    />
                  </FormItem>
                )}
              />
            </div>

            {/* 카테고리 선택 */}
            <div className="space-y-1.5">
              <FormLabel className="flex items-center gap-2 text-[10px] font-bold text-slate-400 ml-1 tracking-wider uppercase">
                <Tag className="w-3 h-3" /> Category
              </FormLabel>
              <div
                className={cn(
                  "rounded-2xl bg-slate-50 transition-all overflow-hidden",
                  isCategoryOpen && "ring-1 ring-slate-200 shadow-sm"
                )}
              >
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="w-full h-12 px-4 flex items-center justify-between"
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
                      isCategoryOpen && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    isCategoryOpen
                      ? "max-h-[200px] opacity-100 p-1 border-t border-slate-100/50"
                      : "max-h-0 opacity-0"
                  )}
                >
                  <Command className="bg-transparent">
                    <CommandList className="max-h-[140px] overflow-y-auto scrollbar-hide">
                      <CommandGroup>
                        {categories.map((cat: Category) => (
                          <div
                            key={cat.id}
                            onClick={() => {
                              form.setValue("category_id", cat.id);
                              setIsCategoryOpen(false);
                            }}
                            className="flex items-center justify-between px-3 py-2.5 hover:bg-white rounded-xl cursor-pointer text-xs mb-0.5 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <span>{cat.icon}</span>
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
                        onAddNewCategory?.();
                      }}
                      className="w-full py-2.5 flex items-center justify-center gap-1.5 text-[10px] font-black text-emerald-500 border-t border-slate-100/50 mt-1 uppercase"
                    >
                      <Plus className="w-3 h-3" /> 새 카테고리 추가
                    </button>
                  </Command>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <Textarea
                  className="resize-none rounded-3xl border-none bg-slate-50/80 p-5 text-sm font-medium placeholder:text-slate-300 min-h-[100px]"
                  placeholder="메모를 입력하세요"
                  {...field}
                />
              )}
            />
          </div>
        </div>

        {/* 4. 하단 고정 버튼 영역 */}
        <div className="shrink-0 pt-6 bg-white flex gap-3 mt-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
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
        </div>
      </form>
    </Form>
  );
};

export default TransactionForm;
