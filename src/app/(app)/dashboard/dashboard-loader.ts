import { readNutritionPlan, PlanRequestError } from "@/lib/nutrition-plan/client";
import type { UserProfile } from "@/lib/profile/domain";
import type { WeightEntry } from "@/lib/tracking/domain";
import type { GetRecommendationsService } from "@/lib/reco/service";
import type { CurrentProgressResult } from "@/lib/progress/get-current-progress-service";

export type DashboardRecommendations = NonNullable<
  Awaited<ReturnType<GetRecommendationsService["execute"]>>
>;

export type OptionalDashboardResult<T> =
  | { status: "ready"; data: T }
  | { status: "empty" }
  | { status: "error" };

const requestOptions = (signal: AbortSignal): RequestInit => ({
  signal,
  cache: "no-store",
  credentials: "same-origin",
});

async function readRequired<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(path, requestOptions(signal));
  if (!response.ok) throw new Error("Unable to load your dashboard data.");
  return response.json();
}

export async function loadDashboardCore(signal: AbortSignal) {
  const [profile, weightEntries, planResponse] = await Promise.all([
    readRequired<UserProfile | null>("/api/profile", signal),
    readRequired<WeightEntry[]>("/api/weight-entries", signal),
    readNutritionPlan(signal).then((plan) => ({ plan })).catch((error: unknown) => {
      if (error instanceof PlanRequestError && (error.kind === "age-required" || error.kind === "age-unsupported")) return { plan: null };
      throw error;
    }),
  ]);

  if (
    (profile !== null && (typeof profile !== "object" || Array.isArray(profile))) ||
    !Array.isArray(weightEntries) ||
    !planResponse ||
    typeof planResponse !== "object" ||
    !("plan" in planResponse)
  ) {
    throw new Error("Unable to load your dashboard data.");
  }

  return { profile, weightEntries, nutritionPlan: planResponse.plan };
}

async function readOptional<T>(
  path: string,
  emptyStatus: number,
  signal: AbortSignal,
): Promise<OptionalDashboardResult<T>> {
  try {
    const response = await fetch(path, requestOptions(signal));
    if (response.status === emptyStatus) return { status: "empty" };
    if (!response.ok) return { status: "error" };
    return { status: "ready", data: await response.json() };
  } catch (error) {
    if (signal.aborted) throw error;
    return { status: "error" };
  }
}

export async function loadDashboardRecommendations(signal: AbortSignal) {
  const result = await readOptional<DashboardRecommendations>(
    "/api/recommendations", 422, signal,
  );
  if (
    result.status === "ready" &&
    (!result.data || typeof result.data !== "object" ||
      !Number.isFinite(result.data.bmi) ||
      typeof result.data.category?.label !== "string" ||
      typeof result.data.recommendations?.summary !== "string")
  ) {
    return { status: "error" } as const;
  }
  return result;
}

export async function loadDashboardProgress(signal: AbortSignal) {
  const result = await readOptional<{ progress: CurrentProgressResult }>(
    "/api/progress", 404, signal,
  );
  if (result.status !== "ready") return result;
  if (!result.data?.progress?.evaluation || !result.data.progress.recommendation) {
    return { status: "error" } as const;
  }
  return { status: "ready", data: result.data.progress } as const;
}
