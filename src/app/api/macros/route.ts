import { NextResponse } from "next/server";
import { calcMacros } from "@/lib/calc/macros";

type Goal = "lose" | "maintain" | "gain";

type Body = {
  targetCalories: number;
  goal: Goal;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Body>;
    const targetCalories = Number(body.targetCalories);
    const goal = body.goal ?? "maintain";

    if (!targetCalories || targetCalories < 800 || targetCalories > 6000) {
      return NextResponse.json({ error: "Provide a realistic targetCalories (800–6000)." }, { status: 400 });
    }

    const macros = calcMacros(targetCalories, goal);

    return NextResponse.json(
      {
        targetCalories: round(targetCalories),
        goal,
        splitPercent: {
          protein: goal === "lose" ? 30 : 25,
          carbs: goal === "lose" ? 45 : 50,
          fat: 25,
        },
        grams: {
          protein: macros.proteinG,
          carbs: macros.carbsG,
          fat: macros.fatG,
        },
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
