import { NextResponse } from "next/server";
import {
  unauthorized,
  badRequest,
  internalServerError,
} from "@/lib/api/errors";
import { z } from "zod";
import { auth } from "@/auth";
import {
  assertSameOrigin,
  InvalidRequestOriginError,
} from "@/lib/security/origin";
import { prisma } from "@/lib/db";
import {
  InvalidWeightEntryError,
  RecordWeightEntryService,
} from "@/lib/tracking/services/record-weight-entry";
import { PrismaWeightRepository } from "@/lib/tracking/repositories/prisma-weight-repository";
import { ListWeightEntriesService } from "@/lib/tracking/services/list-weight-entries";
import { prismaNutritionPlanRepository } from "@/lib/nutrition-plan/prisma-repository";
import { PrismaProgressEvaluationRepository } from "@/lib/progress/repositories/prisma-progress-evaluation-repository";
import { EvaluateAndRecordProgressService } from "@/lib/progress/evaluate-and-record-service";
import { PrismaProfileRepository } from "@/lib/profile/repositories/prisma-profile-repository";
import { RecordWeightAndEvaluateService } from "@/lib/tracking/services/record-weight-and-evaluate";

const createWeightEntrySchema = z.object({
  date: z.string(),
  weightKg: z.number(),
  note: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return unauthorized();
    }

    assertSameOrigin(req);

    const body = await req.json().catch(() => null);
    const parsed = createWeightEntrySchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid weight entry.");
    }

    const weightRepository = new PrismaWeightRepository(prisma);
    const recordWeightService = new RecordWeightEntryService(weightRepository);

    const evaluateAndRecordProgressService =
      new EvaluateAndRecordProgressService(
        new PrismaProfileRepository(prisma),
        weightRepository,
        prismaNutritionPlanRepository,
        new PrismaProgressEvaluationRepository(prisma),
      );

    const service = new RecordWeightAndEvaluateService(
      recordWeightService,
      prismaNutritionPlanRepository,
      new PrismaProgressEvaluationRepository(prisma),
      evaluateAndRecordProgressService,
    );

    const result = await service.execute(session.user.id, parsed.data);

    return NextResponse.json(result.entry, {
      status: 201,
      // Keep the established entry body; clients can distinguish a saved
      // measurement from an unavailable secondary progress update.
      ...(result.evaluationFailed ? {
        headers: { "X-NutriCare-Progress-Status": "unavailable" },
      } : {}),
    });
  } catch (error) {
    if (error instanceof InvalidRequestOriginError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof InvalidWeightEntryError) {
      return badRequest("Invalid weight entry.");
    }

    console.error("Failed to record weight entry:", error);

    return internalServerError("Unable to record weight entry.");
  }
}


export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const service = new ListWeightEntriesService(
      new PrismaWeightRepository(prisma),
    );
    const entries = await service.execute(session.user.id);
    return NextResponse.json(entries, { status: 200 });
  } catch (error) {
    console.error("Failed to load weight entries:", error);
    return internalServerError("Unable to load weight entries.");
  }
}
