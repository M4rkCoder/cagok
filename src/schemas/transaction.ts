import * as z from "zod";
import i18n from "@/i18n"; // i18n 인스턴스 임포트

export const transactionSchema = z.object({
  type: z.number(),
  is_fixed: z.number(),
  // "금액은 필수입니다"
  amount: z.number().min(1, {
    message: i18n.t("validation.amount_required"),
  }),
  // "날짜는 필수입니다"
  date: z.string().min(1, {
    message: i18n.t("validation.date_required"),
  }),
  // "설명은 필수입니다"
  description: z.string().min(1, {
    message: i18n.t("validation.description_required"),
  }),
  remarks: z.string().optional(),
  // "카테고리를 선택해주세요."
  category_id: z
    .union([z.number(), z.null(), z.undefined()])
    .refine((val) => val !== null && val !== undefined && val !== 0, {
      message: i18n.t("recurring.form.validation.category_required"),
    }),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
