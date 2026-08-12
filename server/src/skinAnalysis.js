// B2C skin analysis: registers a shopper selfie with YouCam, runs the skin analysis
// task (oiliness, redness, texture) and skin-tone task (ITA° / undertone), and
// normalizes the varied upstream shapes into the flat metric set the recommendation
// engine expects. Falls back to a deterministic mock so demos never break.

import { HttpError } from "./errors.js";
import { runYouCamTask } from "./youcam.js";

// Upstream skin APIs use many different key spellings; scan a candidate list.
function pickNumber(source, keys) {
  if (!source || typeof source !== "object") {
    return null;
  }
  for (const key of keys) {
    const value = source[key];
    if (Number.isFinite(Number(value))) {
      return Number(value);
    }
    if (value && typeof value === "object") {
      const nested = pickNumber(value, ["value", "score", "severity"]);
      if (nested != null) {
        return nested;
      }
    }
  }
  return null;
}

function pickString(source, keys) {
  if (!source || typeof source !== "object") {
    return null;
  }
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function normalizeSkinMetrics(analysisData = {}, toneData = {}) {
  const analysis = analysisData?.results || analysisData || {};
  const tone = toneData?.results || toneData || {};

  const oiliness = pickNumber(analysis, ["oiliness", "oil", "shine", "radiance"]);
  const redness = pickNumber(analysis, ["redness", "red", "hemoglobin", "sensitivity"]);
  const texture = pickNumber(analysis, ["texture", "pores", "roughness"]);
  const ita = pickNumber(tone, ["ita", "ita_degree", "individual_typology_angle"]);
  const undertone = pickString(tone, ["undertone", "tone", "skin_tone", "undertone_category"]);

  return {
    ita: ita ?? null,
    oiliness: oiliness ?? null,
    redness: redness ?? null,
    texture: texture ?? null,
    undertone: undertone ?? null,
  };
}

// A deterministic pseudo-analysis derived from the file id so repeated demo runs on
// the same selfie stay stable while different uploads still vary.
function mockSkinMetrics(seedSource = "") {
  let seed = 0;
  for (const char of String(seedSource)) {
    seed = (seed * 31 + char.charCodeAt(0)) % 100000;
  }
  const undertones = ["warm", "cool", "neutral"];
  return {
    provider: "mock",
    metrics: {
      ita: 20 + (seed % 45),
      oiliness: 30 + (seed % 60),
      redness: 10 + (seed % 55),
      texture: 20 + (seed % 50),
      undertone: undertones[seed % undertones.length],
    },
  };
}

function taskPayload({ src_file_url, src_file_id }) {
  const version = (process.env.YOUCAM_TASK_VERSION || "1.0").trim() || "1.0";
  const index = Number.parseInt((process.env.YOUCAM_TASK_INDEX || "0").trim(), 10) || 0;
  const payload = { version, index };
  if (src_file_url && String(src_file_url).trim()) {
    payload.src_file_url = String(src_file_url).trim();
  }
  if (src_file_id && String(src_file_id).trim()) {
    payload.src_file_ids = [String(src_file_id).trim()];
  }
  return payload;
}

export async function runSkinAnalysis({ src_file_url, src_file_id }) {
  if (!src_file_url && !src_file_id) {
    throw new HttpError(400, "src_file_url or src_file_id is required for skin analysis.");
  }

  const apiKey = (process.env.YOUCAM_API_KEY || "").trim();
  const skinAnalysisBaseUrl = (process.env.YOUCAM_SKIN_ANALYSIS_BASE_URL || "").trim();
  const skinToneBaseUrl = (process.env.YOUCAM_SKIN_TONE_BASE_URL || "").trim();

  if (!apiKey || (!skinAnalysisBaseUrl && !skinToneBaseUrl)) {
    return { status: "success", ...mockSkinMetrics(src_file_id || src_file_url) };
  }

  const startPayload = taskPayload({ src_file_url, src_file_id });

  let analysisData = {};
  if (skinAnalysisBaseUrl) {
    const analysis = await runYouCamTask(skinAnalysisBaseUrl, apiKey, startPayload, "youcam_skin_analysis");
    analysisData = analysis.payload?.data || {};
  }

  let toneData = {};
  if (skinToneBaseUrl) {
    const tone = await runYouCamTask(skinToneBaseUrl, apiKey, startPayload, "youcam_skin_tone_analysis");
    toneData = tone.payload?.data || {};
  }

  const metrics = normalizeSkinMetrics(analysisData, toneData);

  // If the live call returned nothing usable, degrade gracefully to the mock.
  const hasAnySignal = Object.values(metrics).some((value) => value != null);
  if (!hasAnySignal) {
    return { status: "success", ...mockSkinMetrics(src_file_id || src_file_url) };
  }

  return { status: "success", provider: "youcam", metrics };
}
