import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type Payload = {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
};

function isEmail(x: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
}

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
    const text = await res.text();
    throw new Error(`Resend failed: ${res.status} ${text}`);
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
    const body = (await req.json()) as Partial<Payload>;

    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim();
    const phone = (body.phone ?? "").trim();
    const message = (body.message ?? "").trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email and message are required." },
        { status: 400 }
      );
    }

    if (!isEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }

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
    console.error("Contact route error:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
