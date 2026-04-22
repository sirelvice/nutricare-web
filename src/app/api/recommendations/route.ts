import { NextResponse } from "next/server";
import { buildRecommendations, type BmiCategory } from "@/lib/reco/engine";
import { calculateBMI } from "@/lib/calc/bmi";
import { calculateTDEE } from "@/lib/calc/metabolism";

type Goal = "lose" | "maintain" | "gain";

type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

type Gender = "male" | "female";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const heightCm = Number(body?.heightCm);
  const weightKg = Number(body?.weightKg);
  const age = Number(body?.age);
  const gender = body?.gender as Gender | undefined;
  const activity = body?.activity as ActivityLevel | undefined;
  const goal = (body?.goal ?? "maintain") as Goal;

  // ✅ Validate required inputs
  if (
    !Number.isFinite(heightCm) ||
    !Number.isFinite(weightKg)
  ) {
    return NextResponse.json(
      { error: "heightCm and weightKg are required." },
      { status: 400 }
    );
  }

  // ✅ Compute BMI (from shared calc layer)
  const { bmi, category: rawCategory } = calculateBMI(heightCm, weightKg);

  // ✅ Normalize category for recommendation engine
  const category: BmiCategory =
    rawCategory === "underweight"
      ? "underweight"
      : rawCategory === "normal"
      ? "normal"
      : rawCategory === "overweight"
      ? "overweight"
      : "obese";

  // ✅ Safe fallbacks (until fully wired to profile)
  const safeAge = Number.isFinite(age) ? age : 25;
  const safeGender: Gender = gender === "female" ? "female" : "male";
  const safeActivity: ActivityLevel = activity ?? "moderate";

  // ✅ Compute calories (shared logic)
  const targetCalories = calculateTDEE({
    weightKg,
    heightCm,
    age: safeAge,
    gender: safeGender,
    activity: safeActivity,
    goal,
  });

  // ✅ Build recommendations
  const recommendations = buildRecommendations({
    bmi,
    category,
    goal,
    targetCalories,
  });

  return NextResponse.json({
    bmi: Number(bmi.toFixed(1)),
    category: rawCategory,
    targetCalories,
    recommendations,
  });
}