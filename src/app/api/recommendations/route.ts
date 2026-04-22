import { NextResponse } from "next/server";
import { buildRecommendations, type BmiCategory } from "@/lib/reco/engine";

import { calcBMIKgM, bmiCategoryWHO } from "@/lib/calc/bmi";
import {
  calcBMR,
  calcTDEE,
  goalCalories,
  type ActivityLevel,
  type Gender,
} from "@/lib/calc/metabolism";

type Goal = "lose" | "maintain" | "gain";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const heightCm = Number(body?.heightCm);
  const weightKg = Number(body?.weightKg);
  const ageYears = Number(body?.age);
  const gender = body?.gender as Gender | undefined;
  const activity = body?.activity as ActivityLevel | undefined;
  const goal = (body?.goal ?? "maintain") as Goal;

  // ✅ Validate core inputs
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg)) {
    return NextResponse.json(
      { error: "heightCm and weightKg are required." },
      { status: 400 }
    );
  }

  // ✅ BMI calculation (your actual function)
  const bmi = calcBMIKgM(weightKg, heightCm);

  if (!bmi) {
    return NextResponse.json(
      { error: "Unable to calculate BMI." },
      { status: 400 }
    );
  }

  // ✅ WHO category (your actual function)
  const categoryInfo = bmiCategoryWHO(bmi);

  // map label → engine category
  const label = categoryInfo.label.toLowerCase();

  const category: BmiCategory =
    label.includes("under")
      ? "underweight"
      : label.includes("normal")
      ? "normal"
      : label.includes("overweight")
      ? "overweight"
      : "obese";

  // ✅ Safe fallbacks (until profile fully wired)
  const safeAge = Number.isFinite(ageYears) ? ageYears : 25;
  const safeGender: Gender =
    gender === "female" || gender === "other" ? gender : "male";
  const safeActivity: ActivityLevel = activity ?? "moderate";

  // ✅ BMR → TDEE → Goal calories (using your functions)
  const bmr = calcBMR({
    weightKg,
    heightCm,
    ageYears: safeAge,
    gender: safeGender,
  });

  if (!bmr) {
    return NextResponse.json(
      { error: "Unable to calculate BMR." },
      { status: 400 }
    );
  }

  const tdee = calcTDEE({
    bmr,
    activity: safeActivity,
  });

  if (!tdee) {
    return NextResponse.json(
      { error: "Unable to calculate TDEE." },
      { status: 400 }
    );
  }

  const targetCalories = goalCalories({
    tdee,
    goal,
  });

  // ✅ Recommendations
  const recommendations = buildRecommendations({
    bmi,
    category,
    goal,
    targetCalories,
  });

  return NextResponse.json({
    bmi,
    category: categoryInfo, // includes label + note (nice for UI)
    targetCalories,
    recommendations,
  });
}