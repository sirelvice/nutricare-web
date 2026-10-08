"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { contactSchema, partnerInquirySchema } from "@/lib/public/inquiry-schema";
import { submitInquiry, type InquiryOutcome } from "@/lib/public/inquiry-client";

const contactFields = [
  { name: "name", label: "Name", max: 160, autoComplete: "name" },
  { name: "email", label: "Email", max: 320, autoComplete: "email" },
  { name: "phone", label: "Phone (optional)", max: 80, autoComplete: "tel" },
];
const partnerFields = [
  { name: "orgName", label: "Organisation", max: 160, autoComplete: "organization" },
  { name: "contactName", label: "Contact name", max: 160, autoComplete: "name" },
  { name: "email", label: "Email", max: 320, autoComplete: "email" },
  { name: "country", label: "Country (optional)", max: 120, autoComplete: "country-name" },
];

export function InquiryForm({ kind }: { kind: "contact" | "partner" }) {
  const fields = kind === "contact" ? contactFields : partnerFields;
  const initialValues = () => Object.fromEntries([...fields.map((field) => [field.name, ""]), ["message", ""], ...(kind === "partner" ? [["interest", "pilot"]] : [])]);
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<InquiryOutcome | null>(null);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const update = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    if (outcome?.type !== "uncertain") setOutcome(null);
  };
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || outcome?.type === "uncertain") return;
    const form = event.currentTarget;
    const parsed = (kind === "contact" ? contactSchema : partnerInquirySchema).safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]);
        next[field] ??= issue.message;
      }
      setErrors(next);
      setOutcome(null);
      form.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }
    busy.current = true;
    setPending(true); setErrors({}); setOutcome(null);
    const requestController = new AbortController();
    controller.current = requestController;
    const result = await submitInquiry(kind, parsed.data, requestController.signal);
    if (!requestController.signal.aborted) {
      setOutcome(result);
      if (result.type === "saved") setValues(initialValues());
      setPending(false);
    }
    busy.current = false;
  }
  return (
    <form aria-label={kind === "contact" ? "Contact NutriCare" : "Partner inquiry"} onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => {
          const id = `${kind}-${field.name}`;
          return <div key={field.name} className="min-w-0 space-y-2">
            <Label htmlFor={id}>{field.label}</Label>
            <Input id={id} name={field.name} type={field.name === "email" ? "email" : field.name === "phone" ? "tel" : "text"}
              autoComplete={field.autoComplete} maxLength={field.max} value={values[field.name]} disabled={pending}
              required={!["phone", "country"].includes(field.name)} aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `${id}-error` : undefined}
              onChange={(event) => update(field.name, event.target.value)} />
            {errors[field.name] && <p id={`${id}-error`} className="text-sm text-destructive">{errors[field.name]}</p>}
          </div>;
        })}
      </div>
      {kind === "partner" && <div className="space-y-2">
        <Label htmlFor="partner-interest">Interested in</Label>
        <select id="partner-interest" name="interest" value={values.interest} disabled={pending} onChange={(event) => update("interest", event.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="pilot">Pilot programme</option><option value="research">Research collaboration</option>
          <option value="integration">Integration</option><option value="donation">Funding / donation</option><option value="other">Other</option>
        </select>
      </div>}
      <div className="space-y-2">
        <Label htmlFor={`${kind}-message`}>Message</Label>
        <textarea id={`${kind}-message`} name="message" required maxLength={5000} disabled={pending} value={values.message}
          onChange={(event) => update("message", event.target.value)} aria-invalid={!!errors.message}
          aria-describedby={`${kind}-message-help${errors.message ? ` ${kind}-message-error` : ""}`}
          className="min-h-32 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" />
        <p id={`${kind}-message-help`} className="text-xs leading-5 text-muted-foreground">{kind === "partner" ? "Add at least 10 characters of context. " : ""}Please avoid including private medical records.</p>
        {errors.message && <p id={`${kind}-message-error`} className="text-sm text-destructive">{errors.message}</p>}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">Your details are saved so the NutriCare team can follow up.</p>
      <Button type="submit" disabled={pending || outcome?.type === "uncertain"}>{pending ? "Submitting..." : kind === "contact" ? "Send message" : "Submit inquiry"}</Button>
      {outcome && <div className="space-y-3">
        <p role={outcome.type === "saved" ? "status" : "alert"} className={`text-sm leading-6 ${outcome.type === "saved" ? "text-foreground" : "text-destructive"}`}>{outcome.message}</p>
        {outcome.type === "uncertain" && <Button type="button" variant="outline" onClick={() => setOutcome(null)}>Allow another attempt</Button>}
      </div>}
    </form>
  );
}
