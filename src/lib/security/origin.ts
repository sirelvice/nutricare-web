import { getAppUrl } from "@/lib/security/runtime-config";

export class InvalidRequestOriginError extends Error {
  constructor() {
    super("Invalid request origin.");
    this.name = "InvalidRequestOriginError";
  }
}

function getRequestOrigin(request: Request): string | null {
  const origin = request.headers.get("origin")?.trim();

  if (origin) {
    return origin;
  }

  const referer = request.headers.get("referer")?.trim();

  if (!referer) {
    return null;
  }

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function assertSameOrigin(request: Request): void {
  const appUrl = getAppUrl();

  if (!appUrl) {
    throw new InvalidRequestOriginError();
  }

  const requestOrigin = getRequestOrigin(request);

  if (!requestOrigin) {
    throw new InvalidRequestOriginError();
  }

  let normalizedOrigin: string;

  try {
    normalizedOrigin = new URL(requestOrigin).origin;
  } catch {
    throw new InvalidRequestOriginError();
  }

  let configuredOrigin: string;

  try {
    configuredOrigin = new URL(appUrl).origin;
  } catch {
    throw new InvalidRequestOriginError();
  }

  if (normalizedOrigin !== configuredOrigin) {
    throw new InvalidRequestOriginError();
  }
}
