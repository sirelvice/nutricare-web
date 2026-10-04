import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  assertSameOrigin,
  InvalidRequestOriginError,
} from "@/lib/security/origin";
import {
  GetLatestNutritionPlanService,
} from "@/lib/nutrition-plan/service";
import { GenerateNutritionPlanService } from "@/lib/nutrition-plan/generate-service";
import { prismaNutritionPlanRepository } from "@/lib/nutrition-plan/prisma-repository";
import { PrismaProfileRepository } from "@/lib/profile/repositories/prisma-profile-repository";
import { PrismaWeightRepository } from "@/lib/tracking/repositories/prisma-weight-repository";
import { prisma } from "@/lib/db";
import {
  unauthorized,
  unprocessableEntity,
  internalServerError,
} from "@/lib/api/errors";

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
      return unauthorized();
    }

    const plan = await latestPlanService.execute(session.user.id);

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("GET /api/nutrition-plan failed", error);

    return internalServerError("Unable to load nutrition plan");
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return unauthorized();
    }

    try {
      assertSameOrigin(request);
    } catch (error) {
      if (error instanceof InvalidRequestOriginError) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 },
        );
      }

      throw error;
    }

    const plan = await generatePlanService.execute(session.user.id);

    if (!plan) {
      return unprocessableEntity(
        "Profile and current weight are required to generate a nutrition plan",
      );
    }

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("POST /api/nutrition-plan failed", error);

    return internalServerError("Unable to create nutrition plan");
  }
}
