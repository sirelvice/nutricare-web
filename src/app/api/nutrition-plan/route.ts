import { assertPlanAge, PlanEligibilityError } from "@/lib/nutrition-plan/eligibility";
import { NextResponse } from "next/server";
import { NutritionPlanConflictError } from "@/lib/nutrition-plan/errors";
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

const profileRepository = new PrismaProfileRepository(prisma);

function eligibilityResponse(error: PlanEligibilityError) {
  return NextResponse.json({
    error: error.message,
    code: error.kind === "age-required" ? "NUTRITION_PLAN_AGE_REQUIRED" : "NUTRITION_PLAN_AGE_UNSUPPORTED",
  }, { status: 422, headers: { "Cache-Control": "private, no-store" } });
}

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

    const profile = await profileRepository.findByUserId(session.user.id);
    if (profile) assertPlanAge(profile.age);
    const plan = profile ? await latestPlanService.execute(session.user.id) : null;

    return NextResponse.json({ plan }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof PlanEligibilityError) return eligibilityResponse(error);
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

    return NextResponse.json({ plan }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof PlanEligibilityError) return eligibilityResponse(error);
    if (error instanceof NutritionPlanConflictError) {
      return NextResponse.json(
        {
          error:
            "Your nutrition plan changed while this request was being processed. Reload your current plan before trying again.",
          code: "NUTRITION_PLAN_CONFLICT",
        },
        { status: 409 },
      );
    }

    console.error("POST /api/nutrition-plan failed", error);

    return internalServerError("Unable to create nutrition plan");
  }
}
