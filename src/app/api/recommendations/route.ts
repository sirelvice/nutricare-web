import { NextResponse } from "next/server";
import { calcBMIKgM, bmiCategory } from "@/lib/calc/bmi";
import { getNutritionRecommendations } from "@/lib/recommendations/nutrition";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const heightCm = Number(body?.heightCm);
  const weightKg = Number(body?.weightKg);
  const goal = (body?.goal ?? "maintain") as "lose" | "maintain" | "gain";

  if (!heightCm || !weightKg) {
    return NextResponse.json({ error: "heightCm and weightKg are required." }, { status: 400 });
  }

  const bmi = calcBMIKgM(weightKg, heightCm);
  if (!bmi) return NextResponse.json({ error: "Invalid BMI inputs." }, { status: 400 });

  const category = bmiCategory(bmi);

  const recommendations = getNutritionRecommendations({
    bmi,
    bmiLabel: category.label,
    goal,
  });

  return NextResponse.json({
    bmi,
    category,
    recommendations,
  });
}
