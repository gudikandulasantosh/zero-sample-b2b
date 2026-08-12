import axios from "axios";

import { HttpError } from "./errors.js";
import { extractFirstImageUrl } from "./utils.js";

const DEFAULT_YOUCAM_FILE_API_URL = "https://yce-api-01.makeupar.com/s2s/v2.0/file/image-to-image/youcam";
const DEFAULT_YOUCAM_IMAGE_TO_IMAGE_TASK_URL = "https://yce-api-01.makeupar.com/s2s/v2.0/task/image-to-image/youcam";
const DEFAULT_YOUCAM_CLOTH_V3_TASK_URL = "https://yce-api-01.makeupar.com/s2s/v2.0/task/cloth-v3";

async function runYouCamDirect(apiUrl, apiKey, providerName, payload) {
  const response = await axios.post(apiUrl, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 90000,
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    throw new HttpError(502, `YouCam API error: ${JSON.stringify(response.data)}`);
  }

  const data = response.data || {};
  const outputImageUrl = extractFirstImageUrl(data) || payload.garment_image_url;

  let harmonyScore = data.harmony_score;
  if (harmonyScore == null && Number.isFinite(data.score)) {
    harmonyScore = Number.parseInt(data.score, 10);
  }
  if (harmonyScore == null) {
    harmonyScore = 88;
  }

  return {
    provider: providerName,
    harmony_score: harmonyScore,
    undertone_delta: data.undertone_delta || data.delta_e || "ΔE N/A",
    fit_status: data.fit_status || data.status || "Generated",
    output_image_url: outputImageUrl,
  };
}

