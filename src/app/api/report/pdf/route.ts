import { NextResponse } from "next/server";
import { internalServerError, notFound, unauthorized } from "@/lib/api/errors";
import { auth } from "@/auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/db";
import { GetReportService } from "@/lib/report/service";
import { PrismaProfileRepository } from "@/lib/profile/repositories/prisma-profile-repository";
import { PrismaWeightRepository } from "@/lib/tracking/repositories/prisma-weight-repository";
import { prismaNutritionPlanRepository } from "@/lib/nutrition-plan/prisma-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reportService = new GetReportService(
  new PrismaProfileRepository(prisma),
  new PrismaWeightRepository(prisma),
  prismaNutritionPlanRepository,
);

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  try {
    const report = await reportService.execute(session.user.id);

    if (!report) {
      return notFound("Profile not found.");
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const width = page.getWidth();
    const height = page.getHeight();

    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    let y = height - margin;

    const drawText = (
      text: string,
      size = 11,
      font = regular,
      gap = 18,
    ) => {
      page.drawText(text, {
        x: margin,
        y,
        size,
        font,
        color: rgb(0.12, 0.14, 0.18),
      });
      y -= gap;
    };

    const drawSection = (title: string) => {
      y -= 8;
      drawText(title, 14, bold, 24);
    };

    drawText("NutriCare Personal Report", 22, bold, 32);
    drawText(
      `Generated ${new Date(report.generatedAt).toLocaleString()}`,
      10,
      regular,
      24,
    );

    drawSection("Profile");
    drawText(`Goal: ${report.profile.goal}`);
    drawText(`Activity: ${report.profile.activity}`);
    drawText(`Height: ${report.profile.heightCm ?? "Not provided"} cm`);
    drawText(`Age: ${report.profile.age ?? "Not provided"}`);

    drawSection("Current health snapshot");

    const latestWeight = report.weight.entries[0]?.weightKg ?? null;

    drawText(
      `Latest weight: ${
        latestWeight !== null ? `${latestWeight} kg` : "Not recorded"
      }`,
    );

    drawText(
      report.bmi.latest
        ? `BMI: ${report.bmi.latest.value.toFixed(1)} (${report.bmi.latest.category})`
        : "BMI: Not available",
    );

    drawText(`Weight entries: ${report.weight.entriesCount}`);

    drawSection("Nutrition plan");

    if (report.nutritionPlan) {
      drawText(`Plan version: ${report.nutritionPlan.version}`);
      drawText(
        `Target calories: ${report.nutritionPlan.targetCalories} kcal/day`,
      );
      drawText(`Protein: ${report.nutritionPlan.proteinG} g/day`);
      drawText(`Carbohydrates: ${report.nutritionPlan.carbsG} g/day`);
      drawText(`Fat: ${report.nutritionPlan.fatG} g/day`);
    } else {
      drawText("No nutrition plan has been generated yet.");
    }

    drawSection("Weight trend");

    if (report.weight.stats) {
      drawText(`Change: ${report.weight.stats.change} kg`);
      drawText(
        `From ${report.weight.stats.first.weightKg} kg on ${report.weight.stats.first.date}`,
      );
      drawText(
        `to ${report.weight.stats.last.weightKg} kg on ${report.weight.stats.last.date}`,
      );
    } else {
      drawText("No weight history has been recorded yet.");
    }

    page.drawLine({
      start: { x: margin, y: margin + 10 },
      end: { x: width - margin, y: margin + 10 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("Personal report — keep this document private.", {
      x: margin,
      y: margin - 10,
      size: 9,
      font: regular,
      color: rgb(0.45, 0.45, 0.45),
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="nutricare-personal-report.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/report/pdf failed", error);

    return internalServerError("Unable to generate report.");
  }
}
