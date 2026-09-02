import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  InvalidWeightEntryError,
  RecordWeightEntryService,
} from "@/lib/tracking/services/record-weight-entry";
import { PrismaWeightRepository } from "@/lib/tracking/repositories/prisma-weight-repository";

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

  const service = new RecordWeightEntryService(
    new PrismaWeightRepository(prisma),
  );

  try {
    const entry = await service.execute(session.user.id, parsed.data);

    return NextResponse.json(entry, { status: 201 });
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

  const repository = new PrismaWeightRepository(prisma);

  const entries = await repository.findByUserId(session.user.id);

  return NextResponse.json(entries, { status: 200 });
}
