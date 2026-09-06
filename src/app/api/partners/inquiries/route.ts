import { NextResponse } from "next/server";
import { PartnerInterest } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const inquirySchema = z.object({
  orgName: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  country: z.string().trim().max(120).optional(),
  interest: z.enum(["pilot", "donation", "research", "integration", "other"]),
  message: z.string().trim().min(10).max(5000),
});

const interestMap: Record<
  z.infer<typeof inquirySchema>["interest"],
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
    const body = await req.json();
    const parsed = inquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide valid partner inquiry details." },
        { status: 400 },
      );
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
    console.error("Partner inquiry route error:", error);

    return NextResponse.json(
      { error: "Unable to submit your inquiry right now." },
      { status: 500 },
    );
  }
}
