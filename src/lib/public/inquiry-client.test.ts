import { afterEach, describe, expect, it, vi } from "vitest";
import { submitInquiry } from "./inquiry-client";

afterEach(() => vi.unstubAllGlobals());
describe("public inquiry outcomes", () => {
  it.each(["contact", "partner"] as const)("confirms only a validated saved %s response", async (kind) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, id: "saved-1" }), { status: kind === "contact" ? 200 : 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    expect((await submitInquiry(kind, { message: "Context" }, controller.signal)).type).toBe("saved");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(kind === "contact" ? "/api/contact" : "/api/partners/inquiries");
    expect(options.credentials).toBe("same-origin");
    expect(options.cache).toBe("no-store");
    controller.abort();
    expect(options.signal.aborted).toBe(true);
  });
  it.each([400, 403, 413, 415, 429])("classifies %s as rejected without exposing response bodies", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private server detail", { status })));
    const result = await submitInquiry("contact", {}, new AbortController().signal);
    expect(result.type).toBe("rejected");
    expect(result.message).not.toContain("private server detail");
  });
  it.each([null, {}, { ok: true }, { ok: true, id: "" }, { ok: false, id: "saved-1" }])("treats malformed success as uncertain: %j", async (body) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })));
    expect((await submitInquiry("contact", {}, new AbortController().signal)).type).toBe("uncertain");
  });
  it("treats a server error as uncertain and never retries automatically", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("private detail", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await submitInquiry("contact", {}, new AbortController().signal)).type).toBe("uncertain");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("treats a lost connection as uncertain", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Network error")));
    expect((await submitInquiry("partner", {}, new AbortController().signal)).type).toBe("uncertain");
  });
});
