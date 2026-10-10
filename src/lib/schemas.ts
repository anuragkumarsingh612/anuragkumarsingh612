import { z } from "zod";
import { copy } from "./i18n";
import { today } from "./format";
export const purchaseRowSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, copy.confirm.errorName)
    .max(120, copy.confirm.errorName),
  quantity: z.coerce.number().finite().positive(copy.confirm.errorQuantity),
  price: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.number().finite().min(0, copy.confirm.errorPrice).nullable(),
  ),
  confidence: z.number().min(0).max(1).default(1),
});
export const confirmationSchema = z.object({
  store: z.string().min(1, copy.confirm.errorStore),
  date: z
    .string()
    .refine(
      (value) =>
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        Number.isFinite(Date.parse(value)) &&
        new Date(value).toISOString().slice(0, 10) === value &&
        value <= today(),
      copy.confirm.errorDate,
    ),
  items: z.array(purchaseRowSchema).min(1, copy.confirm.empty).max(100),
});
export type Confirmation = z.infer<typeof confirmationSchema>;
export const householdSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, copy.household.invalid)
    .max(60, copy.household.invalid),
  city: z
    .string()
    .trim()
    .min(2, copy.household.invalid)
    .max(60, copy.household.invalid),
});
