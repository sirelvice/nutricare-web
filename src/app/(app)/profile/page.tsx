"use client";

import { CardExplanation } from "@/components/ui/card-explanation";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getGoalChangeFeedback } from "@/lib/profile/goal-change-errors";
import { profileSchema } from "@/lib/profile/schema";
import type { ActivityLevel } from "@/lib/calc/metabolism";
import type { UserProfile } from "@/lib/profile/domain";
import { emptyProfile, parseProfileDraft, toProfileDraft, type ProfileDraft } from "./profile-form";

const activities: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary: little or no activity" },
  { value: "light", label: "Light: 1 to 3 days a week" },
  { value: "moderate", label: "Moderate: 3 to 5 days a week" },
  { value: "active", label: "Active: 6 to 7 days a week" },
  { value: "very_active", label: "Very active: intense activity or physical work" },
];
const goalLabels = { lose: "Lose weight", maintain: "Maintain weight", gain: "Gain weight" };
class ProfileRequestError extends Error {}

const selectClass = "h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export default function ProfilePage() {
  const [draft, setDraft] = useState<ProfileDraft>(() => toProfileDraft(emptyProfile));
  const [persisted, setPersisted] = useState<UserProfile | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveAction, setSaveAction] = useState<"weight" | "reload" | null>(null);
  const [edited, setEdited] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof ProfileDraft, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const savingGuard = useRef(false);
  const mutation = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoadState("loading");
      try {
        const response = await fetch("/api/profile", {
          signal: controller.signal, cache: "no-store", credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Profile read failed");
        const data: unknown = await response.json();
        const profile = data === null ? null : profileSchema.parse(data);
        if (controller.signal.aborted) return;
        setPersisted(profile);
        setDraft(toProfileDraft(profile ?? emptyProfile));
        setEdited(false);
        setLoadState("ready");
      } catch {
        if (!controller.signal.aborted) setLoadState("error");
      }
    }
    void load();
    return () => controller.abort();
  }, [retry]);

  useEffect(() => () => mutation.current?.abort(), []);

  const parsed = parseProfileDraft(draft);
  const errors: Partial<Record<keyof ProfileDraft, string>> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof ProfileDraft;
      if (field === "heightCm") errors.heightCm = "Enter a height between 80 and 250 cm, or leave it blank.";
      else if (field === "age") errors.age = "Enter a whole number between 10 and 120, or leave it blank.";
      else errors[field] = "Choose one of the available options.";
    }
  }
  function visibleError(field: keyof ProfileDraft) {
    return (submitted || touched[field]) ? errors[field] : undefined;
  }
  function update<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setSaveError("");
    setSaveAction(null);
    setEdited(true);
  }
  function blur(field: keyof ProfileDraft) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loadState !== "ready" || savingGuard.current || saveAction === "reload") return;
    setSubmitted(true);
    if (!parsed.success) {
      setSaveError("Check the highlighted fields before saving.");
      const ids = { heightCm: "height-cm", age: "age-years", gender: "gender", activity: "activity-level", goal: "goal" };
      const field = parsed.error.issues[0]?.path[0] as keyof typeof ids;
      document.getElementById(ids[field])?.focus();
      return;
    }
    savingGuard.current = true;
    setSaving(true);
    setSaved(false);
    setSaveError("");
    const controller = new AbortController();
    mutation.current = controller;
    try {
      const response = await fetch("/api/profile", {
        method: "PUT", signal: controller.signal, credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const feedback = getGoalChangeFeedback(response.status, await response.json().catch(() => null));
        if (feedback) {
          setSaveAction(feedback.code === "GOAL_CHANGE_CONFLICT" ? "reload"
            : feedback.code === "GOAL_CHANGE_WEIGHT_REQUIRED" ? "weight" : null);
          throw new ProfileRequestError(feedback.message);
        }
        throw new ProfileRequestError(response.status === 401
          ? "Your session has expired. Sign in again before saving."
          : "We could not save your profile. Your changes are still here. Please try again.");
      }
      const profile = profileSchema.parse(await response.json());
      if (controller.signal.aborted) return;
      setPersisted(profile);
      setDraft(toProfileDraft(profile));
      setEdited(false);
      setSaved(true);
      setSaveAction(null);
      setSubmitted(false);
      setTouched({});
    } catch (error) {
      if (!controller.signal.aborted) {
        setSaveError(error instanceof ProfileRequestError
          ? error.message
          : "We could not confirm the save. Your changes are still here. Check your saved profile before trying again.");
      }
    } finally {
      savingGuard.current = false;
      if (!controller.signal.aborted) setSaving(false);
    }
  }

  const goalChanged = persisted !== null && draft.goal !== persisted.goal;
  const disabled = loadState !== "ready" || saving || saveAction === "reload";

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Personal settings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Your profile</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Set the details used for your nutrition plan.
        </p>
      </header>

      {loadState === "loading" && (
        <div role="status" className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Loading your profile...
        </div>
      )}
      {loadState === "error" && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <p role="alert" className="text-sm text-destructive">Unable to load your profile. Try again before making changes.</p>
          <Button type="button" variant="outline" className="mt-3 min-h-11" onClick={() => setRetry((value) => value + 1)}>
            <RotateCcw className="size-4" aria-hidden="true" /> Try again
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <Card className="min-w-0 shadow-none">
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg">Your details</CardTitle>
              {loadState === "ready" && (
                <span className="text-xs text-muted-foreground">
                  {edited ? "Unsaved changes" : persisted ? "Saved profile" : "New profile"}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form noValidate onSubmit={onSave} aria-label="Profile details" aria-busy={saving}>
              <fieldset disabled={disabled} className="min-w-0 space-y-5">
                <legend className="mb-4 text-sm font-semibold">About you</legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="height-cm">Height (cm)</Label>
                    <Input id="height-cm" inputMode="decimal" className="h-11 rounded-xl"
                      value={draft.heightCm} onChange={(event) => update("heightCm", event.target.value)}
                      onBlur={() => blur("heightCm")} aria-invalid={!!visibleError("heightCm")}
                      aria-describedby={`height-hint${visibleError("heightCm") ? " height-error" : ""}`} />
                    <p id="height-hint" className="text-xs leading-5 text-muted-foreground">Optional. 80 to 250 cm.</p>
                    {visibleError("heightCm") && <p id="height-error" className="text-xs leading-5 text-destructive">{visibleError("heightCm")}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age-years">Age (years)</Label>
                    <Input id="age-years" inputMode="numeric" className="h-11 rounded-xl"
                      value={draft.age} onChange={(event) => update("age", event.target.value)}
                      onBlur={() => blur("age")} aria-invalid={!!visibleError("age")}
                      aria-describedby={`age-hint${visibleError("age") ? " age-error" : ""}`} />
                    <p id="age-hint" className="text-xs leading-5 text-muted-foreground">Optional. Whole years, 10 to 120.</p>
                    {visibleError("age") && <p id="age-error" className="text-xs leading-5 text-destructive">{visibleError("age")}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select id="gender" value={draft.gender} className={selectClass}
                    onChange={(event) => update("gender", event.target.value as UserProfile["gender"])}
                    aria-describedby="gender-hint">
                    <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>
                  <p id="gender-hint" className="text-xs leading-5 text-muted-foreground">Other uses an averaged energy estimate.</p>
                </div>
              </fieldset>

              <fieldset disabled={disabled} className="mt-6 min-w-0 space-y-5 border-t pt-6">
                <legend className="px-0 text-sm font-semibold">Your routine and goal</legend>
                <div className="space-y-2">
                  <Label htmlFor="activity-level">Activity level</Label>
                  <select id="activity-level" className={selectClass} value={draft.activity}
                    onChange={(event) => update("activity", event.target.value as ActivityLevel)} aria-describedby="activity-hint">
                    {activities.map((activity) => <option key={activity.value} value={activity.value}>{activity.label}</option>)}
                  </select>
                  <p id="activity-hint" className="text-xs leading-5 text-muted-foreground">Match your usual week.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal">Your goal</Label>
                  <select id="goal" value={draft.goal} className={selectClass}
                    onChange={(event) => update("goal", event.target.value as UserProfile["goal"])}>
                    {Object.entries(goalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                {goalChanged && (
                  <div className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm leading-6">
                    <p className="font-medium">Changing your saved goal creates a new nutrition plan.</p>
                    <p className="mt-1 text-muted-foreground">You need height, age and a recorded weight. Earlier plans and progress stay in your history.</p>
                  </div>
                )}
              </fieldset>

              <div className="mt-6 space-y-4 border-t pt-5">
                {saveError && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm leading-6 text-destructive">{saveError}</p>}
                {saveAction === "weight" && <Link href="/tools/tracking/weight" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Record your weight</Link>}
                {saveAction === "reload" && <div className="space-y-2">
                  <p className="text-xs leading-5 text-muted-foreground">Reloading replaces your unsaved edits with the saved profile.</p>
                  <Button type="button" variant="outline" className="min-h-11" onClick={() => {
                    setSaveAction(null); setSaveError(""); setSaved(false);
                    setTouched({}); setSubmitted(false); setLoadState("loading");
                    setRetry((value) => value + 1);
                  }}>Reload saved profile</Button>
                </div>}
                {saved && <p role="status" className="flex items-center gap-2 text-sm text-primary"><CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />Profile saved.</p>}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button type="submit" disabled={disabled} className="min-h-11 sm:min-w-36">
                    {saving ? "Saving..." : "Save profile"}
                  </Button>
                  {saved && <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Continue to dashboard <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-4" aria-label="About your profile">
          <p className="px-1 text-sm leading-6 text-muted-foreground">You can save now and finish setup later.</p>
          <CardExplanation label="How your profile shapes your plan">
            <p>Your details inform your energy estimate. Your goal guides the plan.</p>
            <p>Add height, age and a weight entry before generating your first plan.</p>
            <p>After changing other details, recalculate your plan to refresh its targets.</p>
          </CardExplanation>
          {persisted && <p className="px-1 text-xs leading-5 text-muted-foreground">Saved goal: {goalLabels[persisted.goal]}. Changes apply when you save.</p>}
        </aside>
      </div>
    </div>
  );
}
