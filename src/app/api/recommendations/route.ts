import { NextResponse } from "next/server";
import { buildRecommendations } from "@/lib/reco/engine";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const bmi = Number(body?.bmi);
  const category = body?.category as
    | "underweight"
    | "normal"
    | "overweight"
    | "obese1"
    | "obese2"
    | "obese3";
  const goal = (body?.goal ?? "maintain") as "lose" | "maintain" | "gain";
  const targetCalories = Number(body?.targetCalories);

  if (!Number.isFinite(bmi) || !Number.isFinite(targetCalories) || !category) {
    return NextResponse.json(
      { error: "bmi, category, and targetCalories are required." },
      { status: 400 }
    );
  }

  const rec = buildRecommendations({ bmi, category, goal, targetCalories });
  return NextResponse.json(rec);
}
