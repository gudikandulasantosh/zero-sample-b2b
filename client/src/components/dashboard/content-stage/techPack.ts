// Generates a print-ready "Tech Pack" spec sheet for factory handoff.
// Includes the CAD reference, high-res render, Pantone-matched color and fabric spec.

import type { Archetype, ArchetypeRenderSpec } from "../types";

type Rgb = { r: number; g: number; b: number };

// Compact reference set of common Pantone solid-coated swatches for nearest-match approximation.
const PANTONE_REFERENCE: { code: string; name: string; hex: string }[] = [
  { code: "PANTONE 11-0601 TCX", name: "Bright White", hex: "#F0EEE9" },
  { code: "PANTONE 19-4005 TCX", name: "Caviar (Black)", hex: "#26262A" },
  { code: "PANTONE 17-1462 TCX", name: "Flame Orange", hex: "#F2552C" },
  { code: "PANTONE 18-1354 TCX", name: "Rust / Terracotta", hex: "#B55A30" },
  { code: "PANTONE 16-1546 TCX", name: "Living Coral", hex: "#FF6F61" },
  { code: "PANTONE 18-1662 TCX", name: "Fiery Red", hex: "#BC2B3D" },
  { code: "PANTONE 19-1664 TCX", name: "True Red", hex: "#BF1932" },
  { code: "PANTONE 15-0343 TCX", name: "Greenery", hex: "#88B04B" },
  { code: "PANTONE 18-0538 TCX", name: "Cardamom Green", hex: "#5B6236" },
  { code: "PANTONE 19-4052 TCX", name: "Classic Blue", hex: "#0F4C81" },
  { code: "PANTONE 18-3838 TCX", name: "Ultra Violet", hex: "#5F4B8B" },
  { code: "PANTONE 13-1520 TCX", name: "Rose Quartz", hex: "#F7CAC9" },
  { code: "PANTONE 15-3919 TCX", name: "Serenity Blue", hex: "#92A8D1" },
  { code: "PANTONE 14-1064 TCX", name: "Saffron", hex: "#FFA000" },
  { code: "PANTONE 13-0755 TCX", name: "Illuminating Yellow", hex: "#F5DF4D" },
  { code: "PANTONE 17-5104 TCX", name: "Ultimate Gray", hex: "#939597" },
  { code: "PANTONE 19-4010 TCX", name: "Navy Anthracite", hex: "#2A2D34" },
  { code: "PANTONE 18-1142 TCX", name: "Tawny Brown", hex: "#8A5A32" },
  { code: "PANTONE 12-0815 TCX", name: "Vanilla Cream", hex: "#F3E5C0" },
  { code: "PANTONE 19-1213 TCX", name: "Chocolate Brown", hex: "#5A4032" },
];

function parseHex(value: string): Rgb | null {
  const trimmed = value.trim().replace(/^#/, "");
  const expanded =
    trimmed.length === 3
      ? trimmed
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : trimmed;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return null;
  }
  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
}

export function matchPantone(hex: string): { code: string; name: string } {
  const target = parseHex(hex);
  if (!target) {
    return { code: "N/A", name: "Unmatched" };
  }
  let best = PANTONE_REFERENCE[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const swatch of PANTONE_REFERENCE) {
    const rgb = parseHex(swatch.hex);
    if (!rgb) {
      continue;
    }
    const distance =
      (rgb.r - target.r) ** 2 + (rgb.g - target.g) ** 2 + (rgb.b - target.b) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = swatch;
    }
  }
  return { code: best.code, name: best.name };
}

