import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/impact-snapshot/route";

describe("GET /api/impact-snapshot", () => {
  it("returns only public programme impact information", async () => {
    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toEqual(
      expect.objectContaining({
        product: {
          name: "NutriCare",
          focus: "Nutrition Intelligence & Health Tracking",
        },
        narrative: expect.any(Object),
        measures: expect.any(Array),
        metrics: expect.any(Array),
      }),
    );

    expect(body).not.toHaveProperty("usageSnapshot");
    expect(body).not.toHaveProperty("profile");
    expect(body).not.toHaveProperty("weightEntries");
  });
});
