"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NutritionPlan } from "@/lib/nutrition-plan/domain";
import {
  createNutritionPlan,
  PlanRequestError,
  readNutritionPlan,
  type PlanRequestFailure,
} from "@/lib/nutrition-plan/client";

type PlanState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; plan: NutritionPlan | null };

export function useNutritionPlan() {
  const [state, setState] = useState<PlanState>({ status: "loading" });
  const [generating, setGenerating] = useState(false);
  const [failure, setFailure] = useState<PlanRequestFailure | null>(null);
  const [saved, setSaved] = useState(false);
  const [generationBlocked, setGenerationBlocked] = useState(false);
  const readController = useRef<AbortController | null>(null);
  const writeController = useRef<AbortController | null>(null);
  const requiresReload = useRef(false);

  const reload = useCallback(async () => {
    if (writeController.current) return;
    readController.current?.abort();
    const controller = new AbortController();
    readController.current = controller;
    setState({ status: "loading" });
    setSaved(false);

    try {
      const plan = await readNutritionPlan(controller.signal);
      if (controller.signal.aborted) return;
      requiresReload.current = false;
      setGenerationBlocked(false);
      setFailure(null);
      setState({ status: "ready", plan });
    } catch {
      if (!controller.signal.aborted) setState({ status: "error" });
    } finally {
      if (readController.current === controller) readController.current = null;
    }
  }, []);

  useEffect(() => {
    void reload();
    return () => {
      readController.current?.abort();
      writeController.current?.abort();
    };
  }, [reload]);

  async function generate() {
    // Synchronous guard also prevents repeated activation before React renders.
    if (state.status !== "ready" || writeController.current || requiresReload.current) return;
    readController.current?.abort();
    const controller = new AbortController();
    writeController.current = controller;
    setGenerating(true);
    setFailure(null);
    setSaved(false);

    try {
      const plan = await createNutritionPlan(controller.signal);
      if (controller.signal.aborted) return;
      setState({ status: "ready", plan });
      setSaved(true);
    } catch (error) {
      if (controller.signal.aborted) return;
      const kind = error instanceof PlanRequestError ? error.kind : "uncertain";
      requiresReload.current = kind !== "prerequisites";
      setGenerationBlocked(kind !== "prerequisites");
      setFailure(kind);
    } finally {
      if (writeController.current === controller) writeController.current = null;
      if (!controller.signal.aborted) setGenerating(false);
    }
  }

  return { state, generating, failure, saved, reload, generate,
    generationBlocked };
}
