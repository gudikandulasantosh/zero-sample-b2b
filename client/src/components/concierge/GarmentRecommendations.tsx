import { Loader2, Sparkles } from "lucide-react";

import type { GarmentPreset } from "./types";

type GarmentRecommendationsProps = {
  recommendations: GarmentPreset[];
  topMatchId?: string;
  renderingPresetId: string;
  onRender: (preset: GarmentPreset) => void;
};

export default function GarmentRecommendations({
  recommendations,
  topMatchId,
  renderingPresetId,
  onRender,
}: GarmentRecommendationsProps) {
  return (
    <section className="garment-block">
      <p className="stage-kicker">Step 2 · Recommended Wardrobe</p>
      <div className="garment-grid">
        {recommendations.map((preset) => {
          const isTop = preset.id === topMatchId;
          const isRendering = renderingPresetId === preset.id;
          return (
            <article key={preset.id} className={`garment-card${isTop ? " garment-card-top" : ""}`}>
              {isTop ? (
                <span className="garment-top-badge">
                  <Sparkles size={12} /> Best match
                </span>
              ) : null}
              <div className="garment-swatch" style={{ background: preset.colorHex }}>
                <img src={preset.refImageUrl} alt={preset.name} loading="lazy" />
              </div>
              <div className="garment-body">
                <strong>{preset.name}</strong>
                <span className="garment-fabric">{preset.fabric}</span>
                <div className="garment-attrs">
                  <span>{preset.sheen}</span>
                  <span>{preset.drape}</span>
                  <span>{preset.surfaceTexture}</span>
                </div>
                <div className="garment-foot">
                  {typeof preset.matchScore === "number" ? (
                    <span className="garment-score">{preset.matchScore}% match</span>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    className="garment-try-btn"
                    disabled={Boolean(renderingPresetId)}
                    onClick={() => onRender(preset)}
                  >
                    {isRendering ? <Loader2 size={14} className="spin" /> : null}
                    {isRendering ? "Rendering" : "Try on"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
