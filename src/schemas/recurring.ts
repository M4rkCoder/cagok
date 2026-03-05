import { z } from "zod";

export const recurringSchema = (t: any) =>
  z.object({
    description: z
      .string({ message: t("recurring.form.validation.description_required") })
      .min(1, t("recurring.form.validation.description_required")),

    // invalid_type_error 대신 message 사용
    category_id: z.coerce
      .number({
        message: t("recurring.form.validation.category_required"),
      })
      .min(1, t("recurring.form.validation.category_required")),

    amount: z.preprocess(
      (val) => {
        if (typeof val === "string") return Number(val.replace(/,/g, ""));
        return val;
      },
      // 여기도 invalid_type_error 대신 message 사용
      z
        .number({
          message: t("recurring.form.validation.amount_required"),
        })
        .positive(t("recurring.form.validation.amount_required"))
    ),

    start_date: z
      .string({ message: t("recurring.form.validation.start_date_required") })
      .min(1, t("recurring.form.validation.start_date_required")),

    end_date: z.string().optional().nullable(),
    frequency: z.string(),
    is_fixed: z.number().default(0),
    remarks: z.string().optional().nullable(),
  });
