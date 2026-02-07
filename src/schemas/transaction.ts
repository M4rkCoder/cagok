import * as z from "zod";

export const transactionSchema = z.object({
  type: z.number(),
  is_fixed: z.number(),
  amount: z.number().min(1, { message: "금액을 입력해주세요." }),
  date: z.string().min(1, { message: "날짜를 선택해주세요." }),
  description: z.string().min(1, { message: "내용을 입력해주세요." }),
  remarks: z.string().optional(),
  category_id: z.number().min(1, { message: "카테고리를 선택해주세요." }),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
