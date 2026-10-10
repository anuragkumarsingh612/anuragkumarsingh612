import { describe, expect, it } from "vitest";
import { confirmationSchema, householdSchema } from "./schemas";
import { daysAgo, today, csvCell } from "./format";
import { initialState, isDue, stateSchema } from "../app/demo";
const valid = () => ({
  store: "D-Mart",
  date: today(),
  items: [{ name: "Rice", quantity: 1, price: 125, confidence: 0.8 }],
});
describe("purchase confirmation", () => {
  it("accepts a real purchase and preserves a missing price", () => {
    expect(
      confirmationSchema.parse({
        ...valid(),
        items: [{ name: "Rice", quantity: 1, price: "", confidence: 1 }],
      }).items[0].price,
    ).toBeNull();
  });
  it.each([0, -1, Infinity, NaN])("rejects invalid quantity %s", (quantity) => {
    const data = valid();
    data.items[0].quantity = quantity;
    expect(confirmationSchema.safeParse(data).success).toBe(false);
  });
  it.each([-1, Infinity, NaN])("rejects invalid price %s", (price) => {
    const data = valid();
    data.items[0].price = price;
    expect(confirmationSchema.safeParse(data).success).toBe(false);
  });
  it.each(["2025-02-30", "2025-13-01", "not-a-date"])(
    "rejects invalid date %s",
    (date) => {
      expect(confirmationSchema.safeParse({ ...valid(), date }).success).toBe(
        false,
      );
    },
  );
  it("rejects future dates", () => {
    expect(
      confirmationSchema.safeParse({ ...valid(), date: daysAgo(-1) }).success,
    ).toBe(false);
  });
  it("rejects empty confirmations and whitespace names", () => {
    expect(
      confirmationSchema.safeParse({ ...valid(), items: [] }).success,
    ).toBe(false);
    const data = valid();
    data.items[0].name = "   ";
    expect(confirmationSchema.safeParse(data).success).toBe(false);
  });
  it("validates household names", () => {
    expect(
      householdSchema.safeParse({ name: " ", city: "Bengaluru" }).success,
    ).toBe(false);
  });
});
describe("demo state and due visibility", () => {
  it("has valid seed data with six due items and three upcoming items", () => {
    const state = stateSchema.parse(initialState());
    expect(state.products.filter(isDue)).toHaveLength(6);
    expect(state.products.filter((p) => !isDue(p))).toHaveLength(3);
  });
  it("excludes learning, ignored, snoozed and just bought items", () => {
    const product = initialState().products[0];
    expect(isDue({ ...product, learning: true })).toBe(false);
    expect(isDue({ ...product, ignored: true })).toBe(false);
    expect(isDue({ ...product, snoozeUntil: daysAgo(-3) })).toBe(false);
    expect(isDue({ ...product, last: today() })).toBe(false);
    expect(isDue({ ...product, snoozeUntil: today() })).toBe(true);
  });
});
describe("CSV export", () => {
  it("quotes commas, newlines and embedded quotes", () => {
    expect(csvCell('Rice, "basmati"\n1kg')).toBe('"Rice, ""basmati""\n1kg"');
  });
  it.each([
    "=SUM(A1)",
    "+1+2",
    "-1+2",
    "@cmd",
    "  =SUM(A1)",
    "\n=1",
    "\t=1",
    "\r=1",
  ])("neutralizes spreadsheet formula prefixes %s", (value) => {
    expect(csvCell(value).startsWith("\"'")).toBe(true);
  });
  it("keeps unknown prices empty", () => expect(csvCell(null)).toBe('""'));
});
