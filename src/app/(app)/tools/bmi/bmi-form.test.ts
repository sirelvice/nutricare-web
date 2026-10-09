import { describe, expect, it } from "vitest";
import { validateBMIDraft } from "./bmi-form";

describe("BMI form measurements", () => {
  it.each([
    { height: "170", weight: "60", heightCm: 170, weightKg: 60 },
    { height: "80", weight: "20", heightCm: 80, weightKg: 20 },
    { height: "250", weight: "350", heightCm: 250, weightKg: 350 },
    { height: " 175.5 ", weight: "70.25", heightCm: 175.5, weightKg: 70.25 },
  ])("accepts supported decimal measurements: %j", ({ height, weight, heightCm, weightKg }) => {
    expect(validateBMIDraft({ height, weight })).toEqual({ ok: true, heightCm, weightKg });
  });

  it("reports both missing measurements", () => {
    expect(validateBMIDraft({ height: "", weight: " " })).toEqual({ ok: false, errors: {
      height: "Enter your height in cm.", weight: "Enter your weight in kg.",
    } });
  });

  it.each(["abc", "0xAA", "1.7e2", "175,5", "Infinity", "NaN", "-170", "79.9", "250.1"])("rejects unsupported height %s", (height) => {
    expect(validateBMIDraft({ height, weight: "60" })).toEqual({ ok: false, errors: { height: "Enter a number between 80 and 250 cm." } });
  });

  it.each(["abc", "6e1", "-60", "19.9", "350.1"])("rejects unsupported weight %s", (weight) => {
    expect(validateBMIDraft({ height: "170", weight })).toEqual({ ok: false, errors: { weight: "Enter a number between 20 and 350 kg." } });
  });
});
