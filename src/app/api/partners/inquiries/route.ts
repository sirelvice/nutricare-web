import { NextResponse } from "next/server";
import { PartnerInterest } from "@prisma/client";
import type { z } from "zod";
import { partnerInquirySchema } from "@/lib/public/inquiry-schema";
import { prisma } from "@/lib/db";
import { apiError, badRequest, internalServerError } from "@/lib/api/errors";

import { PublicSubmissionError, readPublicSubmission } from "@/lib/public/submission";

export const runtime = "nodejs";

const interestMap: Record<
  z.infer<typeof partnerInquirySchema>["interest"],
  PartnerInterest
> = {
  pilot: PartnerInterest.PILOT,
  donation: PartnerInterest.DONATION,
  research: PartnerInterest.RESEARCH,
  integration: PartnerInterest.INTEGRATION,
  other: PartnerInterest.OTHER,
};

export async function POST(req: Request) {
  try {
    const body = await readPublicSubmission(req, "public-partner-inquiry");
    const parsed = partnerInquirySchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Please provide valid partner inquiry details.");
    }

    const data = parsed.data;

    const saved = await prisma.partnerInquiry.create({
      data: {
        orgName: data.orgName,
        contactName: data.contactName,
        email: data.email.toLowerCase(),
        country: data.country || null,
        interest: interestMap[data.interest],
        message: data.message,
      },
    });

    return NextResponse.json(
      { ok: true, id: saved.id },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof PublicSubmissionError) return apiError(error.message, error.status, error.headers);
    console.error("Partner inquiry route error:", error);

    return internalServerError("Unable to submit your inquiry right now.");
  }
}
