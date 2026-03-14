import { NextResponse } from "next/server";

/**
 * Payments temporarily disabled.
 * Future integrations: Flutterwave / M-Pesa / Paystack.
 */

export async function POST() {
  return NextResponse.json(
    { message: "Payments are temporarily disabled." },
    { status: 501 }
  );
}