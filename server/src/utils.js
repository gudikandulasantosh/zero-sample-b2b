export function extractFirstImageUrl(payload) {
  if (typeof payload === "string" && payload.startsWith("http")) {
    return payload;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const value = extractFirstImageUrl(item);
      if (value) {
        return value;
      }
    }
    return null;
  }

  if (payload && typeof payload === "object") {
    const candidateKeys = [
      "rendered_garment_url",
      "image_url",
      "output_image_url",
      "image",
      "url",
      "output",
      "result",
      "data",
    ];
    for (const key of candidateKeys) {
      if (key in payload) {
        const value = extractFirstImageUrl(payload[key]);
        if (value) {
          return value;
        }
      }
    }
  }

  return null;
}

export function parseIntSafe(value) {
  const parsed = Number.parseInt(Number(value), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function envFlag(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw == null) {
    return defaultValue;
  }
  return ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());
}
