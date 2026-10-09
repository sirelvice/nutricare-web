import { NextRequest } from "next/server";
import { apiError } from "@/lib/api/errors";

export const MAX_CREDENTIALS_REQUEST_BYTES = 16 * 1024;

type CredentialsRead =
  | { ok: true; request: NextRequest; email: string }
  | { ok: false; response: Response };

export async function readCredentialsRequest(request: NextRequest): Promise<CredentialsRead> {
  const tooLarge = () => ({ ok: false as const, response: apiError("Request body is too large.", 413) });
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > MAX_CREDENTIALS_REQUEST_BYTES) {
    if (request.body) await request.body.cancel().catch(() => undefined);
    return tooLarge();
  }
  const chunks: Uint8Array[] = [];
  let length = 0;
  if (request.body) {
    const reader = request.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > MAX_CREDENTIALS_REQUEST_BYTES) {
          await reader.cancel().catch(() => undefined);
          return tooLarge();
        }
        chunks.push(value);
      }
    } catch {
      return { ok: false, response: apiError("Unable to read login request.", 400) };
    } finally {
      reader.releaseLock();
    }
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  // Only clone after the body is bounded. Preserve original bytes, cookies,
  // CSRF body value, URL and headers for Auth.js validation.
  const bounded = new NextRequest(request.url, {
    method: request.method,
    headers: request.headers,
    body: bytes.buffer,
    signal: request.signal,
  });
  let email = "";
  try {
    const type = bounded.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (type === "application/json") {
      const body: unknown = await bounded.clone().json();
      if (body && typeof body === "object" && "email" in body && typeof body.email === "string") email = body.email;
    } else {
      const body = await bounded.clone().formData();
      const field = body.get("email");
      if (typeof field === "string") email = field;
    }
  } catch {
    // Delegate bounded malformed input to Auth.js; do not bypass its validation.
  }
  email = email.trim().toLowerCase();
  if (email.length > 320) email = "";
  return { ok: true, request: bounded, email };
}
