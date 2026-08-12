import type { RecommendationTarget } from "./types";

type MetricBarProps = {
  label: string;
  value: number;
  suffix?: string;
  hint: string;
};

function MetricBar({ label, value, suffix = "", hint }: MetricBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="skin-metric">
      <div className="skin-metric-head">
        <span>{label}</span>
        <strong>
          {Math.round(value)}
          {suffix}
        </strong>
      </div>
      <div className="skin-metric-track">
        <div className="skin-metric-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="skin-metric-hint">{hint}</p>
    </div>
  );
}

type SkinMetricsProps = {
  target: RecommendationTarget;
  rationale: string[];
  provider?: string;
};

export default function SkinMetrics({ target, rationale, provider }: SkinMetricsProps) {
  const { metrics } = target;
  // ITA° spans roughly -60..70; map to 0-100 for the bar.
  const itaPct = ((metrics.ita + 60) / 130) * 100;

  return (
    <section className="skin-report">
      <div className="skin-report-head">
        <div>
          <p className="stage-kicker">Step 1 · Skin AI Analysis</p>
          <h3>
            {target.toneBand} tone · <span className="skin-undertone">{metrics.undertone} undertone</span>
          </h3>
        </div>
        {provider ? <span className={`provider-pill provider-${provider}`}>{provider}</span> : null}
      </div>

      <div className="skin-metric-grid">
        <MetricBar label="ITA°" value={itaPct} hint={`Individual Typology Angle ${Math.round(metrics.ita)}°`} />
        <MetricBar label="Oiliness" value={metrics.oiliness} hint="Facial shine / radiance" />
        <MetricBar label="Redness" value={metrics.redness} hint="Vascular reactivity" />
        <MetricBar label="Texture" value={metrics.texture} hint="Surface texture / pores" />
      </div>

      <div className="skin-target-chips">
        <span className="target-chip">Sheen · {target.sheen}</span>
        <span className="target-chip">Drape · {target.drape}</span>
        <span className="target-chip">Texture · {target.surfaceTexture}</span>
        <span className="target-chip">Palette · {target.palette}</span>
      </div>

      <ul className="skin-rationale">
        {rationale.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </section>
  );
}
