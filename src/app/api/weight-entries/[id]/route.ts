import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PrismaWeightRepository } from "@/lib/tracking/repositories/prisma-weight-repository";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Weight entry ID is required." },
      { status: 400 },
    );
  }

  const repository = new PrismaWeightRepository(prisma);

  await repository.delete(session.user.id, id);

  return new NextResponse(null, { status: 204 });
}
