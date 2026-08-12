// Deterministic rules engine that maps quantitative skin metrics from YouCam Skin
// Analysis onto the tactile / optical / structural attributes of garment fabrics,
// then ranks the pre-hosted cloth-v3 presets. No API calls, no randomness — this is
// the algorithmic bridge between "Diagnostic Skin AI" and "Generative VTO".
//
// Input metrics (all optional; sensible defaults applied):
//   ita       Individual Typology Angle in degrees (higher = lighter skin)
//   oiliness  0-100 facial oiliness / shine score
//   redness   0-100 vascular redness / sensitivity score
//   texture   0-100 surface texture / pores severity
//   undertone "warm" | "cool" | "neutral"

import { GARMENT_PRESETS } from "./garmentPresets.js";

function clampScore(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(100, Math.max(0, n));
}

function normalizeUndertone(undertone, ita) {
  const value = String(undertone || "").toLowerCase();
  if (value.includes("warm")) return "warm";
  if (value.includes("cool")) return "cool";
  if (value.includes("neutral")) return "neutral";
  // Fallback: derive a coarse undertone from ITA when the API omits it.
  if (Number.isFinite(ita)) {
    if (ita >= 55) return "cool"; // very light complexions skew cool/pink here
    if (ita <= 28) return "warm"; // deeper complexions skew warm/bronze
  }
  return "neutral";
}

// ITA bands (Chardon classification) for a human-readable tone label.
function toneBandFromIta(ita) {
  if (!Number.isFinite(ita)) return "Medium";
  if (ita > 55) return "Very Light";
  if (ita > 41) return "Light";
  if (ita > 28) return "Intermediate";
  if (ita > 10) return "Tan";
  if (ita > -30) return "Brown";
  return "Deep";
}

// Intermediate/Tan bands carry the highest "garment blends into skin" risk, so a
// monochromatic smooth fabric looks flat — prefer 3D texture there.
function monochromaticRisk(ita) {
  if (!Number.isFinite(ita)) return 0.5;
  return ita <= 41 && ita > 5 ? 1 : 0;
}

export function deriveTargetSpec(rawMetrics = {}) {
  const oiliness = clampScore(rawMetrics.oiliness, 50);
  const redness = clampScore(rawMetrics.redness, 30);
  const texture = clampScore(rawMetrics.texture, 40);
  const ita = Number.isFinite(Number(rawMetrics.ita)) ? Number(rawMetrics.ita) : 41;
  const undertone = normalizeUndertone(rawMetrics.undertone, ita);

  // Rule 1 — Optical reflectance: oily/radiant skin bounces flash off shiny fabric.
  const sheen = oiliness >= 60 ? "matte" : "lustrous";

  // Rule 2 — Drape & structure: reactive/red skin wants fluid, breathable drape.
  const drape = redness >= 50 ? "fluid-soft" : "structured";

  // Rule 3 — Contrast & texture scale: low skin-vs-garment contrast wants 3D texture.
  const surfaceTexture = monochromaticRisk(ita) ? "3d-textured" : "flat-weave";

  // Palette follows undertone / ITA warmth.
  const palette = undertone;

  return {
    metrics: { ita, oiliness, redness, texture, undertone },
    toneBand: toneBandFromIta(ita),
    sheen,
    drape,
    surfaceTexture,
    palette,
  };
}

// Weighted attribute match. Sheen and palette carry the most perceptual weight.
const ATTRIBUTE_WEIGHTS = {
  sheen: 3,
  palette: 3,
  drape: 2,
  surfaceTexture: 2,
};

function scorePreset(preset, target) {
  let score = 0;
  let maxScore = 0;
  for (const [attribute, weight] of Object.entries(ATTRIBUTE_WEIGHTS)) {
    maxScore += weight;
    if (preset[attribute] === target[attribute]) {
      score += weight;
    } else if (attribute === "palette" && preset.palette === "neutral") {
      // Neutral garments flatter any undertone — award partial credit.
      score += weight * 0.5;
    }
  }
  return Math.round((score / maxScore) * 100);
}

function buildRationale(target) {
  const reasons = [];
  reasons.push(
    target.sheen === "matte"
      ? `Higher oiliness (${target.metrics.oiliness}) favors matte fabrics that avoid flash-back shine.`
      : `Drier / low-radiance skin benefits from lustrous fabrics that reflect light for a healthy glow.`
  );
  reasons.push(
    target.drape === "fluid-soft"
      ? `Elevated redness (${target.metrics.redness}) favors soft, breathable drapes that reduce heat-triggered flushing.`
      : `Balanced skin reactivity supports structured, tailored silhouettes.`
  );
  reasons.push(
    target.surfaceTexture === "3d-textured"
      ? `${target.toneBand} tone (ITA ${target.metrics.ita}°) risks blending with garments, so 3D textures add depth.`
      : `Natural skin-to-garment contrast lets clean flat weaves read crisp.`
  );
  reasons.push(
    target.palette === "neutral"
      ? `${target.metrics.undertone} undertone pairs safely with soft neutral palettes.`
      : `${target.metrics.undertone} undertone is balanced by a ${target.palette} color palette.`
  );
  return reasons;
}

export function recommendGarments(rawMetrics = {}) {
  const target = deriveTargetSpec(rawMetrics);

  const ranked = GARMENT_PRESETS.map((preset) => ({
    ...preset,
    matchScore: scorePreset(preset, target),
  })).sort((a, b) => b.matchScore - a.matchScore);

  return {
    target,
    rationale: buildRationale(target),
    topMatch: ranked[0],
    recommendations: ranked,
  };
}
