"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CartesianGrid, LineChart, Line, Tooltip, XAxis, YAxis } from "recharts";
import type { WeightEntry } from "@/lib/tracking/domain";
import { buildWeightChartData, type WeightChartPeriod, type WeightChartPoint } from "./weight-chart-data";

const DAY = 86_400_000;
const dateLabel = (timestamp: number, full = false) => new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", ...(full ? { year: "numeric" as const } : {}), timeZone: "UTC",
}).format(new Date(timestamp));

function MeasurementTooltip({ active, payload }: {
  active?: boolean;
  payload?: readonly { payload?: WeightChartPoint }[];
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return <div className="max-w-[min(16rem,70vw)] space-y-2 rounded-xl border bg-card p-3 text-xs text-card-foreground shadow-sm">
    <p className="font-semibold">{dateLabel(point.timestamp, true)}</p>
    <p>Daily average: {point.average.toFixed(1)} kg</p>
    <p>7-day trend: {point.trend.toFixed(1)} kg</p>
    <p>{point.count} {point.count === 1 ? "measurement" : "measurements"}{point.count > 1 ? ` · ${point.minimum.toFixed(1)} to ${point.maximum.toFixed(1)} kg` : ""}</p>
  </div>;
}

export default function WeightHistoryChart({ entries }: { entries: WeightEntry[] }) {
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [period, setPeriod] = useState<WeightChartPeriod>("all");
  const series = useMemo(() => buildWeightChartData(entries, period), [entries, period]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    function measure(bounds: { width: number; height: number }) {
      const width = Math.floor(bounds.width);
      const height = Math.floor(bounds.height);
      setSize((current) => current.width === width && current.height === height ? current : { width, height });
    }
    measure(element.getBoundingClientRect());
    const observer = new ResizeObserver(([entry]) => { if (entry) measure(entry.contentRect); });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const first = series.points[0];
  const last = series.points[series.points.length - 1];
  return <div className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">{series.measurements} measurements · {series.points.length} recorded {series.points.length === 1 ? "day" : "days"}</p>
      <label className="flex min-h-11 items-center gap-2 text-xs text-muted-foreground">Chart period
        <select aria-label="Weight chart period" value={period} onChange={(event) => setPeriod(event.target.value as WeightChartPeriod)} className="min-h-11 rounded-lg border bg-background px-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="all">All recorded dates</option><option value="30">Latest 30 days</option><option value="90">Latest 90 days</option>
        </select>
      </label>
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-2"><span aria-hidden="true" className="w-5 border-t-2 border-primary" />Daily average</span>
      <span className="flex items-center gap-2"><span aria-hidden="true" className="w-5 border-t-2 border-dashed border-accent" />7-day trend</span>
    </div>
    <div ref={container} className="h-36 min-w-0" aria-hidden="true" data-weight-chart-days={series.points.length}>
      {size.width > 0 && size.height > 0 && first && last ? <LineChart accessibilityLayer={false} width={size.width} height={size.height} data={series.points} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" type="number" scale="time" domain={[first.timestamp - DAY / 2, last.timestamp + DAY / 2]}
          tickCount={size.width < 400 ? 3 : 5} tickFormatter={(value) => dateLabel(Number(value))} tickLine={false} axisLine={false} minTickGap={40}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
        <YAxis width={38} domain={series.domain} tickCount={4} tickFormatter={(value) => String(Number(value).toFixed(1))} tickLine={false} axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
        <Tooltip content={<MeasurementTooltip />} />
        <Line name="Daily average" type="linear" dataKey="average" stroke="var(--primary)" strokeWidth={2}
          dot={series.points.length <= 30 ? { r: 3, fill: "var(--primary)" } : false} activeDot={{ r: 4 }} isAnimationActive={false} />
        <Line name="7-day trend" type="linear" dataKey="trend" stroke="var(--accent)" strokeWidth={2} strokeDasharray="4 4" dot={series.points.length === 1 ? { r: 3 } : false} activeDot={false} isAnimationActive={false} />
      </LineChart> : null}
    </div>
    {first && last ? <p className="text-xs text-muted-foreground">{dateLabel(first.timestamp, true)}{first.date !== last.date ? ` to ${dateLabel(last.timestamp, true)}` : ""} · Weight in kg</p> : null}
  </div>;
}