function extractGsm(fabricTexture: string, fallback: number): string {
  const match = fabricTexture.match(/(\d+)\s*GSM/i);
  return match ? `${match[1]} GSM (labelled) / ${fallback} GSM (simulated)` : `${fallback} GSM (simulated)`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type TechPackInput = {
  item: Archetype;
  spec: ArchetypeRenderSpec;
  renderedImageUrl?: string;
  cadImageUrl?: string;
  cadDescription?: string;
  projectName?: string;
};
const TECH_PACK_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1c1c1e; margin: 0; padding: 32px; background: #fff; }
  .sheet { max-width: 820px; margin: 0 auto 48px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .kicker { text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; color: #888; margin: 0 0 20px; }
  .images { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
  .images figure { margin: 0; flex: 1 1 240px; }
  .images img { width: 100%; border: 1px solid #e2e2e5; border-radius: 8px; background: #f6f6f6; }
  figcaption { font-size: 11px; color: #888; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.06em; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
  th { width: 210px; color: #666; font-weight: 600; }
  .swatch { display: inline-block; width: 16px; height: 16px; border-radius: 4px; border: 1px solid #ccc; vertical-align: middle; margin-right: 8px; }
  .note { margin-top: 24px; font-size: 11px; color: #999; }
  @media print { body { padding: 0; } .sheet { margin: 0; } }
`;

function buildSpecSheetSection(
  item: Archetype,
  spec: ArchetypeRenderSpec,
  cadEmbed: string,
  renderEmbed: string,
  cadDescription: string | undefined,
  project: string,
  pageBreakBefore: boolean
): string {
  const pantone = matchPantone(spec.color);
  const breakStyle = pageBreakBefore ? ' style="page-break-before: always;"' : "";
  return `
  <section class="sheet"${breakStyle}>
    <p class="kicker">${escapeHtml(project)} · Factory Tech Pack</p>
    <h1>${escapeHtml(item.type)}</h1>
    <div class="images">
      ${cadEmbed ? `<figure><img src="${escapeHtml(cadEmbed)}" alt="CAD outline" /><figcaption>CAD Outline</figcaption></figure>` : ""}
      ${renderEmbed ? `<figure><img src="${escapeHtml(renderEmbed)}" alt="Rendered garment" /><figcaption>Rendered Matrix</figcaption></figure>` : ""}
    </div>
    <table>
      <tbody>
        <tr><th>Hex color</th><td><span class="swatch" style="background:${escapeHtml(spec.color)}"></span>${escapeHtml(spec.color)}</td></tr>
        <tr><th>Pantone equivalent</th><td>${escapeHtml(pantone.code)} — ${escapeHtml(pantone.name)} <em>(nearest match)</em></td></tr>
        <tr><th>Fabric blend &amp; weave</th><td>${escapeHtml(spec.fabricTexture)}</td></tr>
        <tr><th>Simulated weight</th><td>${escapeHtml(extractGsm(spec.fabricTexture, spec.fabricWeight))}</td></tr>
        <tr><th>Sheen / drape</th><td>${escapeHtml(spec.drapeType)}</td></tr>
        <tr><th>Print / pattern scale</th><td>${escapeHtml(String(spec.printScale))}%</td></tr>
        <tr><th>Rendered lighting</th><td>${escapeHtml(spec.lighting)}</td></tr>
        <tr><th>Model pose</th><td>${escapeHtml(spec.pose)}</td></tr>
        <tr><th>Applied to</th><td>${escapeHtml(spec.targetGender)} · ${escapeHtml(spec.bodyType)}</td></tr>
        ${cadDescription ? `<tr><th>CAD notes</th><td>${escapeHtml(cadDescription)}</td></tr>` : ""}
      </tbody>
    </table>
    <p class="note">Pantone value is an approximate nearest match for on-screen review and must be confirmed against a physical Pantone TCX chip before dyeing.</p>
  </section>`;
}

function wrapTechPackDocument(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${TECH_PACK_STYLES}</style>
</head>
<body>
${body}
  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 400));</script>
</body>
</html>`;
}

function openReportWindow(): Window | null {
  const reportWindow = window.open("", "_blank", "width=900,height=1000");
  if (!reportWindow) {
    return null;
  }
  reportWindow.document.write(
    "<!doctype html><title>Preparing tech pack…</title><body style='font-family:sans-serif;padding:32px;color:#555'>Preparing tech pack…</body>"
  );
  return reportWindow;
}

export async function exportTechPack({
  item,
  spec,
  renderedImageUrl,
  cadImageUrl,
  cadDescription,
  projectName,
}: TechPackInput) {
  const reportWindow = openReportWindow();
  if (!reportWindow) {
    return;
  }

  const project = projectName || "Untitled Project";
  // blob: URLs are scoped to the opener document and won't load in the new window, so inline them.
  const [cadEmbed, renderEmbed] = await Promise.all([
    toEmbeddableImage(cadImageUrl),
    toEmbeddableImage(renderedImageUrl),
  ]);

  const body = buildSpecSheetSection(item, spec, cadEmbed, renderEmbed, cadDescription, project, false);
  const html = wrapTechPackDocument(`Tech Pack — ${item.type}`, body);

  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
}

export type CombinedTechPackEntry = {
  item: Archetype;
  spec: ArchetypeRenderSpec;
  renderedImageUrl?: string;
};

export type CombinedTechPackInput = {
  entries: CombinedTechPackEntry[];
  cadImageUrl?: string;
  cadDescription?: string;
  projectName?: string;
};

// One document containing a spec sheet per rendered archetype (page-break between each).
export async function exportCombinedTechPack({
  entries,
  cadImageUrl,
  cadDescription,
  projectName,
}: CombinedTechPackInput) {
  const reportWindow = openReportWindow();
  if (!reportWindow) {
    return;
  }

  const project = projectName || "Untitled Project";

  if (entries.length === 0) {
    reportWindow.document.open();
    reportWindow.document.write(
      wrapTechPackDocument(
        `Tech Pack — ${project}`,
        `<section class="sheet"><p class="kicker">${escapeHtml(project)} · Factory Tech Pack</p><h1>No rendered archetypes</h1><p class="note">Render at least one archetype card before exporting the combined report.</p></section>`
      )
    );
    reportWindow.document.close();
    return;
  }

  const cadEmbed = await toEmbeddableImage(cadImageUrl);
  const renderEmbeds = await Promise.all(entries.map((entry) => toEmbeddableImage(entry.renderedImageUrl)));

  const body = entries
    .map((entry, index) =>
      buildSpecSheetSection(entry.item, entry.spec, cadEmbed, renderEmbeds[index], cadDescription, project, index > 0)
    )
    .join("\n");

  reportWindow.document.open();
  reportWindow.document.write(wrapTechPackDocument(`Tech Pack — ${project}`, body));
  reportWindow.document.close();
}

// Converts blob: URLs (scoped to the opener document) into portable data URLs so the
// popup window can render them. Same-origin/remote URLs are returned unchanged.
async function toEmbeddableImage(url?: string): Promise<string> {
  if (!url) {
    return "";
  }
  if (!url.startsWith("blob:")) {
    return url;
  }
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}
