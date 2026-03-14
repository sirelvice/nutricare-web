import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Stripe webhook disabled." },
    { status: 501 }
  );
}