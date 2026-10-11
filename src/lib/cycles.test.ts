import { describe, it, expect } from "vitest";
import { initialState } from "../app/demo";
import { median, calculateCycle, cycleForProduct } from "./cycles";
describe("median restock engine", () => {
  it("honors a manual reminder override over learned intervals", () => {
    const state = initialState();
    const product = state.products[0];
    expect(
      cycleForProduct({ ...product, overrideGap: 14 }, state.purchases).gap,
    ).toBe(14);
    expect(cycleForProduct({ ...product, overrideGap: 14 }, []).learning).toBe(
      false,
    );
  });
  it("handles odd and even histories without mutating input", () => {
    const input = [30, 10, 20];
    expect(median(input)).toBe(20);
    expect(input).toEqual([30, 10, 20]);
    expect(median([10, 20])).toBe(15);
  });
  it("does not predict a cycle without repeat purchases", () => {
    expect(calculateCycle([]).dueOn).toBeNull();
    expect(calculateCycle(["2026-01-01"]).learning).toBe(true);
  });
  it("ignores duplicate shopping dates and resists a long outlier", () => {
    const result = calculateCycle([
      "2026-03-12",
      "2026-01-01",
      "2026-01-01",
      "2026-01-11",
      "2026-01-21",
    ]);
    expect(result.cycleDays).toBe(10);
    expect(result.dueOn).toBe("2026-03-22");
    expect(result.learning).toBe(false);
  });
  it("handles leap day and month boundaries in UTC", () => {
    expect(
      calculateCycle(["2024-02-19", "2024-02-29", "2024-03-10"]).dueOn,
    ).toBe("2024-03-20");
  });
  it("rejects impossible dates and invalid intervals", () => {
    expect(() => calculateCycle(["2026-02-30"])).toThrow();
    expect(() => median([0])).toThrow();
    expect(() => median([NaN])).toThrow();
  });
});
