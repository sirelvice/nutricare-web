export type InquiryOutcome = { type: "saved" | "rejected" | "uncertain"; message: string };

export async function submitInquiry(kind: "contact" | "partner", details: unknown, signal: AbortSignal): Promise<InquiryOutcome> {
  try {
    const response = await fetch(kind === "contact" ? "/api/contact" : "/api/partners/inquiries", {
      method: "POST", credentials: "same-origin", cache: "no-store", signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(details),
    });
    if (!response.ok) {
      const messages: Record<number, string> = {
        400: "Check your details before submitting again.",
        403: "Refresh this page before submitting again.",
        413: "Shorten your message before submitting again.",
        415: "Refresh this page before submitting again.",
        429: "Too many submissions. Please wait before trying again.",
      };
      if (messages[response.status]) return { type: "rejected", message: messages[response.status] };
      return uncertain();
    }
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "ok" in body && body.ok === true && "id" in body && typeof body.id === "string" && body.id.trim()) {
      return { type: "saved", message: kind === "contact" ? "Message saved. Thank you for contacting NutriCare." : "Inquiry saved. Thank you for sharing your plans." };
    }
    return uncertain();
  } catch {
    return uncertain();
  }
}
function uncertain(): InquiryOutcome {
  return { type: "uncertain", message: "We couldn't confirm the result. Your submission may already be saved. Another attempt could create a duplicate." };
}
