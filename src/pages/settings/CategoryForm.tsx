import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import EmojiPicker, { Theme, EmojiStyle } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpCircle, ArrowDownCircle, X } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Category } from "@/types";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/CategoryIcon"; // 컴포넌트 임포트
import { useCategoryStore } from "@/store/useCategoryStore";
import { useAppStore } from "@/store/useAppStore";

interface CategoryFormProps {
  onSubmit: (values: any) => void;
  onCancel: () => void;
  defaultValues?: Category;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ onSubmit, onCancel }) => {
  const { categoryList: categories } = useAppStore();
  const {
    newCategoryName,
    newCategoryIcon,
    newCategoryType,
    editingCategoryId,
    setCategoryState,
  } = useCategoryStore();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const formSchema = z
    .object({
      name: z.string().min(1, { message: "이름을 입력해주세요." }),
      icon: z.string(),
      type: z.enum(["0", "1"]),
    })
    .superRefine((data, ctx) => {
      const isDuplicate = categories.some((cat) => {
        if (editingCategoryId !== null) {
          return cat.id !== editingCategoryId && cat.name === data.name.trim();
        }
        return cat.name === data.name.trim();
      });

      if (isDuplicate) {
        ctx.addIssue({
          code: "custom",
          message: "이미 존재하는 카테고리 이름입니다.",
          path: ["name"],
        });
      }
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      icon: "➕",
      type: "1",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (editingCategoryId !== null) {
      // 수정 모드
      form.reset({
        name: newCategoryName,
        icon: newCategoryIcon,
        type: newCategoryType.toString() as "0" | "1",
      });
    } else {
      form.reset({
        name: "",
        icon: "➕",
        type: newCategoryType.toString() as "0" | "1",
      });
    }
  }, [
    editingCategoryId,
    newCategoryName,
    newCategoryIcon,
    newCategoryType,
    form,
  ]);

  const currentType = form.watch("type");
  const currentIcon = form.watch("icon");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="relative flex flex-col h-[630px]"
      >
        <div className="flex-1 overflow-hidden pt-2">
          {!isPickerOpen && (
            <div className="space-y-10 animate-in fade-in zoom-in-95 duration-200">
              {/* 수입/지출 선택 탭 */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="p-1 bg-slate-100/80 rounded-2xl flex gap-1">
                        {[
                          { id: "0", name: "수입", icon: ArrowUpCircle },
                          { id: "1", name: "지출", icon: ArrowDownCircle },
                        ].map((item) => {
                          const isActive = field.value === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => field.onChange(item.id)}
                              className={cn(
                                "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl transition-all font-bold text-sm",
                                isActive
                                  ? "bg-white shadow-sm"
                                  : "text-slate-400"
                              )}
                            >
                              <item.icon
                                className={cn(
                                  "w-4 h-4",
                                  isActive
                                    ? item.id === "0"
                                      ? "text-emerald-500"
                                      : "text-rose-500"
                                    : "text-slate-300"
                                )}
                              />
                              {item.name}
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 아이콘 및 이름 입력 섹션 */}
              <div className="flex flex-col items-center gap-8">
                {/* 배경색이 변하는 이모지 아이콘 버튼 */}
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="hover:scale-105 transition-all active:scale-95"
                >
                  <CategoryIcon
                    icon={currentIcon}
                    type={Number(currentType)}
                    size="lg"
                  />
                </button>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input
                          placeholder="이름을 입력하세요"
                          className="h-16 bg-transparent border-0 border-b-2 border-slate-100 rounded-none text-3xl font-black text-center focus-visible:ring-0 focus-visible:border-black transition-all px-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="mt-4 font-bold text-rose-500 text-center" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* 이모지 피커 모드 */}
          {isPickerOpen && (
            <div className="h-full flex flex-col animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                  아이콘 선택
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPickerOpen(false)}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div
                className="flex-1 rounded-3xl overflow-hidden border border-slate-100 shadow-inner bg-white"
                /* 인라인 스타일로 폰트 스택을 강제 주입 */
                style={{
                  fontFamily:
                    '"NotoColorEmojiCustom", "Segoe UI Emoji", sans-serif',
                }}
              >
                <EmojiPicker
                  theme={Theme.LIGHT}
                  emojiStyle={EmojiStyle.NATIVE}
                  onEmojiClick={(emojiData) => {
                    form.setValue("icon", emojiData.emoji);
                    setIsPickerOpen(false);
                  }}
                  width="100%"
                  height="100%"
                  previewConfig={{ showPreview: false }}
                  skinTonesDisabled
                />
              </div>
            </div>
          )}
        </div>

        {/* 하단 저장 버튼 */}
        <div
          className={cn(
            "shrink-0 pt-6 bg-white flex gap-3",
            isPickerOpen && "hidden"
          )}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="flex-1 h-14 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl"
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={!form.formState.isValid}
            className={cn(
              "flex-[2] h-14 text-white rounded-2xl font-black transition-all",
              currentType === "0"
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-black hover:bg-slate-800",
              "disabled:bg-slate-100 disabled:text-slate-300"
            )}
          >
            저장
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CategoryForm;
