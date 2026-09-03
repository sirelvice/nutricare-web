import { describe, expect, it } from "vitest";
import { calcMacros } from "./macros";

describe("calcMacros", () => {
  it("calculates maintenance macros", () => {
    expect(calcMacros(2000, "maintain")).toEqual({
      proteinG: 125,
      carbsG: 250,
      fatG: 56,
    });
  });

  it("uses higher protein allocation for weight loss", () => {
    expect(calcMacros(2000, "lose")).toEqual({
      proteinG: 150,
      carbsG: 225,
      fatG: 56,
    });
  });

  it("calculates gain macros", () => {
    expect(calcMacros(2000, "gain")).toEqual({
      proteinG: 125,
      carbsG: 250,
      fatG: 56,
    });
  });
});
