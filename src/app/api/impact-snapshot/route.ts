import { NextResponse } from "next/server";
import {
  impactMetrics,
  impactNarrative,
  impactMeasures,
} from "@/lib/impact/config";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      product: {
        name: "NutriCare",
        focus: "Nutrition Intelligence & Health Tracking",
      },
      narrative: impactNarrative,
      measures: impactMeasures,
      metrics: impactMetrics,
    },
    { status: 200 },
  );
}
