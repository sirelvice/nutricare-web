import { NextResponse } from "next/server";
import { buildRecommendations, type BmiCategory } from "@/lib/reco/engine";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const bmi = Number(body?.bmi);

  const rawCategory = body?.category as
    | "underweight"
    | "normal"
    | "overweight"
    | "obese1"
    | "obese2"
    | "obese3";

  const goal = (body?.goal ?? "maintain") as "lose" | "maintain" | "gain";
  const targetCalories = Number(body?.targetCalories);

  if (!Number.isFinite(bmi) || !Number.isFinite(targetCalories) || !rawCategory) {
    return NextResponse.json(
      { error: "bmi, category, and targetCalories are required." },
      { status: 400 }
    );
  }

  // Normalize WHO obesity classes → recommendation engine categories
  const category: BmiCategory =
    rawCategory === "underweight"
      ? "underweight"
      : rawCategory === "normal"
      ? "normal"
      : rawCategory === "overweight"
      ? "overweight"
      : "obese";

  const rec = buildRecommendations({
    bmi,
    category,
    goal,
    targetCalories,
  });

  return NextResponse.json(rec);
}