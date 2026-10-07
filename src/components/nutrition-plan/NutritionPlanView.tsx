"use client";

import Link from "next/link";
import { CardExplanation } from "@/components/ui/card-explanation";
import { Button } from "@/components/ui/button";
import { useNutritionPlan } from "@/components/nutrition-plan/useNutritionPlan";

const goals = { lose: "Lose weight", maintain: "Maintain weight", gain: "Gain weight" };

export function NutritionPlanView({ view }: { view: "calories" | "macros" }) {
  const { state, generating, failure, saved, reload, generate, generationBlocked } = useNutritionPlan();
  const calories = view === "calories";
  const plan = state.status === "ready" ? state.plan : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-primary">Nutrition tools</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{calories ? "Calories" : "Macros"}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {calories ? "Your daily energy target, based on your profile and latest weight." : "Your daily protein, carbohydrate and fat targets from your current plan."}
          </p>
        </div>
        <Button asChild variant="outline" className="min-h-11 shrink-0">
          <Link href={calories ? "/tools/macros" : "/tools/calories"}>
            {calories ? "View macro targets" : "View calorie target"}
          </Link>
        </Button>
      </header>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
        <section aria-labelledby="current-plan-heading" className="min-w-0 rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
            <div>
              <h2 id="current-plan-heading" className="text-lg font-semibold">Current nutrition plan</h2>
            </div>
            {plan ? <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5 text-muted-foreground">
              <span>Goal: {goals[plan.goal]}</span>
              <span>{calories ? `Version ${plan.version}` : `Plan v${plan.version}`}</span>
            </div> : null}
          </div>

          <div className="space-y-6 p-5 sm:p-6" aria-busy={state.status === "loading" || generating}>
            {state.status === "loading" ? <div role="status" className="space-y-3 py-5">
              <p className="text-sm text-muted-foreground">Loading your nutrition plan...</p>
              <div aria-hidden="true" className="h-20 rounded-xl bg-muted motion-safe:animate-pulse" />
            </div> : state.status === "error" ? <div className="space-y-4 py-2">
              <p role="alert" className="text-sm leading-6 text-destructive">Unable to load your nutrition plan. Try again before making changes.</p>
              <Button onClick={() => void reload()} variant="outline" className="min-h-11">Try again</Button>
            </div> : <>
              {failure ? <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <p role="alert" className="text-sm leading-6 text-destructive">
                  {failure === "prerequisites"
                    ? "Add your height and age to your profile and record your current weight before generating a plan."
                    : failure === "conflict"
                      ? "Your nutrition plan changed while this request was being processed. Reload your current plan before trying again."
                      : "We could not confirm whether your plan was saved. Reload your current plan before trying again."}
                </p>
                {generationBlocked ? <Button onClick={() => void reload()} variant="outline" className="min-h-11">Reload current plan</Button> : <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  <Link className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4" href="/profile">Edit profile</Link>
                  <Link className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4" href="/tools/tracking/weight">Record weight</Link>
                </div>}
              </div> : null}
              {saved ? <p role="status" className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary">Nutrition plan saved.</p> : null}

              {plan ? <>
                {calories ? <div className="rounded-xl bg-primary/5 p-5 sm:p-6">
                  <h3 className="text-sm font-medium text-muted-foreground">Daily calorie target</h3>
                  <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <span className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{plan.targetCalories}</span>
                    <span className="text-sm text-muted-foreground">kcal/day</span>
                  </div>
                </div> : <p className="text-sm text-muted-foreground">{plan.targetCalories} kcal/day</p>}
                <div>
                  <h3 className="text-sm font-semibold">{calories ? "Macronutrient targets" : "Daily macro targets"}</h3>
                  <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      { label: "Protein", amount: plan.proteinG },
                      { label: "Carbohydrates", amount: plan.carbsG },
                      { label: "Fat", amount: plan.fatG },
                    ].map(({ label, amount }) => <div key={label} className="min-w-0 rounded-xl border p-4">
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="mt-2 flex flex-wrap items-baseline gap-1.5">
                        <span className="text-2xl font-semibold tracking-tight tabular-nums">{calories ? `${amount}g` : amount}</span>
                        <span className="text-xs text-muted-foreground">{calories ? "per day" : "g/day"}</span>
                      </dd>
                    </div>)}
                  </dl>
                </div>
              </> : <div className="py-3">
                <h3 className="text-base font-semibold">No nutrition plan yet</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Complete your profile and log your current weight before generating a personalised nutrition plan.</p>
              </div>}

              {calories ? <div className="space-y-4 border-t pt-5">
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  {plan ? "Recalculating creates a new plan version using your current profile and latest weight." : "Each plan is saved so you can review its targets later."}
                </p>
                <Button onClick={() => void generate()} disabled={generating || generationBlocked} className="min-h-11 w-full sm:w-auto">
                  {generating ? (plan ? "Updating plan..." : "Generating plan...") : (plan ? "Recalculate plan" : "Generate nutrition plan")}
                </Button>
              </div> : !plan ? <Button asChild className="min-h-11 w-full sm:w-auto"><Link href="/tools/calories">Generate nutrition plan</Link></Button> : null}
            </>}
          </div>
        </section>

        <aside aria-label="About your nutrition plan" className="space-y-4">
          <CardExplanation label="About these targets">
            <p>These targets are estimates based on your current profile and weight.</p>
            <p>Your plan may be updated as your goals and progress change.</p>
          </CardExplanation>
          <nav aria-label="Plan options" className="flex flex-col rounded-xl border bg-card px-4 py-3 text-sm">
            <Link href="/profile" className="inline-flex min-h-11 items-center font-medium text-primary hover:underline">Edit profile</Link>
            <Link href="/tools/tracking/weight" className="inline-flex min-h-11 items-center font-medium text-primary hover:underline">Record weight</Link>
            <Link href="/history" className="inline-flex min-h-11 items-center font-medium text-primary hover:underline">View history</Link>
          </nav>
        </aside>
      </div>
    </div>
  );
}
