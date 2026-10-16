import { describe, expect, it } from "vitest";
import { brandStyle, readableOn } from "../src/lib/color";

describe("readableOn", () => {
  it("uses ink on light brand colors", () => {
    expect(readableOn("#e59a1e")).toBe("#12332b");
    expect(readableOn("#ffe680")).toBe("#12332b");
  });
  it("uses white on dark brand colors", () => {
    expect(readableOn("#1e3a8a")).toBe("#ffffff");
  });
});

describe("brandStyle", () => {
  it("falls back to saffron for missing or invalid colors", () => {
    expect(brandStyle(null)["--brand-color" as never]).toBe("#e59a1e");
    expect(brandStyle("red")["--brand-color" as never]).toBe("#e59a1e");
  });
});
