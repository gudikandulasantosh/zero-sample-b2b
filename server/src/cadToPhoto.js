import axios from "axios";

import { HttpError } from "./errors.js";
import { extractFirstImageUrl } from "./utils.js";

async function pollReplicatePrediction(getUrl, token, maxAttempts = 60) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await axios.get(getUrl, {
      headers: { Authorization: `Token ${token}` },
      timeout: 30000,
      validateStatus: () => true,
    });

    if (response.status >= 400) {
      throw new HttpError(502, `Replicate polling failed: ${JSON.stringify(response.data)}`);
    }

    const data = response.data || {};
    const status = data.status;

    if (status === "succeeded") {
      return data;
    }
    if (status === "failed" || status === "canceled") {
      throw new HttpError(502, `Replicate prediction failed: ${JSON.stringify(data)}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new HttpError(504, "Replicate prediction timed out");
}

export async function runCadToPhoto({ cad_image_url, prompt, fabric_color }) {
  const cadRenderApiUrl = (process.env.CAD_RENDER_API_URL || "").trim();
  const cadRenderApiKey = (process.env.CAD_RENDER_API_KEY || "").trim();
  const replicateToken = (process.env.REPLICATE_API_TOKEN || "").trim();
  const replicateVersion = (process.env.REPLICATE_MODEL_VERSION || "").trim();

  if (cadRenderApiUrl && cadRenderApiKey) {
    const response = await axios.post(
      cadRenderApiUrl,
      {
        cad_image_url,
        prompt,
        fabric_color,
      },
      {
        headers: {
          Authorization: `Bearer ${cadRenderApiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 90000,
        validateStatus: () => true,
      }
    );

    if (response.status >= 400) {
      throw new HttpError(502, `CAD render API error: ${JSON.stringify(response.data)}`);
    }

    const renderedUrl = extractFirstImageUrl(response.data) || cad_image_url;
    return {
      status: "success",
      provider: "cad_render_api",
      rendered_garment_url: renderedUrl,
      applied_color: fabric_color,
      prompt_used: prompt,
    };
  }

  if (replicateToken && replicateVersion) {
    const startResponse = await axios.post(
      "https://api.replicate.com/v1/predictions",
      {
        version: replicateVersion,
        input: {
          image: cad_image_url,
          prompt,
          fabric_color,
        },
      },
      {
        headers: {
          Authorization: `Token ${replicateToken}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
        validateStatus: () => true,
      }
    );

    if (startResponse.status >= 400) {
      throw new HttpError(502, `Replicate start failed: ${JSON.stringify(startResponse.data)}`);
    }

    const getUrl = startResponse.data?.urls?.get;
    if (!getUrl) {
      throw new HttpError(502, "Replicate response missing polling URL");
    }

    const finalData = await pollReplicatePrediction(getUrl, replicateToken);
    const renderedUrl = extractFirstImageUrl(finalData.output) || cad_image_url;

    return {
      status: "success",
      provider: "replicate",
      rendered_garment_url: renderedUrl,
      applied_color: fabric_color,
      prompt_used: prompt,
    };
  }

  return {
    status: "success",
    provider: "mock",
    rendered_garment_url: cad_image_url,
    applied_color: fabric_color,
    prompt_used: prompt,
  };
}
