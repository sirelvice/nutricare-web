"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { calcBMIKgM, bmiCategoryWHO } from "@/lib/calc/bmi";
import { validateBMIDraft, type BMIDraft, type BMIField, type BMIErrors } from "./bmi-form";

type BMIResult = { bmi: number; category: ReturnType<typeof bmiCategoryWHO> };

export default function BMIPage() {
  const [draft, setDraft] = useState<BMIDraft>({ height: "", weight: "" });
  const [touched, setTouched] = useState<Partial<Record<BMIField, boolean>>>({});
  const [result, setResult] = useState<BMIResult | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const validation = validateBMIDraft(draft);
  const errors: BMIErrors = validation.ok ? {} : validation.errors;

  function update(field: BMIField, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    if (result) setAnnouncement("Measurements changed. Calculate BMI again.");
    setResult(null);
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ height: true, weight: true });
    if (!validation.ok) {
      setResult(null);
      const field = validation.errors.height ? "height" : "weight";
      const input = form.current?.elements.namedItem(field);
      if (input instanceof HTMLInputElement) input.focus();
      return;
    }
    const bmi = calcBMIKgM(validation.weightKg, validation.heightCm);
    if (bmi === null) return;
    const category = bmiCategoryWHO(bmi);
    setResult({ bmi, category });
    setAnnouncement(`Your BMI is ${bmi.toFixed(1)}. Adult screening category: ${category.label}.`);
  }

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <p className="text-xs font-medium text-primary">Nutrition tools</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">BMI Calculator</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Calculate your body mass index from your height and weight, then review its general screening category.</p>
      </header>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <form ref={form} aria-labelledby="bmi-form-heading" onSubmit={calculate} noValidate className="min-w-0 rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-5 sm:p-6">
            <h2 id="bmi-form-heading" className="text-lg font-semibold">Enter your details</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Use your current height and weight for the calculation.</p>
          </div>
          <div className="space-y-6 p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                { field: "height" as const, label: "Height (cm)", placeholder: "e.g. 172", hint: "Enter a value between 80 and 250 cm." },
                { field: "weight" as const, label: "Weight (kg)", placeholder: "e.g. 70", hint: "Enter a value between 20 and 350 kg." },
              ].map(({ field, label, placeholder, hint }) => {
                const error = touched[field] ? errors[field] : undefined;
                return <div key={field} className="space-y-2">
                  <Label htmlFor={field}>{label}</Label>
                  <Input id={field} name={field} type="text" inputMode="decimal" value={draft[field]} placeholder={placeholder}
                    onChange={(event) => update(field, event.target.value)}
                    onBlur={() => setTouched((current) => ({ ...current, [field]: true }))}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={`${field}-hint${error ? ` ${field}-error` : ""}`}
                    className="h-11" />
                  <p id={`${field}-hint`} className="text-xs leading-5 text-muted-foreground">{hint}</p>
                  {error ? <p id={`${field}-error`} className="text-sm text-destructive">{error}</p> : null}
                </div>;
              })}
            </div>
            <div className="space-y-4 border-t pt-5">
              <p className="text-sm leading-6 text-muted-foreground">This calculator uses adult BMI categories.</p>
              <Button type="submit" className="min-h-11 w-full sm:w-auto">Calculate BMI</Button>
            </div>
          </div>
        </form>

        <section aria-labelledby="bmi-result-heading" className="min-w-0 rounded-2xl border bg-card p-5 sm:p-6">
          <h2 id="bmi-result-heading" className="text-lg font-semibold">Your result</h2>
          <p role="status" aria-atomic="true" className="sr-only">{announcement}</p>
          {result ? <div className="mt-5 space-y-5">
            <div className="rounded-xl bg-primary/5 p-5">
              <p className="text-sm text-muted-foreground">Body mass index</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight tabular-nums">{result.bmi.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">BMI</span>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Adult screening category</p>
              <p className="mt-1 text-sm font-semibold">{result.category.label}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">What this means</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.category.note}</p>
            </div>
          </div> : <div className="mt-4 rounded-xl bg-muted/50 p-4">
            <p className="text-sm font-medium">Your result will appear here.</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Enter your height and weight above, then calculate your BMI.</p>
          </div>}
          <p className="mt-5 border-t pt-4 text-xs leading-5 text-muted-foreground">BMI is a screening tool and does not capture all health factors. It should not be used as a diagnosis.</p>
        </section>
      </div>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl leading-6">This calculation stays on this page. To save a measurement, record your weight.</p>
        <Link href="/tools/tracking/weight" className="inline-flex min-h-11 shrink-0 items-center font-medium text-primary hover:underline">Record weight</Link>
      </div>
    </div>
  );
}
