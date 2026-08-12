// Accessibility contrast analysis between a garment color and a skin-tone swatch.
// Uses the WCAG relative-luminance contrast ratio plus a warm/cool undertone read.

export type ContrastLevel = "good" | "moderate" | "low";

export type ContrastResult = {
  ratio: number;
  level: ContrastLevel;
  message: string;
};

type Rgb = { r: number; g: number; b: number };

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

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function undertone({ r, b }: Rgb): "warm" | "cool" | "neutral" {
  const delta = r - b;
  if (delta > 18) {
    return "warm";
  }
  if (delta < -18) {
    return "cool";
  }
  return "neutral";
}

export function analyzeContrast(garmentColor: string, skinTone?: string, skinLabel?: string): ContrastResult | null {
  const garment = parseHex(garmentColor);
  const skin = skinTone ? parseHex(skinTone) : null;
  if (!garment || !skin) {
    return null;
  }

  const lighter = Math.max(relativeLuminance(garment), relativeLuminance(skin));
  const darker = Math.min(relativeLuminance(garment), relativeLuminance(skin));
  const ratio = Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
  const skinUndertone = undertone(skin);
  const shortLabel = (skinLabel || "this skin type").replace(/\s*[:/].*$/, "").trim() || "this skin type";
  const undertoneNote = skinUndertone === "neutral" ? "" : ` ${skinUndertone} undertones`;

  if (ratio < 1.5) {
    return {
      ratio,
      level: "low",
      message: `Low contrast against ${shortLabel}${undertoneNote} — the garment may wash out.`,
    };
  }
  if (ratio < 2.2) {
    return {
      ratio,
      level: "moderate",
      message: `Moderate contrast against ${shortLabel}${undertoneNote} — check separation in-person.`,
    };
  }
  return {
    ratio,
    level: "good",
    message: `Good contrast against ${shortLabel}${undertoneNote}.`,
  };
}
