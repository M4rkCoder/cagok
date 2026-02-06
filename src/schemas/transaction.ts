import * as z from "zod";

export const transactionSchema = z.object({
  type: z.number(),
  is_fixed: z.number(),
  amount: z.number().min(1, { message: "금액은 1원 이상이어야 합니다." }),
  date: z.string().min(1, { message: "날짜를 선택해주세요." }),
  description: z.string().min(1, { message: "내용을 입력해주세요." }),
  remarks: z.string().optional(),
  category_id: z.number().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
