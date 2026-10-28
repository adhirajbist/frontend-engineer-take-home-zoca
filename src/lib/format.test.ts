import { describe, expect, it } from "vitest";
import { formatCount, formatPhone } from "./format";

describe("formatCount", () => {
  it("adds commas", () => {
    expect(formatCount(1)).toBe("1");
    expect(formatCount(33360)).toBe("33,360");
  });
});

describe("formatPhone", () => {
  it("formats US numbers and leaves others alone", () => {
    expect(formatPhone("+15125550101")).toBe("(512) 555-0101");
    expect(formatPhone("+447700900123")).toBe("+447700900123");
  });
});
