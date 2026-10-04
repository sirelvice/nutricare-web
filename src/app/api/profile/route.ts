import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  assertSameOrigin,
  InvalidRequestOriginError,
} from "@/lib/security/origin";
import { prisma } from "@/lib/db";
import { GetProfileService } from "@/lib/profile/services/get-profile";
import { SaveProfileService } from "@/lib/profile/services/save-profile";
import { ChangeGoalService } from "@/lib/profile/services/change-goal";
import { PrismaGoalChangeWorkflowRepository } from "@/lib/profile/repositories/goal-change-workflow-repository";
import { PrismaWeightRepository } from "@/lib/tracking/repositories/prisma-weight-repository";
import { prismaNutritionPlanRepository } from "@/lib/nutrition-plan/prisma-repository";
import { PrismaProfileRepository } from "@/lib/profile/repositories/prisma-profile-repository";
import {
  unauthorized,
  badRequest,
  internalServerError,
} from "@/lib/api/errors";

const profileSchema = z.object({
  heightCm: z.number().min(80).max(250).nullable(),
  age: z.number().int().min(10).max(120).nullable(),
  gender: z.enum(["male", "female", "other"]),
  activity: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ]),
  goal: z.enum(["lose", "maintain", "gain"]),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  try {
    const service = new GetProfileService(
      new PrismaProfileRepository(prisma),
    );

    const profile = await service.execute(session.user.id);

    return NextResponse.json(profile, { status: 200 });
  } catch {
    return internalServerError("Unable to load profile.");
  }
}

export async function PUT(request: Request) {
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

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Invalid profile data.");
  }

  try {
    const profileRepository = new PrismaProfileRepository(prisma);
    const weightRepository = new PrismaWeightRepository(prisma);
    const changeGoalWorkflowRepository =
      new PrismaGoalChangeWorkflowRepository(prisma);
    const changeGoalService = new ChangeGoalService(
      weightRepository,
      prismaNutritionPlanRepository,
      changeGoalWorkflowRepository,
    );

    const service = new SaveProfileService(
      profileRepository,
      changeGoalService,
    );

    const profile = await service.execute(session.user.id, parsed.data);

    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid profile") {
      return badRequest("Invalid profile data.");
    }

    return internalServerError("Unable to save profile.");
  }
}
