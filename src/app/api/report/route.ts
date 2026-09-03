import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaProfileRepository } from "@/lib/profile/repositories/prisma-profile-repository";
import { PrismaWeightRepository } from "@/lib/tracking/repositories/prisma-weight-repository";
import { prismaNutritionPlanRepository } from "@/lib/nutrition-plan/prisma-repository";
import { prisma } from "@/lib/db";
import { GetReportService } from "@/lib/report/service";

export const dynamic = "force-dynamic";

const reportService = new GetReportService(
  new PrismaProfileRepository(prisma),
  new PrismaWeightRepository(prisma),
  prismaNutritionPlanRepository,
);

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const report = await reportService.execute(session.user.id);

    if (!report) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error("GET /api/report failed", error);

    return NextResponse.json(
      { error: "Unable to generate report" },
      { status: 500 },
    );
  }
}
