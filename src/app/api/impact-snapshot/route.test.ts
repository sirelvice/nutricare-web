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

    expect(body.metrics).toEqual([]);
    expect(body.narrative.body).toContain(
      "Programme results have not been published. Product activity alone does not demonstrate better health outcomes.",
    );
    expect(JSON.stringify(body)).not.toContain("local storage");
    expect(body).not.toHaveProperty("usageSnapshot");
    expect(body).not.toHaveProperty("profile");
    expect(body).not.toHaveProperty("weightEntries");
  });
});
