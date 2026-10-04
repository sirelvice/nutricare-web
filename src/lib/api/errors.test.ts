import { describe, expect, it } from "vitest";
import {
  apiError,
  badRequest,
  conflict,
  internalServerError,
  notFound,
  unauthorized,
  unprocessableEntity,
} from "./errors";

describe("API error helpers", () => {
  it("returns the requested error payload and status", async () => {
    const response = apiError("Something went wrong.", 418);

    expect(response.status).toBe(418);
    await expect(response.json()).resolves.toEqual({
      error: "Something went wrong.",
    });
  });

  it.each([
    [unauthorized, 401, "Authentication required."],
    [badRequest, 400, "Invalid request."],
    [unprocessableEntity, 422, "Cannot process request."],
    [notFound, 404, "Resource not found."],
    [conflict, 409, "Resource conflict."],
    [internalServerError, 500, "Internal server error."],
  ])(
    "returns the correct status for %s",
    async (helper, status, message) => {
      const response = helper(message);

      expect(response.status).toBe(status);
      await expect(response.json()).resolves.toEqual({ error: message });
    },
  );
});
