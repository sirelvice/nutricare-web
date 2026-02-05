import { NextResponse } from "next/server";
import { impactMetrics, impactNarrative, impactMeasures } from "@/lib/impact/config";

import { getProfileSnapshot } from "@/lib/profile/storage";
import { loadBmiHistory } from "@/lib/history/bmi";
import { loadCaloriesHistory } from "@/lib/history/calories";
import { loadWeightEntries, summarize } from "@/lib/tracking/weight";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = getProfileSnapshot();
  const bmiHistory = loadBmiHistory();
  const caloriesHistory = loadCaloriesHistory();
  const weightEntries = loadWeightEntries();
  const weightStats = summarize(weightEntries);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    product: { name: "NutriCare", focus: "Nutrition Intelligence & Health Tracking" },

    narrative: impactNarrative,
    measures: impactMeasures,
    metrics: impactMetrics,

    usageSnapshot: {
      profileSaved: Boolean(profile),
      bmiHistoryCount: bmiHistory.length,
      caloriesHistoryCount: caloriesHistory.length,
      weightEntriesCount: weightEntries.length,
      weightStats: weightStats ?? null,
      latestBmi: bmiHistory[0] ?? null,
      latestCalories: caloriesHistory[0] ?? null,
    },
  };

  return NextResponse.json(snapshot, { status: 200 });
}
