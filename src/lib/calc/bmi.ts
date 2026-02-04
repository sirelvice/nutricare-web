export function calcBMIKgM(weightKg: number, heightCm: number) {
  const h = heightCm / 100;
  const bmi = weightKg / (h * h);
  return Number.isFinite(bmi) ? Number(bmi.toFixed(1)) : null;
}

export function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", note: "May indicate insufficient nutrition." };
  if (bmi < 25) return { label: "Healthy range", note: "Generally associated with lower risk." };
  if (bmi < 30) return { label: "Overweight", note: "Consider gradual improvements in diet and activity." };
  return { label: "Obesity range", note: "Higher risk; consider professional guidance." };
}
