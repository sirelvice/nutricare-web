import { NextResponse } from "next/server";

export function apiError(
  message: string,
  status: number,
  headers?: HeadersInit,
) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Cache-Control", "private, no-store");
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: responseHeaders,
    },
  );
}

export const unauthorized = () =>
  apiError("Authentication required.", 401);

export const badRequest = (message: string) =>
  apiError(message, 400);

export const unprocessableEntity = (message: string) =>
  apiError(message, 422);

export const notFound = (message: string) =>
  apiError(message, 404);

export const conflict = (message: string) =>
  apiError(message, 409);

export const internalServerError = (message: string) =>
  apiError(message, 500);
