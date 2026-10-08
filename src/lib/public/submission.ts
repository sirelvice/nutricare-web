import { assertSameOrigin, InvalidRequestOriginError } from "@/lib/security/origin";
import { consumeRateLimit, getClientIp, rateLimitHeaders } from "@/lib/security/rate-limit";

export class PublicSubmissionError extends Error {
  constructor(message: string, public readonly status: number, public readonly headers?: HeadersInit) {
    super(message);
    this.name = "PublicSubmissionError";
  }
}

const maxBytes = 32 * 1024;

export async function readPublicSubmission(request: Request, namespace: string): Promise<unknown> {
  try {
    assertSameOrigin(request);
  } catch (error) {
    if (error instanceof InvalidRequestOriginError) {
      throw new PublicSubmissionError("Invalid request origin.", 403);
    }
    throw error;
  }
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new PublicSubmissionError("Send inquiry details as JSON.", 415);
  }
  const limit = await consumeRateLimit({
    namespace, identifier: getClientIp(request), limit: 5, windowSeconds: 15 * 60,
  });
  if (!limit.allowed) {
    throw new PublicSubmissionError("Too many submissions. Please try again later.", 429, rateLimitHeaders(limit));
  }
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > maxBytes) {
    throw new PublicSubmissionError("Inquiry details are too large.", 413);
  }
  if (!request.body) throw new PublicSubmissionError("Provide valid inquiry details.", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new PublicSubmissionError("Inquiry details are too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new PublicSubmissionError("Provide valid inquiry details.", 400);
  }
}
