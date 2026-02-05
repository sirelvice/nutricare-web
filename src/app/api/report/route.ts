import { NextResponse } from "next/server";

import { getProfileSnapshot } from "@/lib/profile/storage";
import { loadBmiHistory } from "@/lib/history/bmi";
import { loadCaloriesHistory } from "@/lib/history/calories";
import { loadWeightEntries, summarize } from "@/lib/tracking/weight";

export const dynamic = "force-dynamic"; // no caching surprises

export async function GET() {
  const profile = getProfileSnapshot();

  const bmiHistory = loadBmiHistory();
  const caloriesHistory = loadCaloriesHistory();

  const weightEntries = loadWeightEntries();
  const weightStats = summarize(weightEntries);

  const latestBmi = bmiHistory[0] ?? null;
  const latestCalories = caloriesHistory[0] ?? null;

  const report = {
    generatedAt: new Date().toISOString(),
    app: { name: "NutriCare", version: "v1" },

    profile,

    bmi: {
      latest: latestBmi,
      historyCount: bmiHistory.length,
    },

    calories: {
      latest: latestCalories,
      historyCount: caloriesHistory.length,
    },

    weight: {
      stats: weightStats ?? null,
      entriesCount: weightEntries.length,
    },
  };

  return NextResponse.json(report, { status: 200 });
}
