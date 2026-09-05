import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
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
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createWeightEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid weight entry." },
      { status: 400 },
    );
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

  try {
    const result = await service.execute(session.user.id, parsed.data);

    return NextResponse.json(result.entry, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidWeightEntryError) {
      return NextResponse.json(
        { error: "Invalid weight entry." },
        { status: 400 },
      );
    }

    console.error("Failed to record weight entry:", error);

    return NextResponse.json(
      { error: "Unable to record weight entry." },
      { status: 500 },
    );
  }
}


export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const service = new ListWeightEntriesService(
    new PrismaWeightRepository(prisma),
  );

  const entries = await service.execute(session.user.id);

  return NextResponse.json(entries, { status: 200 });
}
