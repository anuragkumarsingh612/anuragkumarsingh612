import type { Product, Purchase } from "../app/demo";
const DAY = 86_400_000;
/** Median ignores one unusually long or short shopping interval. */
export function median(values: number[]): number | null {
  if (!values.length) return null;
  if (values.some((v) => !Number.isFinite(v) || v <= 0))
    throw new Error("Cycle intervals must be positive finite numbers.");
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
export function calculateCycle(dates: string[]) {
  const sorted = [...new Set(dates)]
    .map((date) => {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date
      )
        throw new Error("Invalid purchase date.");
      return Date.parse(date);
    })
    .sort((a, b) => a - b);
  const intervals = sorted.slice(1).map((date, i) => (date - sorted[i]) / DAY);
  const cycleDays = median(intervals);
  const last = sorted.at(-1);
  return {
    cycleDays,
    intervals,
    dueOn:
      cycleDays !== null && last !== undefined
        ? new Date(last + Math.round(cycleDays) * DAY)
            .toISOString()
            .slice(0, 10)
        : null,
    learning: intervals.length < 2,
  };
}
export function cycleForProduct(
  product: Product,
  purchases: Purchase[],
): Product {
  const cycle = calculateCycle(
    purchases.filter((p) => p.productId === product.id).map((p) => p.date),
  );
  return {
    ...product,
    gap: product.overrideGap ?? cycle.cycleDays ?? product.gap,
    learning: product.overrideGap ? false : cycle.learning,
  };
}
