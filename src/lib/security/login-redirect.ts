const VALIDATION_ORIGIN = "https://nutricare.invalid";

export function isSafeLoginPath(value: string): boolean {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  ) {
    return false;
  }

  try {
    return new URL(value, VALIDATION_ORIGIN).origin === VALIDATION_ORIGIN;
  } catch {
    return false;
  }
}
