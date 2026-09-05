import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { RespondToAdjustmentService } from "@/lib/progress/respond-to-adjustment-service";
import { PrismaProgressEvaluationRepository } from "@/lib/progress/repositories/prisma-progress-evaluation-repository";

const respondToAdjustmentSchema = z.object({
  evaluationId: z.string().min(1),
  decision: z.enum(["ACCEPTED", "DECLINED"]),
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
  const parsed = respondToAdjustmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid adjustment response." },
      { status: 400 },
    );
  }

  try {
    const service = new RespondToAdjustmentService(
      new PrismaProgressEvaluationRepository(prisma),
    );

    const evaluation = await service.execute(
      session.user.id,
      parsed.data,
    );

    return NextResponse.json(
      {
        evaluationId: evaluation.id,
        adjustmentDecision: evaluation.adjustmentDecision,
        respondedAt: evaluation.respondedAt,
      },
      { status: 200 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "Progress evaluation not found",
        "Adjustment response is not applicable",
        "Adjustment decision has already been recorded",
      ].includes(error.message)
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 },
      );
    }

    console.error("POST /api/progress/adjustment failed", error);

    return NextResponse.json(
      { error: "Unable to record adjustment response." },
      { status: 500 },
    );
  }
}
