import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  GetLatestNutritionPlanService,
} from "@/lib/nutrition-plan/service";
import { GenerateNutritionPlanService } from "@/lib/nutrition-plan/generate-service";
import { prismaNutritionPlanRepository } from "@/lib/nutrition-plan/prisma-repository";
import { PrismaProfileRepository } from "@/lib/profile/repositories/prisma-profile-repository";
import { PrismaWeightRepository } from "@/lib/tracking/repositories/prisma-weight-repository";
import { prisma } from "@/lib/db";

const latestPlanService = new GetLatestNutritionPlanService(
  prismaNutritionPlanRepository
);

const generatePlanService = new GenerateNutritionPlanService(
  new PrismaProfileRepository(prisma),
  new PrismaWeightRepository(prisma),
  prismaNutritionPlanRepository
);

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const plan = await latestPlanService.execute(session.user.id);

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("GET /api/nutrition-plan failed", error);

    return NextResponse.json(
      { error: "Unable to load nutrition plan" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const plan = await generatePlanService.execute(session.user.id);

    if (!plan) {
      return NextResponse.json(
        { error: "Profile and current weight are required to generate a nutrition plan" },
        { status: 422 }
      );
    }

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("POST /api/nutrition-plan failed", error);

    return NextResponse.json(
      { error: "Unable to create nutrition plan" },
      { status: 500 }
    );
  }
}
