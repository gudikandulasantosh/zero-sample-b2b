// Pre-hosted cloth-v3 reference garments. Each preset is a clean, flat product image
// (ref_file_url) with the tactile/optical/structural attributes the recommendation
// engine scores against. Only 4-6 high-quality presets are needed for a demo.
//
// refImageUrl must be publicly reachable by YouCam. For local runs set
// GARMENT_ASSET_BASE_URL to a public tunnel or deployed origin; it defaults to the
// client-served /assets/garments path.

const ASSET_BASE_URL = (process.env.GARMENT_ASSET_BASE_URL || "").trim().replace(/\/$/, "");

function assetUrl(fileName) {
  const relativePath = `/assets/garments/${fileName}`;
  return ASSET_BASE_URL ? `${ASSET_BASE_URL}${relativePath}` : relativePath;
}

// Attribute vocabulary (kept small and explicit so scoring stays deterministic):
//   sheen:          "matte" | "lustrous"
//   drape:          "fluid-soft" | "structured"
//   surfaceTexture: "3d-textured" | "flat-weave"
//   palette:        "warm" | "cool" | "neutral"
export const GARMENT_PRESETS = [
  {
    id: "silk-slip-terracotta",
    name: "Silk Slip Dress",
    fabric: "Silk Charmeuse",
    colorway: "Terracotta",
    colorHex: "#C85A17",
    sheen: "lustrous",
    drape: "fluid-soft",
    surfaceTexture: "flat-weave",
    palette: "warm",
    garmentCategory: "full_body",
    refImageUrl: assetUrl("silk_slip_terracotta.svg"),
  },
  {
    id: "washed-linen-shirt",
    name: "Linen Button-Down",
    fabric: "Washed Linen",
    colorway: "Warm Sand",
    colorHex: "#C9A66B",
    sheen: "matte",
    drape: "structured",
    surfaceTexture: "flat-weave",
    palette: "warm",
    garmentCategory: "upper_body",
    refImageUrl: assetUrl("washed_linen_shirt.svg"),
  },
  {
    id: "heavy-tweed-blazer",
    name: "Heavy Tweed Blazer",
    fabric: "Bouclé Tweed",
    colorway: "Cool Slate",
    colorHex: "#6B7280",
    sheen: "matte",
    drape: "structured",
    surfaceTexture: "3d-textured",
    palette: "cool",
    garmentCategory: "upper_body",
    refImageUrl: assetUrl("heavy_tweed_blazer.svg"),
  },
  {
    id: "velvet-evening-gown",
    name: "Velvet Evening Gown",
    fabric: "Silk Velvet",
    colorway: "Deep Emerald",
    colorHex: "#0F5132",
    sheen: "lustrous",
    drape: "structured",
    surfaceTexture: "3d-textured",
    palette: "cool",
    garmentCategory: "full_body",
    refImageUrl: assetUrl("velvet_evening_gown.svg"),
  },
  {
    id: "bamboo-jersey-top",
    name: "Bamboo Jersey Top",
    fabric: "Bamboo Jersey",
    colorway: "Soft Rose Neutral",
    colorHex: "#D8A7A1",
    sheen: "matte",
    drape: "fluid-soft",
    surfaceTexture: "flat-weave",
    palette: "neutral",
    garmentCategory: "upper_body",
    refImageUrl: assetUrl("bamboo_jersey_top.svg"),
  },
  {
    id: "cotton-poplin-shirt",
    name: "Cotton Poplin Shirt",
    fabric: "Crisp Cotton Poplin",
    colorway: "Optic White",
    colorHex: "#F5F5F0",
    sheen: "matte",
    drape: "structured",
    surfaceTexture: "flat-weave",
    palette: "neutral",
    garmentCategory: "upper_body",
    refImageUrl: assetUrl("cotton_poplin_shirt.svg"),
  },
];

export function getPresetById(presetId) {
  return GARMENT_PRESETS.find((preset) => preset.id === presetId) || null;
}
