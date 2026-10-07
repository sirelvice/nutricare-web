"use client";

import { useEffect, useRef, useState } from "react";
import { LineChart, Line, Tooltip, XAxis, YAxis } from "recharts";
import type { WeightEntry } from "@/lib/tracking/domain";

const day = 24 * 60 * 60 * 1000;
const dateLabel = (timestamp: number) => new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", timeZone: "UTC",
}).format(new Date(timestamp));

export default function WeightHistoryChart({ entries }: { entries: WeightEntry[] }) {
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    function measure(bounds: { width: number; height: number }) {
      const width = Math.floor(bounds.width);
      const height = Math.floor(bounds.height);
      setSize((current) => current.width === width && current.height === height
        ? current : { width, height });
    }
    measure(element.getBoundingClientRect());
    const observer = new ResizeObserver(([entry]) => {
      if (entry) measure(entry.contentRect);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const data = entries.map((entry) => ({
    timestamp: Date.parse(`${entry.date}T00:00:00Z`),
    weight: entry.weightKg,
  }));
  return (
    <div ref={container} className="h-40 min-w-0" aria-hidden="true">
      {size.width > 0 && size.height > 0 && (
        <LineChart accessibilityLayer={false} width={size.width} height={size.height} data={data} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
          <XAxis
            dataKey="timestamp" type="number" scale="time"
            domain={[(minimum: number) => minimum - day, (maximum: number) => maximum + day]}
            tickFormatter={dateLabel} tickLine={false} axisLine={false}
            minTickGap={32} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
          <Tooltip
            labelFormatter={(value) => dateLabel(Number(value))}
            formatter={(value) => [`${value} kg`, "Weight"]}
            contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: "var(--radius)", color: "var(--foreground)" }}
          />
          <Line type="linear" dataKey="weight" stroke="var(--primary)" strokeWidth={2}
            dot={{ r: 3, fill: "var(--primary)" }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      )}
    </div>
  );
}
