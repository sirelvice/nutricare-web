import { describe, expect, it } from "vitest";
import { MAX_JSON_REQUEST_BYTES, readJsonRequest } from "./read-json-request";

function request(body: string, headers?: HeadersInit) {
  return new Request("https://nutricare.invalid/api/profile", { method: "POST", body, headers });
}

describe("bounded JSON request reads", () => {
  it("accepts exactly the byte limit", async () => {
    const value = "a".repeat(MAX_JSON_REQUEST_BYTES - 2);
    expect(await readJsonRequest(request(JSON.stringify(value)))).toEqual({ ok: true, data: value });
  });

  it.each([undefined, "1"])("rejects oversized bodies without trusting Content-Length %s", async (length) => {
    const result = await readJsonRequest(request('"' + "a".repeat(MAX_JSON_REQUEST_BYTES) + '"', length ? { "Content-Length": length } : undefined));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(413);
      expect(result.response.headers.get("cache-control")).toBe("private, no-store");
    }
  });

  it("rejects an oversized declared length before reading", async () => {
    const result = await readJsonRequest(request("{}", { "Content-Length": String(MAX_JSON_REQUEST_BYTES + 1) }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(413);
  });

  it("counts UTF-8 bytes rather than characters", async () => {
    const result = await readJsonRequest(request(JSON.stringify("😀".repeat(5000))));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(413);
  });

  it.each(["", "{", "not-json"])("rejects malformed JSON %j", async (body) => {
    const result = await readJsonRequest(request(body));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
  });

  it("rejects invalid UTF-8", async () => {
    const result = await readJsonRequest(new Request("https://nutricare.invalid", { method: "POST", body: new Uint8Array([0xff]) }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
  });

  it("cancels a chunked oversized stream", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_JSON_REQUEST_BYTES));
        controller.enqueue(new Uint8Array(1));
      },
      cancel() { cancelled = true; },
    });
    const streamed = new Request("https://nutricare.invalid", {
      method: "POST", body: stream, duplex: "half",
    } as RequestInit & { duplex: "half" });
    const result = await readJsonRequest(streamed);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(413);
    expect(cancelled).toBe(true);
  });
});
