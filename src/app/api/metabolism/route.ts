import { NextResponse } from "next/server";
import { calcBMR, calcTDEE, goalCalories } from "@/lib/calc/metabolism";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const heightCm = Number(body?.heightCm);
  const weightKg = Number(body?.weightKg);
  const ageYears = Number(body?.ageYears);
  const gender = (body?.gender ?? "other") as "male" | "female" | "other";
  const activity = (body?.activity ?? "moderate") as
    | "sedentary"
    | "light"
    | "moderate"
    | "active"
    | "very_active";
  const goal = (body?.goal ?? "maintain") as "lose" | "maintain" | "gain";

  if (!heightCm || !weightKg || !ageYears) {
    return NextResponse.json(
      { error: "heightCm, weightKg, and ageYears are required." },
      { status: 400 }
    );
  }

  const bmr = calcBMR({ weightKg, heightCm, ageYears, gender });
  if (!bmr) return NextResponse.json({ error: "Invalid inputs." }, { status: 400 });

  const tdee = calcTDEE({ bmr, activity });
  if (!tdee) return NextResponse.json({ error: "Invalid activity level." }, { status: 400 });

  const targetCalories = goalCalories({ tdee, goal });

  return NextResponse.json({ bmr, tdee, targetCalories });
}