export async function runYouCamTask(taskBaseUrl, apiKey, startPayload, providerName) {
  const pollIntervalS = Math.max(Number(process.env.YOUCAM_TASK_POLL_INTERVAL_S || "2") || 2, 0.25);
  const maxAttempts = Math.max(Number.parseInt(process.env.YOUCAM_TASK_MAX_ATTEMPTS || "300", 10) || 300, 1);

  const startResponse = await axios.post(taskBaseUrl, startPayload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 30000,
    validateStatus: () => true,
  });

  if (startResponse.status >= 400) {
    throw new HttpError(502, `YouCam task start failed: ${JSON.stringify(startResponse.data)}`);
  }

  const taskId = startResponse.data?.data?.task_id;
  if (!taskId) {
    throw new HttpError(502, `YouCam task_id not found in start response: ${JSON.stringify(startResponse.data)}`);
  }

  for (let i = 0; i < maxAttempts; i += 1) {
    const pollResponse = await axios.get(`${taskBaseUrl}/${taskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
      validateStatus: () => true,
    });

    if (pollResponse.status >= 400) {
      throw new HttpError(502, `YouCam task polling failed: ${JSON.stringify(pollResponse.data)}`);
    }

    const status = pollResponse.data?.data?.task_status;
    if (status === "success") {
      return {
        provider: providerName,
        task_id: taskId,
        payload: pollResponse.data,
      };
    }
    if (status === "error") {
      throw new HttpError(502, `YouCam task failed: ${JSON.stringify(pollResponse.data)}`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalS * 1000));
  }

  throw new HttpError(504, "YouCam task polling timed out");
}

// Downloads a hosted image (e.g. a previous render's output_image_url) server-side
// and re-registers it with YouCam so it can be reused as a src_file_id.
export async function uploadYoucamFileFromUrl({ url, fileName }) {
  if (!url || typeof url !== "string") {
    throw new HttpError(400, "image_url is required.");
  }

  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 90000,
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    throw new HttpError(502, `Failed to download source image (status ${response.status}).`);
  }

  const fileBuffer = Buffer.from(response.data);
  const contentType = response.headers["content-type"] || "image/jpeg";
  const name = fileName || `chained_${Date.now()}.jpg`;

  return uploadYoucamFile({
    fileName: name,
    contentType,
    fileSize: fileBuffer.length,
    fileBuffer,
  });
}

export async function uploadYoucamFile({ fileName, contentType, fileSize, fileBuffer }) {
  const youcamApiKey = (process.env.YOUCAM_API_KEY || "").trim();
  const youcamFileApiUrl =
    (process.env.YOUCAM_FILE_API_URL || "").trim() || DEFAULT_YOUCAM_FILE_API_URL;

  if (!youcamApiKey) {
    throw new HttpError(500, "YOUCAM_API_KEY is required to upload files to YouCam.");
  }

  const registerResponse = await axios.post(
    youcamFileApiUrl,
    {
      files: [
        {
          content_type: contentType,
          file_name: fileName,
          file_size: fileSize,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${youcamApiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
      validateStatus: () => true,
    }
  );

  if (registerResponse.status >= 400) {
    throw new HttpError(502, `YouCam file registration failed: ${JSON.stringify(registerResponse.data)}`);
  }
console.log("registerResponse.data : ", JSON.stringify(registerResponse.data))
const registerResponseData = registerResponse.data?.data;
  const fileEntry = registerResponseData?.files?.[0];
  const uploadRequest = fileEntry?.requests?.[0];
  const fileId = fileEntry?.file_id;
console.log(fileId, " -- ", JSON.stringify(fileEntry))
  if (!fileId || !uploadRequest?.url) {
    throw new HttpError(
      502,
      `YouCam file upload metadata missing from response: ${JSON.stringify(registerResponse.data)}`
    );
  }

  const uploadMethod = (uploadRequest.method || "PUT").toUpperCase();
  const uploadHeaders = { ...(uploadRequest.headers || {}) };

  if (!fileBuffer) {
    throw new HttpError(400, "Uploaded file buffer is required for YouCam upload.");
  }

  const uploadResponse = await axios({
    method: uploadMethod,
    url: uploadRequest.url,
    headers: uploadHeaders,
    data: fileBuffer,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 90000,
    validateStatus: () => true,
  });

  if (uploadResponse.status >= 400) {
    throw new HttpError(502, `YouCam binary upload failed with status ${uploadResponse.status}.`);
  }

  return {
    status: "success",
    provider: "youcam",
    file_id: fileId,
    upload_method: uploadMethod,
  };
}

export async function runYoucamImageToImage({ src_file_id, src_file_ids, prompt, model, size }) {
  const youcamApiKey = (process.env.YOUCAM_API_KEY || "").trim();
  const taskBaseUrl =
    (process.env.YOUCAM_IMAGE_TO_IMAGE_TASK_BASE_URL || "").trim() || DEFAULT_YOUCAM_IMAGE_TO_IMAGE_TASK_URL;

  if (!youcamApiKey) {
    throw new HttpError(500, "YOUCAM_API_KEY is required for image-to-image rendering.");
  }

  const sourceIds = (Array.isArray(src_file_ids) ? src_file_ids : [src_file_id])
    .filter((id) => typeof id === "string" && id.trim())
    .map((id) => id.trim());

  if (sourceIds.length === 0) {
    throw new HttpError(400, "src_file_id or src_file_ids is required.");
  }

  const normalizedPrompt = String(prompt || "").trim();
  if (!normalizedPrompt) {
    throw new HttpError(400, "prompt is required.");
  }

  const taskResult = await runYouCamTask(
    taskBaseUrl,
    youcamApiKey,
    {
      model: String(model || "youcam-image-v2"),
      prompt: normalizedPrompt,
      size: String(size || "928*1664"),
      src_file_ids: sourceIds,
    },
    "youcam_image_to_image"
  );

  const results = taskResult.payload?.data?.results;
  const outputImageUrl = extractFirstImageUrl(results);
  if (!outputImageUrl) {
    throw new HttpError(502, "YouCam task succeeded but no output image URL was returned.");
  }

  return {
    status: "success",
    provider: "youcam_image_to_image",
    task_id: taskResult.task_id,
    output_image_url: outputImageUrl,
  };
}

// Direct-URL accessory layering per YouCam's chaining guidance: the base render URL is
// passed as src_file_url and the accessory as ref_file_url — no download/re-upload.
// Note: YouCam fetches both URLs server-side, so they must be publicly reachable
// (a localhost accessory upload will fail; the caller falls back to the file-id path).
export async function runYoucamClothLayer({ base_image_url, accessory_image_url }) {
  const youcamApiKey = (process.env.YOUCAM_API_KEY || "").trim();
  const taskBaseUrl =
    (process.env.YOUCAM_CLOTH_V3_TASK_BASE_URL || "").trim() || DEFAULT_YOUCAM_CLOTH_V3_TASK_URL;

  if (!youcamApiKey) {
    throw new HttpError(500, "YOUCAM_API_KEY is required for accessory layering.");
  }
  if (!base_image_url || typeof base_image_url !== "string") {
    throw new HttpError(400, "base_image_url is required.");
  }
  if (!accessory_image_url || typeof accessory_image_url !== "string") {
    throw new HttpError(400, "accessory_image_url is required.");
  }

  const version = (process.env.YOUCAM_TASK_VERSION || "1.0").trim() || "1.0";
  const index = Number.parseInt((process.env.YOUCAM_TASK_INDEX || "0").trim(), 10) || 0;
  const garmentCategory = (process.env.YOUCAM_GARMENT_CATEGORY || "auto").trim() || "auto";

  const taskResult = await runYouCamTask(
    taskBaseUrl,
    youcamApiKey,
    {
      src_file_url: base_image_url,
      ref_file_url: accessory_image_url,
      garment_category: garmentCategory,
      version,
      index,
    },
    "youcam_cloth_layer"
  );

  const outputImageUrl = extractFirstImageUrl(taskResult.payload?.data?.results);
  if (!outputImageUrl) {
    throw new HttpError(502, "Layer task succeeded but no output image URL was returned.");
  }

  return {
    status: "success",
    provider: "youcam_cloth_layer",
    task_id: taskResult.task_id,
    output_image_url: outputImageUrl,
  };
}

export async function runYoucamVto({ garment_image_url, target_model_id, model_selfie_url }) {
  const youcamApiKey = (process.env.YOUCAM_API_KEY || "").trim();
  const youcamApiUrl = (process.env.YOUCAM_API_URL || "").trim();
  const youcamTaskBaseUrl = (process.env.YOUCAM_TASK_BASE_URL || "").trim();
  const youcamSkinToneBaseUrl = (process.env.YOUCAM_SKIN_TONE_BASE_URL || "").trim();

  const directPayload = {
    garment_image_url,
    target_model_id,
    model_selfie_url,
  };

  if (youcamTaskBaseUrl && youcamTaskBaseUrl.toLowerCase().includes("body-reshape")) {
    if (youcamApiUrl && youcamApiKey) {
      return runYouCamDirect(youcamApiUrl, youcamApiKey, "youcam", directPayload);
    }

    throw new HttpError(
      502,
      "YOUCAM_TASK_BASE_URL points to body-reshape and is not compatible with apparel VTO payloads."
    );
  }

  if (youcamApiKey && youcamTaskBaseUrl) {
    const version = (process.env.YOUCAM_TASK_VERSION || "1.0").trim() || "1.0";
    const index = Number.parseInt((process.env.YOUCAM_TASK_INDEX || "0").trim(), 10) || 0;
    const garmentCategory = (process.env.YOUCAM_GARMENT_CATEGORY || "auto").trim() || "auto";

    if (!model_selfie_url || !model_selfie_url.trim()) {
      throw new HttpError(400, "YouCam cloth-v3 requires model_selfie_url so it can be sent as src_file_url.");
    }

    const taskResult = await runYouCamTask(
      youcamTaskBaseUrl,
      youcamApiKey,
      {
        src_file_url: model_selfie_url,
        ref_file_url: garment_image_url,
        garment_category: garmentCategory,
        version,
        index,
      },
      "youcam_cloth_v3"
    );

    const taskData = taskResult.payload?.data || {};
    const results = taskData.results;

    let harmonyScore = 88;
    let undertoneDelta = "ΔE N/A";
    let fitStatus = "Success";

    if (youcamSkinToneBaseUrl) {
      const analysis = await runYouCamTask(
        youcamSkinToneBaseUrl,
        youcamApiKey,
        {
          src_file_url: model_selfie_url,
          version,
          index,
        },
        "youcam_skin_tone_analysis"
      );
      const analysisData = analysis.payload?.data || {};
      const analysisResults = analysisData.results || analysisData;
      if (analysisResults && typeof analysisResults === "object") {
        const scoreValue = analysisResults.harmony_score ?? analysisResults.score;
        if (Number.isFinite(scoreValue)) {
          harmonyScore = Number.parseInt(scoreValue, 10);
        }

        undertoneDelta =
          analysisResults.undertone_delta || analysisResults.delta_e || analysisResults.undertone || undertoneDelta;
        fitStatus = analysisResults.fit_status || analysisResults.status || fitStatus;
      }
    }

    return {
      provider: "youcam_cloth_v3",
      harmony_score: harmonyScore,
      undertone_delta: undertoneDelta,
      fit_status: fitStatus,
      output_image_url: extractFirstImageUrl(results) || garment_image_url,
    };
  }

  if (youcamApiUrl && youcamApiKey) {
    return runYouCamDirect(youcamApiUrl, youcamApiKey, "youcam", directPayload);
  }

  return {
    provider: "mock",
    harmony_score: 88,
    undertone_delta: "ΔE 2.1",
    fit_status: "Complimentary",
    output_image_url: garment_image_url,
  };
}
