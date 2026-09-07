export function getAuthSecret() {
  const secret =
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();

  if (process.env.NODE_ENV === "production" && !secret) {
    throw new Error(
      "AUTH_SECRET or NEXTAUTH_SECRET must be configured in production.",
    );
  }

  return secret;
}

export function getAppUrl() {
  const value = process.env.APP_URL?.trim();

  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("APP_URL must be configured in production.");
    }

    return undefined;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("APP_URL must be a valid absolute URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("APP_URL must use http or https.");
  }

  return value.replace(/\/$/, "");
}
