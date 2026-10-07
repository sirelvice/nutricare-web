"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { readGuidanceProgress, type GuidanceProgress } from "@/lib/reco/progress-client";

// The parent keys this component by plan ID so a new plan cannot display
// the previous plan's progress while its request is in flight.
export function ProgressGuidance({ planId }: { planId: string }) {
  const [result, setResult] = useState<GuidanceProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    readGuidanceProgress(planId, controller.signal).then((value) => {
      if (!controller.signal.aborted) setResult(value);
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [planId, revision]);

  return <section aria-label="Progress guidance"><Card><CardContent className="space-y-3 p-5">
    <h2 className="text-lg font-semibold">Your progress</h2>
    {loading ? <p role="status" className="text-sm text-muted-foreground">Loading progress context...</p>
      : failed ? <><p role="status" className="text-sm text-muted-foreground">Progress is temporarily unavailable. Your other guidance is still available.</p>
        <Button variant="outline" onClick={() => { setLoading(true); setFailed(false); setResult(null); setRevision((value) => value + 1); }}>Retry progress</Button></>
      : result?.kind === "available" ? <>
        <p className="font-medium">{result.progress.evaluation.headline}</p>
        <p className="text-sm leading-6 text-muted-foreground">{result.progress.evaluation.summary}</p>
        {result.progress.recommendation.adjustmentDecision === "PENDING"
          ? <p className="text-sm leading-6">{result.progress.recommendation.message}</p>
          : <p className="text-sm leading-6">{result.progress.recommendation.adjustmentDecision === "ACCEPTED"
            ? "The adjustment recorded in this evaluation was accepted. Review your current plan before making another change."
            : "You chose to keep your plan. Review the recorded decision and continue tracking."}</p>}
        <p className="text-xs text-muted-foreground">Last evaluated: {result.progress.evaluation.evaluatedAt.slice(0, 10)}. This evaluation may not include your latest measurement.</p>
      </> : <p className="text-sm leading-6 text-muted-foreground">{result?.kind === "outdated"
        ? "Your plan changed while guidance was loading. Refresh your guidance to see the matching progress."
        : "There is no recorded evaluation for this plan yet. Keep recording measurements to build your history."}</p>}
    {!loading && !failed && result?.kind === "available" ? <Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">Review progress on your dashboard</Link> : null}
  </CardContent></Card></section>;
}
