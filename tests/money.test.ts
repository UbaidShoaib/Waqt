import { describe, expect, it } from "vitest";
import { centsToDollars, dollarsToCents } from "../src/lib/money";

describe("dollarsToCents", () => {
  it("converts whole dollars", () => {
    expect(dollarsToCents(25)).toBe(2500);
  });

  it("rounds float rounding errors correctly", () => {
    expect(dollarsToCents(19.99)).toBe(1999);
  });

  it("handles zero", () => {
    expect(dollarsToCents(0)).toBe(0);
  });
});

describe("centsToDollars", () => {
  it("converts cents back to dollars", () => {
    expect(centsToDollars(2500)).toBe(25);
    expect(centsToDollars(1999)).toBeCloseTo(19.99);
    expect(centsToDollars(0)).toBe(0);
  });
});
