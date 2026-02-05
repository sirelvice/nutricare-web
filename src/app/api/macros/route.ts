import { NextResponse } from "next/server";

type Goal = "lose" | "maintain" | "gain";

type Body = {
  targetCalories: number;
  goal: Goal;
};

function round(n: number) {
  return Math.round(n);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Body>;
    const targetCalories = Number(body.targetCalories);
    const goal = body.goal ?? "maintain";

    if (!targetCalories || targetCalories < 800 || targetCalories > 6000) {
      return NextResponse.json({ error: "Provide a realistic targetCalories (800–6000)." }, { status: 400 });
    }

    // Simple, explainable splits (MVP):
    // - Maintain: 30% protein / 40% carbs / 30% fat
    // - Lose:     35% protein / 35% carbs / 30% fat
    // - Gain:     25% protein / 45% carbs / 30% fat
    const split =
      goal === "lose"
        ? { p: 0.35, c: 0.35, f: 0.30 }
        : goal === "gain"
        ? { p: 0.25, c: 0.45, f: 0.30 }
        : { p: 0.30, c: 0.40, f: 0.30 };

    const proteinG = (targetCalories * split.p) / 4;
    const carbsG = (targetCalories * split.c) / 4;
    const fatG = (targetCalories * split.f) / 9;

    return NextResponse.json(
      {
        targetCalories: round(targetCalories),
        goal,
        splitPercent: { protein: round(split.p * 100), carbs: round(split.c * 100), fat: round(split.f * 100) },
        grams: { protein: round(proteinG), carbs: round(carbsG), fat: round(fatG) },
        notes: [
          "Macros are estimates and should be adjusted for preferences and medical advice.",
          "Protein/carbs: 4 kcal per gram. Fat: 9 kcal per gram.",
        ],
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
}
