import { describe, expect, it } from "vitest";

import {
  getAdjustmentResultMessage,
  getOptionalLoadMessage,
  getPrimaryAction,
  getSetupProgress,
} from "./dashboard-state";

describe("dashboard state", () => {
  describe("getPrimaryAction", () => {
    it("asks the user to complete their profile first", () => {
      expect(
        getPrimaryAction({
          hasProfile: false,
          hasWeight: false,
          hasCalories: false,
        }),
      ).toEqual({
        label: "Add your details",
        href: "/profile",
      });
    });

    it("asks the user to log weight after profile setup", () => {
      expect(
        getPrimaryAction({
          hasProfile: true,
          hasWeight: false,
          hasCalories: false,
        }),
      ).toEqual({
        label: "Log your first weight",
        href: "/tools/tracking/weight",
      });
    });

    it("offers plan generation once profile and weight are available", () => {
      expect(
        getPrimaryAction({
          hasProfile: true,
          hasWeight: true,
          hasCalories: false,
        }),
      ).toEqual({
        label: "Generate your nutrition plan",
        href: null,
      });
    });

    it("has no setup action when setup is complete", () => {
      expect(
        getPrimaryAction({
          hasProfile: true,
          hasWeight: true,
          hasCalories: true,
        }),
      ).toBeNull();
    });
  });

  describe("getSetupProgress", () => {
    it("calculates setup progress independently of goal progress", () => {
      expect(
        getSetupProgress({
          hasProfile: true,
          hasWeight: false,
          hasCalories: false,
        }),
      ).toBe(33);

      expect(
        getSetupProgress({
          hasProfile: true,
          hasWeight: true,
          hasCalories: false,
        }),
      ).toBe(67);

      expect(
        getSetupProgress({
          hasProfile: true,
          hasWeight: true,
          hasCalories: true,
        }),
      ).toBe(100);
    });

    it("starts at zero when nothing is configured", () => {
      expect(
        getSetupProgress({
          hasProfile: false,
          hasWeight: false,
          hasCalories: false,
        }),
      ).toBe(0);
    });
  });

  describe("optional service failures", () => {
    it("distinguishes progress failure from a legitimate no-data state", () => {
      expect(getOptionalLoadMessage("progress")).toContain(
        "Progress information is temporarily unavailable",
      );
    });

    it("distinguishes recommendation failure from a legitimate empty state", () => {
      expect(getOptionalLoadMessage("recommendations")).toContain(
        "Recommendations are temporarily unavailable",
      );
    });
  });

  describe("adjustment result", () => {
    it("reports a newly activated plan", () => {
      const plan = {
        version: 3,
        targetCalories: 2400,
      } as any;

      expect(
        getAdjustmentResultMessage({
          decision: "ACCEPTED",
          nutritionPlan: plan,
        }),
      ).toBe(
        "Your new plan is active (version 3) with a target of 2400 kcal/day.",
      );
    });

    it("reports acceptance when no plan is returned", () => {
      expect(
        getAdjustmentResultMessage({
          decision: "ACCEPTED",
          nutritionPlan: null,
        }),
      ).toBe(
        "You accepted the recommendation and a new plan has been created.",
      );
    });

    it("reports a declined adjustment without implying failure", () => {
      expect(
        getAdjustmentResultMessage({
          decision: "DECLINED",
          nutritionPlan: null,
        }),
      ).toBe("You chose to keep your current plan for now.");
    });
  });
});
