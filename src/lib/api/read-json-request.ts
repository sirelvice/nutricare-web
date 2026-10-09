import { apiError } from "./errors";

export const MAX_JSON_REQUEST_BYTES = 16 * 1024;

type JsonRequestResult =
  | { ok: true; data: unknown }
  | { ok: false; response: Response };

// Read the original request once. Do not clone/tee untrusted bodies: a second
// unread branch can continue buffering even when the inspected branch is capped.
export async function readJsonRequest(request: Request): Promise<JsonRequestResult> {
  const tooLarge = () => ({
    ok: false as const,
    response: apiError("Request body is too large.", 413),
  });
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > MAX_JSON_REQUEST_BYTES) {
    if (request.body) await request.body.cancel().catch(() => undefined);
    return tooLarge();
  }
  if (!request.body) return { ok: false, response: apiError("Provide a valid JSON request body.", 400) };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_JSON_REQUEST_BYTES) {
        await reader.cancel().catch(() => undefined);
        return tooLarge();
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { ok: true, data: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } catch {
    return { ok: false, response: apiError("Provide a valid JSON request body.", 400) };
  } finally {
    reader.releaseLock();
  }
}
