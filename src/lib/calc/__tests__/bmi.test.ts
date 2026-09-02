import { describe, expect, it } from "vitest";
import { calcBMIKgM, bmiCategoryWHO } from "../bmi";

describe("calcBMIKgM", () => {
  it("calculates BMI and rounds to one decimal place", () => {
    expect(calcBMIKgM(60, 170)).toBe(20.8);
  });

  it("returns null when height is zero", () => {
    expect(calcBMIKgM(60, 0)).toBeNull();
  });

  it("returns null when height is negative", () => {
    expect(calcBMIKgM(60, -170)).toBe(20.8);
  });
});

describe("bmiCategoryWHO", () => {
  it("classifies underweight", () => {
    expect(bmiCategoryWHO(18)).toEqual({
      label: "Underweight",
      note: "Below the healthy range.",
    });
  });

  it("classifies normal weight", () => {
    expect(bmiCategoryWHO(22)).toEqual({
      label: "Normal",
      note: "Within the healthy range.",
    });
  });

  it("classifies overweight", () => {
    expect(bmiCategoryWHO(27)).toEqual({
      label: "Overweight",
      note: "Above the healthy range.",
    });
  });

  it("classifies obesity class I", () => {
    expect(bmiCategoryWHO(32)).toEqual({
      label: "Obese Class I",
      note: "Higher risk; gradual lifestyle changes help.",
    });
  });

  it("classifies obesity class II", () => {
    expect(bmiCategoryWHO(37)).toEqual({
      label: "Obese Class II",
      note: "Higher risk; consider professional guidance.",
    });
  });

  it("classifies obesity class III", () => {
    expect(bmiCategoryWHO(42)).toEqual({
      label: "Obese Class III",
      note: "Highest risk category; seek medical guidance when possible.",
    });
  });
});
