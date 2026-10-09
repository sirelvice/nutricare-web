export function calcBMIKgM(weightKg: number, heightCm: number) {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || weightKg <= 0 || heightCm <= 0) {
    return null;
  }
  const h = heightCm / 100;
  const bmi = weightKg / (h * h);
  return Number.isFinite(bmi) ? Number(bmi.toFixed(1)) : null;
}

/**
 * WHO adult BMI categories:
 * <18.5 Underweight
 * 18.5–24.9 Normal
 * 25.0–29.9 Overweight
 * 30.0–34.9 Obese Class I
 * 35.0–39.9 Obese Class II
 * >=40  Obese Class III
 */
export function bmiCategoryWHO(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", note: "Below the healthy range." };
  if (bmi < 25) return { label: "Normal", note: "Within the healthy range." };
  if (bmi < 30) return { label: "Overweight", note: "Above the healthy range." };
  if (bmi < 35) return { label: "Obese Class I", note: "Higher risk; gradual lifestyle changes help." };
  if (bmi < 40) return { label: "Obese Class II", note: "Higher risk; consider professional guidance." };
  return { label: "Obese Class III", note: "Highest risk category; seek medical guidance when possible." };
}
