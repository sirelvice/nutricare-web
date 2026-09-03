import { describe, expect, it } from "vitest";
import { POST } from "./route";

function request(body: unknown) {
  return new Request("http://localhost/api/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/recommendations", () => {
  it("calculates BMI, target calories, and recommendations", async () => {
    const response = await POST(
      request({
        heightCm: 170,
        weightKg: 60,
        age: 30,
        gender: "male",
        activity: "moderate",
        goal: "maintain",
      }),
    );

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.bmi).toBe(20.8);
    expect(body.category.label).toBe("Normal");
    expect(body.targetCalories).toBe(2353);
    expect(body.recommendations).toBeDefined();
  });

  it("returns 400 when height or weight is missing", async () => {
    const response = await POST(
      request({
        age: 30,
        gender: "male",
        activity: "moderate",
        goal: "maintain",
      }),
    );

    expect(response.status).toBe(400);
  });

  it("uses the supplied gender, activity, and goal", async () => {
    const response = await POST(
      request({
        heightCm: 170,
        weightKg: 60,
        age: 30,
        gender: "female",
        activity: "sedentary",
        goal: "gain",
      }),
    );

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.targetCalories).toBe(1872);
    expect(body.recommendations).toBeDefined();
  });
});
