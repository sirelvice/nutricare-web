export type BMIDraft = { height: string; weight: string };
export type BMIField = keyof BMIDraft;
export type BMIErrors = Partial<Record<BMIField, string>>;

type BMIValidation =
  | { ok: true; heightCm: number; weightKg: number }
  | { ok: false; errors: BMIErrors };

function measurement(value: string, label: string, unit: string, min: number, max: number) {
  const text = value.trim();
  if (!text) return { error: `Enter your ${label.toLowerCase()} in ${unit}.` };
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) {
    return { error: `Enter a number between ${min} and ${max} ${unit}.` };
  }
  const number = Number(text);
  if (!Number.isFinite(number) || number < min || number > max) {
    return { error: `Enter a number between ${min} and ${max} ${unit}.` };
  }
  return { number };
}

export function validateBMIDraft(draft: BMIDraft): BMIValidation {
  const height = measurement(draft.height, "Height", "cm", 80, 250);
  const weight = measurement(draft.weight, "Weight", "kg", 20, 350);
  if (height.number === undefined || weight.number === undefined) {
    return { ok: false, errors: {
      ...(height.error ? { height: height.error } : {}),
      ...(weight.error ? { weight: weight.error } : {}),
    } };
  }
  return { ok: true, heightCm: height.number, weightKg: weight.number };
}
