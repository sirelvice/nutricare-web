import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { getProfileSnapshot } from "@/lib/profile/storage";
import { loadBmiHistory } from "@/lib/history/bmi";
import { loadCaloriesHistory } from "@/lib/history/calories";
import { loadWeightEntries, summarize } from "@/lib/tracking/weight";

export const dynamic = "force-dynamic";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "—";
  }
}

export async function GET() {
  const profile = getProfileSnapshot();
  const bmiHistory = loadBmiHistory();
  const caloriesHistory = loadCaloriesHistory();
  const weightEntries = loadWeightEntries();
  const weightStats = summarize(weightEntries);

  const latestBmi = bmiHistory[0] ?? null;
  const latestCalories = caloriesHistory[0] ?? null;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  let y = height - margin;

  // Header
  page.drawText("NutriCare", {
    x: margin,
    y,
    size: 26,
    font: fontBold,
    color: rgb(0.05, 0.11, 0.22),
  });

  page.drawText("Nutrition Intelligence & Health Tracking", {
    x: margin,
    y: y - 22,
    size: 12,
    font,
    color: rgb(0.25, 0.32, 0.45),
  });

  page.drawText(`Generated: ${fmtDate(new Date().toISOString())}`, {
    x: width - margin - 180,
    y: y - 8,
    size: 10,
    font,
    color: rgb(0.35, 0.4, 0.5),
  });

  y -= 60;

  // Divider line
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.9, 0.92, 0.95),
  });

  y -= 28;

  function sectionTitle(title: string) {
    page.drawText(title, {
      x: margin,
      y,
      size: 14,
      font: fontBold,
      color: rgb(0.05, 0.11, 0.22),
    });
    y -= 18;
  }

  function kv(label: string, value: string) {
    page.drawText(label, { x: margin, y, size: 10, font, color: rgb(0.35, 0.4, 0.5) });
    page.drawText(value, { x: margin + 160, y, size: 10, fontBold, color: rgb(0.1, 0.12, 0.16) });
    y -= 14;
  }

  sectionTitle("Profile summary");
  kv("Gender", profile.gender ?? "—");
  kv("Goal", profile.goal ?? "—");
  kv("Activity", profile.activity ?? "—");
  kv("Height (cm)", profile.heightCm ? String(profile.heightCm) : "—");
  kv("Age (years)", profile.age ? String(profile.age) : "—");

  y -= 10;

  sectionTitle("Latest results");
  kv("Latest BMI", latestBmi ? String(latestBmi.bmi) : "—");
  kv("BMI category", latestBmi ? latestBmi.category : "—");
  kv("BMI date", latestBmi ? fmtDate(latestBmi.createdAt) : "—");

  kv("Latest TDEE", latestCalories ? String(latestCalories.tdee) : "—");
  kv("Target calories", latestCalories ? String(latestCalories.targetCalories) : "—");
  kv("Calories date", latestCalories ? fmtDate(latestCalories.createdAt) : "—");

  y -= 10;

  sectionTitle("Tracking");
  kv("Weight entries", String(weightEntries.length));
  kv("Latest weight", weightStats?.last ? `${weightStats.last.weightKg} kg` : "—");
  kv("Latest date", weightStats?.last ? weightStats.last.date : "—");
  kv("Change (first→last)", weightStats ? `${weightStats.change > 0 ? "+" : ""}${weightStats.change} kg` : "—");

  y -= 14;

  // Footer note
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.9, 0.92, 0.95),
  });

  y -= 18;

  const disclaimer =
    "Note: BMI and calorie calculations are screening/estimation tools and do not replace professional medical advice.";
  page.drawText(disclaimer, {
    x: margin,
    y,
    size: 9,
    font,
    color: rgb(0.35, 0.4, 0.5),
    maxWidth: width - margin * 2,
  });

  const bytes = await pdf.save();

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="nutricare-report.pdf"',
    },
  });
}
