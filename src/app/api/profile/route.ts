import { readJsonRequest } from "@/lib/api/read-json-request";
import { GoalChangeError, goalChangeFeedback } from "@/lib/profile/goal-change-errors";
import { NextResponse } from "next/server";
import { profileSchema } from "@/lib/profile/schema";
import { auth } from "@/auth";
import {
  assertSameOrigin,
  InvalidRequestOriginError,
} from "@/lib/security/origin";
import { prisma } from "@/lib/db";
import { GetProfileService } from "@/lib/profile/services/get-profile";
import { SaveProfileService } from "@/lib/profile/services/save-profile";
import { ChangeGoalService } from "@/lib/profile/services/change-goal";
import { GoalChangeConflictError, PrismaGoalChangeWorkflowRepository } from "@/lib/profile/repositories/goal-change-workflow-repository";
import { PrismaWeightRepository } from "@/lib/tracking/repositories/prisma-weight-repository";
import { prismaNutritionPlanRepository } from "@/lib/nutrition-plan/prisma-repository";
import { PrismaProfileRepository } from "@/lib/profile/repositories/prisma-profile-repository";
import {
  unauthorized,
  badRequest,
  internalServerError,
} from "@/lib/api/errors";

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

    return NextResponse.json(profile, { status: 200, headers: { "Cache-Control": "private, no-store" } });
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

  const requestBody = await readJsonRequest(request);
  if (!requestBody.ok) return requestBody.response;
  const body = requestBody.data;
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

    return NextResponse.json(profile, { status: 200, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof GoalChangeError || error instanceof GoalChangeConflictError) {
      const code = error instanceof GoalChangeError ? error.code : "GOAL_CHANGE_CONFLICT";
      const feedback = goalChangeFeedback[code];
      return NextResponse.json({ error: feedback.message, code }, { status: feedback.status });
    }
    if (error instanceof Error && error.message === "Invalid profile") {
      return badRequest("Invalid profile data.");
    }

    return internalServerError("Unable to save profile.");
  }
}
