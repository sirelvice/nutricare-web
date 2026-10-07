import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  assertSameOrigin,
  InvalidRequestOriginError,
} from "@/lib/security/origin";
import { prisma } from "@/lib/db";
import { PrismaWeightRepository } from "@/lib/tracking/repositories/prisma-weight-repository";
import { DeleteWeightEntryService } from "@/lib/tracking/services/delete-weight-entry";
import {
  unauthorized,
  badRequest,
  internalServerError,
} from "@/lib/api/errors";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    assertSameOrigin(_req);
    const { id } = await params;
    if (!id) return badRequest("Weight entry ID is required.");

    const service = new DeleteWeightEntryService(
      new PrismaWeightRepository(prisma),
    );
    await service.execute(session.user.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof InvalidRequestOriginError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Failed to delete weight entry:", error);
    return internalServerError("Unable to delete weight entry.");
  }
}
