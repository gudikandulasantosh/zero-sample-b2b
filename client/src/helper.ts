/**
 * Generates a prompt for a multimodal model that accepts an attached CAD reference image.
 * 
 * @param {Object} details - Model and garment configuration from the client.
 * @param {string} details.gender - e.g., 'Female', 'Male'
 * @param {number|string} details.age - e.g., 26
 * @param {string} details.ethnicity - e.g., 'East American Black'
 * @param {string} details.skinTone - e.g., 'Fair skin'
 * @param {number|string} details.fitzpatrickType - e.g., 3
 * @param {string} [details.bodyType] - Optional model body type descriptor
 * @param {string} [details.garmentColor] - Optional selected garment color (hex or descriptive)
 * @param {string} [details.fabricTexture] - Optional selected fabric texture
 * @param {number|string} [details.fabricWeight] - Optional fabric weight in GSM
 * @param {string} [details.drapeType] - Optional sheen/drape behaviour (Matte, Gloss/Satin, Sheer, Stiff, Fluid)
 * @param {string} [details.lighting] - Optional venue lighting preset
 * @param {number|string} [details.printScale] - Optional print/pattern scale percentage
 * @param {string} [details.pose] - Optional model pose variation
 * @param {string} [details.setting] - Optional background description
 * @param {string} [details.shotType] - Optional framing (e.g., 'Full-body')
 * @returns {string} The formatted prompt string for your API payload.
 */
export function buildFashionPrompt(details) {
  const bodyType = details.bodyType || "Well-proportioned editorial physique";
  const systemInstruction = `You are an expert AI fashion photographer. Render the CAD garment on a realistic model as an ultra-HD commercial editorial shot.`;

  const printDescriptor = describePrintScale(details.printScale);

  const lines = [
    `- Model: ${details.age}yo ${details.ethnicity} ${details.gender.toLowerCase()}, ${details.skinTone} (Fitzpatrick ${details.fitzpatrickType}), ${bodyType}.`,
    `- Garment: map the CAD garment onto the model with realistic creases, drape and true texture.`,
    `- Fabric: ${details.fabricTexture || "midweight cotton jersey"}; ${describeFabricWeight(details.fabricWeight)}, ${describeDrape(details.drapeType)}.`,
    `- Color: ${details.garmentColor || "balanced editorial palette"} with realistic shading.`,
    printDescriptor ? `- Print: ${printDescriptor}.` : "",
    `- Lighting: ${describeLighting(details.lighting)}.`,
    `- Pose: ${describePose(details.pose)}.`,
    `- Framing: ${details.shotType || "Full-body shot"}, editorial, sharp focus, ultra-HD.`,
    details.cadDescription ? `- CAD notes: ${details.cadDescription}` : "",
  ].filter(Boolean);

  return `${systemInstruction}\n\nSpecification:\n${lines.join("\n")}`;
}

function describeFabricWeight(fabricWeight) {
  const gsm = Number(fabricWeight);
  if (!Number.isFinite(gsm) || gsm <= 0) {
    return "midweight hand-feel";
  }
  if (gsm <= 130) {
    return `${gsm} GSM lightweight, fluid mobile hang`;
  }
  if (gsm >= 320) {
    return `${gsm} GSM heavyweight, structured firm folds`;
  }
  return `${gsm} GSM midweight, balanced drape`;
}

function describeDrape(drapeType) {
  switch ((drapeType || "").toLowerCase()) {
    case "gloss / satin":
    case "gloss/satin":
    case "satin":
      return "glossy/satin sheen with bright specular highlights";
    case "sheer":
      return "sheer and semi-translucent";
    case "stiff":
      return "stiff and structured, holding crisp folds";
    case "fluid":
      return "fluid and liquid-like, cascading in soft ripples";
    case "matte":
      return "matte with diffuse, even light";
    default:
      return "natural surface behaviour";
  }
}

function describeLighting(lighting) {
  switch ((lighting || "").toLowerCase()) {
    case "runway spotlight":
      return "directional runway spotlight, strong top-down key, crisp shadows, punchy contrast";
    case "retail warm":
      return "warm retail lighting ~3000K with a soft amber cast";
    case "flash photography":
      return "direct on-camera flash, bright flat frontal exposure, hard edge shadows";
    case "studio daylight":
    default:
      return "soft neutral studio daylight ~5500K for true-to-life color";
  }
}

function describePose(pose) {
  switch ((pose || "").toLowerCase()) {
    case "walking profile":
      return "mid-stride walking profile so slits open and hems swing to show movement";
    case "3/4 turn":
    case "three-quarter turn":
      return "3/4 turn revealing how the garment breaks across the body";
    case "front standing":
    default:
      return "relaxed front-standing pose showing the full silhouette";
  }
}

function describePrintScale(printScale) {
  const scale = Number(printScale);
  if (!Number.isFinite(scale) || scale === 100) {
    return "";
  }
  if (scale <= 75) {
    return `render any surface pattern at ${scale}% (micro/dense print)`;
  }
  if (scale >= 150) {
    return `render any surface pattern at ${scale}% (oversized statement print)`;
  }
  return `render any surface pattern at ${scale}% scale`;
}
