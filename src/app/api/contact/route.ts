import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, badRequest, internalServerError } from "@/lib/api/errors";

import { contactSchema } from "@/lib/public/inquiry-schema";
import { PublicSubmissionError, readPublicSubmission } from "@/lib/public/submission";

export const runtime = "nodejs";

type Payload = {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
};

async function sendViaResend(data: Payload) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !to || !from) return { skipped: true as const };

  const subject = `NutriCare Contact: ${data.name}`;
  const html = `
    <h2>New contact message</h2>
    <p><b>Name:</b> ${escapeHtml(data.name)}</p>
    <p><b>Email:</b> ${escapeHtml(data.email)}</p>
    <p><b>Phone:</b> ${escapeHtml(data.phone ?? "-")}</p>
    <p><b>Message:</b></p>
    <pre style="white-space:pre-wrap">${escapeHtml(data.message)}</pre>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(8000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      reply_to: data.email,
    }),
  });

  if (!res.ok) {
    throw new Error(`Contact notification failed with status ${res.status}.`);
  }

  return { sent: true as const };
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(req: Request) {
  try {
    const body = await readPublicSubmission(req, "public-contact");
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) return badRequest("Please provide valid contact details.");
    const { name, message } = parsed.data;
    const email = parsed.data.email.toLowerCase();
    const phone = parsed.data.phone || null;

    // 1) Save to DB
    const saved = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || null,
        message,
      },
    });

    // 2) Email (optional)
    try {
      await sendViaResend({ name, email, phone: phone || null, message });
    } catch (e) {
      // Don’t fail the user if email fails — DB already saved
      console.error("Contact email send failed:", e);
    }

    return NextResponse.json({ ok: true, id: saved.id }, { status: 200 });
  } catch (e) {
    if (e instanceof PublicSubmissionError) return apiError(e.message, e.status, e.headers);
    console.error("Contact route error:", e);
    return internalServerError("Server error.");
  }
}
