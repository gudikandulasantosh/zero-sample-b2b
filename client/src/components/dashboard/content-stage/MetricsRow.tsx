import { AlertTriangle, BarChart3, Clock3, Layers } from "lucide-react";

import type { VtoResponse } from "../types";

type MetricsRowProps = {
  archetypeCount: number;
  vtoResult: VtoResponse | null;
};

export default function MetricsRow({ archetypeCount, vtoResult }: MetricsRowProps) {
  const metrics = [
    {
      label: "Archetypes Simulated",
      value: archetypeCount,
      note: "Batch ready",
      icon: Layers,
    },
    {
      label: "Target Harmony",
      value: vtoResult ? `${vtoResult.harmony_score}%` : "84%",
      note: vtoResult ? vtoResult.fit_status : "Across active region",
      icon: BarChart3,
    },
    {
      label: "Risk Alerts",
      value: "2",
      note: "Needs review",
      icon: AlertTriangle,
    },
    {
      label: "Model Freshness",
      value: "12h",
      note: "Last sync",
      icon: Clock3,
    },
  ];

  return (
    <div className="metrics-row">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <article className="metric-card" key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.note}</span>
            <Icon size={16} />
          </article>
        );
      })}
    </div>
  );
}
