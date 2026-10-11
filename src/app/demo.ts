import { z } from "zod";
import { daysAgo, dayDistance } from "../lib/format";
export const STORES = [
  "D-Mart",
  "Blinkit",
  "Zepto",
  "Local kirana",
  "Instamart",
  "Reliance Smart",
  "Sabzi mandi",
];
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  pack: z.string(),
  category: z.enum(["pantry", "dairy", "home", "personal"]),
  art: z.enum([
    "rice",
    "oil",
    "milk",
    "salt",
    "soap",
    "tea",
    "coffee",
    "detergent",
    "lentils",
  ]),
  gap: z.number().positive(),
  overrideGap: z.number().int().min(1).max(365).nullable().optional(),
  confidence: z.number().min(0).max(1),
  last: z.string().date(),
  store: z.string(),
  price: z.number().nonnegative().nullable(),
  ignored: z.boolean().default(false),
  snoozeUntil: z.string().date().nullable().default(null),
  skips: z.number().default(0),
  learning: z.boolean().default(false),
});
export type Product = z.infer<typeof productSchema>;
const historySchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  store: z.string(),
  date: z.string().date(),
  quantity: z.number().finite().positive(),
  price: z.number().finite().nonnegative().nullable(),
  source: z.enum(["manual", "tick", "sample"]),
});
export type Purchase = z.infer<typeof historySchema>;
export const stateSchema = z.object({
  version: z.literal(1),
  household: z.object({ name: z.string(), city: z.string() }),
  products: z.array(productSchema),
  purchases: z.array(historySchema),
  list: z.array(
    z.object({ id: z.string(), text: z.string(), done: z.boolean() }),
  ),
  savedOnce: z.boolean(),
});
export type DemoState = z.infer<typeof stateSchema>;
export function initialState(): DemoState {
  const products: Product[] = [
    {
      id: "atta",
      name: "Aashirvaad Shudh Chakki Atta",
      pack: "5 kg",
      category: "pantry",
      art: "rice",
      gap: 30,
      confidence: 0.96,
      last: daysAgo(32),
      store: "D-Mart",
      price: 245,
    },
    {
      id: "oil",
      name: "Fortune Sunlite Oil",
      pack: "1 L",
      category: "pantry",
      art: "oil",
      gap: 28,
      confidence: 0.89,
      last: daysAgo(29),
      store: "Blinkit",
      price: 155,
    },
    {
      id: "milk",
      name: "Amul Taaza Milk",
      pack: "1 L",
      category: "dairy",
      art: "milk",
      gap: 7,
      confidence: 0.94,
      last: daysAgo(7),
      store: "Local kirana",
      price: 74,
    },
    {
      id: "salt",
      name: "Tata Salt",
      pack: "1 kg",
      category: "pantry",
      art: "salt",
      gap: 45,
      confidence: 0.76,
      last: daysAgo(42),
      store: "D-Mart",
      price: 28,
    },
    {
      id: "soap",
      name: "Dove Cream Beauty Bar",
      pack: "3 × 100 g",
      category: "personal",
      art: "soap",
      gap: 30,
      confidence: 0.63,
      last: daysAgo(28),
      store: "Zepto",
      price: 180,
    },
    {
      id: "tea",
      name: "Tata Tea Gold",
      pack: "250 g",
      category: "pantry",
      art: "tea",
      gap: 30,
      confidence: 0.82,
      last: daysAgo(26),
      store: "D-Mart",
      price: 145,
    },
    {
      id: "coffee",
      name: "Nescafé Classic",
      pack: "100 g",
      category: "pantry",
      art: "coffee",
      gap: 45,
      confidence: 0.84,
      last: daysAgo(30),
      store: "Blinkit",
      price: 380,
    },
    {
      id: "detergent",
      name: "Surf Excel Easy Wash",
      pack: "1 kg",
      category: "home",
      art: "detergent",
      gap: 30,
      confidence: 0.92,
      last: daysAgo(20),
      store: "D-Mart",
      price: 140,
    },
    {
      id: "lentils",
      name: "Toor Dal",
      pack: "1 kg",
      category: "pantry",
      art: "lentils",
      gap: 30,
      confidence: 0.71,
      last: daysAgo(19),
      store: "Local kirana",
      price: 165,
    },
  ].map((p) => ({
    ...p,
    ignored: false,
    snoozeUntil: null,
    skips: 0,
    learning: false,
  })) as Product[];
  const purchases: Purchase[] = products.flatMap((p) =>
    [0, 1, 2].map((i) => ({
      id: `${p.id}-${i}`,
      productId: p.id,
      name: p.name,
      store: p.store,
      date: daysAgo(dayDistance(p.last) + p.gap * i),
      quantity: 1,
      price: p.price == null ? null : p.price + i * 2,
      source: "sample" as const,
    })),
  );
  return {
    version: 1,
    household: { name: "The Sharma home", city: "Bengaluru" },
    products,
    purchases,
    list: [
      { id: "one", text: "Bananas", done: false },
      { id: "two", text: "Fresh coriander", done: false },
      { id: "three", text: "Dishwashing liquid", done: true },
    ],
    savedOnce: false,
  };
}
export function isDue(p: Product) {
  return (
    !p.ignored &&
    !p.learning &&
    (!p.snoozeUntil || p.snoozeUntil <= daysAgo(0)) &&
    (Date.parse(daysAgo(0)) - Date.parse(p.last)) / 86400000 / p.gap >= 0.85
  );
}
