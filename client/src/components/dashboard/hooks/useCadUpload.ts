import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

import { buildFashionPrompt } from "../../../helper";
import type { BodyType, TargetGender } from "../control-panel/FabricSpecSection";
import type { CadUploadResponse } from "../types";

// Requirements: Modern browsers (fetch API + optional chaining supported).
//   - Chrome / Edge >= 80
//   - Firefox >= 74
//   - Safari >= 13.1
// YouCam rejects prompts over its API limit (~1000 chars); keep margin below that.
const MAX_PROMPT_LENGTH = 900;

type ArchetypePromptJob = {
  id: number;
  prompt: string;
  extendedPrompt?: string;
  garmentColor?: string;
  fabricTexture?: string;
  cadDescription?: string;
  targetGender?: TargetGender;
  bodyType?: BodyType;
  fabricWeight?: number;
  drapeType?: string;
  lighting?: string;
  printScale?: number;
  pose?: string;
};

const RANDOM_ETHNICITIES = [
  "East American Black",
  "South Asian",
  "Latina",
  "East Asian",
  "Middle Eastern",
  "White European",
  "African",
];
const RANDOM_SETTINGS = [
  "Neutral indoor environment",
  "Minimalist studio space",
  "Sunlit loft interior",
  "Modern gallery backdrop",
  "Soft editorial daylight set",
];
const RANDOM_SHOT_TYPES = [
  "Full-body shot",
  "Three-quarter shot",
  "Mid-length editorial framing",
  "Runway portrait",
];

function pickBySeed<T>(items: T[], seed: number): T {
  const index = Math.abs(seed) % items.length;
  return items[index];
}

function normalizePrompt(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function clampPrompt(text: string, maxLength = MAX_PROMPT_LENGTH): string {
  const normalized = normalizePrompt(text);
  if (normalized.length <= maxLength) {
    return normalized;
  }
  const trimmed = normalized.slice(0, maxLength - 3).trimEnd();
  return `${trimmed}...`;
}

function parseFitzpatrickType(text: string): number {
  const match = text.match(/type\s+(i|ii|iii|iv|v|vi)\b/i);
  const value = (match?.[1] || "").toUpperCase();
  const map: Record<string, number> = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
  };
  return map[value] || 3;
}

function buildTaskPrompt(
  archetypeId: number,
  archetypePromptText: string,
  extendedPrompt: string,
  garmentColor: string,
  fabricTexture: string,
  cadDescription: string,
  targetGender: TargetGender,
  bodyType: BodyType,
  fabricWeight: number | undefined,
  drapeType: string | undefined,
  lighting: string | undefined,
  printScale: number | undefined,
  pose: string | undefined
): string {
  const fitzpatrickType = parseFitzpatrickType(archetypePromptText);
  const skinTone = archetypePromptText.includes(":")
    ? archetypePromptText.split(":").slice(1).join(":").trim()
    : archetypePromptText.trim() || "Medium";

  const seed = archetypeId * 97 + fitzpatrickType * 13 + normalizePrompt(archetypePromptText).length;

  const randomProfile = {
    gender: targetGender,
    age: 27 + (Math.abs(seed) % 12),
    ethnicity: pickBySeed(RANDOM_ETHNICITIES, seed),
    setting: pickBySeed(RANDOM_SETTINGS, seed + 1),
    shotType: pickBySeed(RANDOM_SHOT_TYPES, seed + 2),
  };

  const generatedPrompt = buildFashionPrompt({
    gender: randomProfile.gender,
    age: randomProfile.age,
    ethnicity: randomProfile.ethnicity,
    skinTone,
    fitzpatrickType,
    bodyType,
    garmentColor,
    fabricTexture,
    fabricWeight,
    drapeType,
    lighting,
    printScale,
    pose,
    setting: randomProfile.setting,
    shotType: randomProfile.shotType,
    cadDescription,
  });

  const mergedPrompt = extendedPrompt.trim()
    ? `${generatedPrompt}\n- Additional User Direction: ${extendedPrompt.trim()}`
    : generatedPrompt;

  if (normalizePrompt(mergedPrompt).length <= MAX_PROMPT_LENGTH) {
    return mergedPrompt;
  }

  if (normalizePrompt(generatedPrompt).length <= MAX_PROMPT_LENGTH) {
    return generatedPrompt;
  }

  return clampPrompt(generatedPrompt);
}

export function useCadUpload(
  archetypePromptJobs: ArchetypePromptJob[],
  garmentColor: string,
  fabricTexture: string,
  cadDescription: string,
  targetGender: TargetGender,
  bodyType: BodyType,
  fabricWeight: number,
  drapeType: string,
  lighting: string,
  printScale: number,
  pose: string
) {
  const [cadImageUrl, setCadImageUrl] = useState("");
  const [cadFileName, setCadFileName] = useState("");
  const [cadFileId, setCadFileId] = useState("");
  const [uploadingCad, setUploadingCad] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [pipelineError, setPipelineError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [archetypeImagesById, setArchetypeImagesById] = useState<Record<number, string>>({});
  const [archetypeLayerStackById, setArchetypeLayerStackById] = useState<Record<number, string[]>>({});
  const [runningArchetypeIds, setRunningArchetypeIds] = useState<number[]>([]);
  const [archetypePipelineErrorsById, setArchetypePipelineErrorsById] = useState<Record<number, string>>({});
  const previewObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  const updatePreviewFromFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    if (previewObjectUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    setCadImageUrl(objectUrl);
  };

  const runArchetypeJob = async (job: ArchetypePromptJob) => {
    const promptForJob = buildTaskPrompt(
      job.id,
      job.prompt || "",
      job.extendedPrompt || "",
      job.garmentColor || garmentColor,
      job.fabricTexture || fabricTexture,
      job.cadDescription || cadDescription,
      job.targetGender || targetGender,
      job.bodyType || bodyType,
      job.fabricWeight ?? fabricWeight,
      job.drapeType || drapeType,
      job.lighting || lighting,
      job.printScale ?? printScale,
      job.pose || pose
    );

    const response = await fetch("/api/youcam/image-to-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        src_file_id: cadFileId,
        prompt: promptForJob,
        model: "youcam-image-v2",
        size: "928*1664",
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const detail =
        typeof errorPayload?.detail === "string"
          ? errorPayload.detail
          : `Image generation failed: ${response.status} ${response.statusText}`;
      throw new Error(detail);
    }

    const final = await response.json().catch(() => ({}));
    const imageUrl = typeof final?.output_image_url === "string" ? final.output_image_url : "";

    return {
      id: job.id,
      imageUrl,
    };
  };



  
  const uploadCad = async (file: File) => {
    setUploadError("");
    setPipelineError("");
    setUploadingCad(true);

    try {
      const payload = new FormData();
      payload.append("file", file);

      const response = await fetch("/api/youcam/file/upload", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        throw new Error("Upload failed. Ensure server is running and file type is valid.");
      }

      const data: CadUploadResponse = await response.json();
      const fileId = data.file_id;
      if (!fileId) {
        throw new Error("Upload succeeded but file_id was not returned.");
      }
      setCadFileId(fileId);
      setCadFileName(file.name);

      console.log("[uploadCad] File id:", fileId);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      setCadFileId("");
      setCadFileName("");
    } finally {
      setUploadingCad(false);
    }
  };

  const runPipeline = async () => {
    setPipelineError("");

    if (uploadingCad) {
      setPipelineError("Wait for CAD upload to finish before starting renditions.");
      return;
    }

    if (!cadFileId) {
      setPipelineError("Upload a CAD file before starting renditions.");
      return;
    }

    if (!garmentColor || !fabricTexture) {
      setPipelineError("Select color and fabric settings before starting renditions.");
      return;
    }

    if (archetypePromptJobs.length === 0) {
      setPipelineError("Select at least one archetype chip before running the VTO pipeline.");
      return;
    }

    setRunningPipeline(true);
    setRunningArchetypeIds(archetypePromptJobs.map((job) => job.id));
    setArchetypePipelineErrorsById((current) => {
      const next = { ...current };
      for (const job of archetypePromptJobs) {
        delete next[job.id];
      }
      return next;
    });
    setArchetypeImagesById({});
    setArchetypeLayerStackById({});

    try {
      const results = await Promise.all(
        archetypePromptJobs.map((job) => runArchetypeJob(job))
      );

      const mappedImages: Record<number, string> = {};
      for (const item of results) {
        if (item.imageUrl) {
          mappedImages[item.id] = item.imageUrl;
        }
      }

      if (Object.keys(mappedImages).length === 0) {
        throw new Error("Renditions completed but no output images were returned.");
      }

      setArchetypeImagesById(mappedImages);
    } catch (error) {
      setPipelineError(error instanceof Error ? error.message : "Rendition pipeline failed");
    } finally {
      setRunningPipeline(false);
      setRunningArchetypeIds([]);
    }
  };

  const runSingleArchetypePipeline = async (job: ArchetypePromptJob) => {
    setPipelineError("");
    setArchetypePipelineErrorsById((current) => ({
      ...current,
      [job.id]: "",
    }));

    if (uploadingCad) {
      const message = "Wait for CAD upload to finish before updating this rendition.";
      setArchetypePipelineErrorsById((current) => ({
        ...current,
        [job.id]: message,
      }));
      return;
    }

    if (!cadFileId) {
      const message = "Upload a CAD file before updating this rendition.";
      setArchetypePipelineErrorsById((current) => ({
        ...current,
        [job.id]: message,
      }));
      return;
    }

    setRunningArchetypeIds((current) => (current.includes(job.id) ? current : [...current, job.id]));

    try {
      const result = await runArchetypeJob(job);
      if (!result.imageUrl) {
        throw new Error("Rendition completed but no output image was returned.");
      }

      setArchetypeImagesById((current) => ({
        ...current,
        [job.id]: result.imageUrl,
      }));
    } catch (error) {
      setArchetypePipelineErrorsById((current) => ({
        ...current,
        [job.id]: error instanceof Error ? error.message : "Card rendition failed",
      }));
    } finally {
      setRunningArchetypeIds((current) => current.filter((id) => id !== job.id));
    }
  };

  const registerImageUrlAsSource = async (imageUrl: string): Promise<string> => {
    const response = await fetch("/api/youcam/file/upload-from-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl }),
    });
    if (!response.ok) {
      throw new Error("Could not register the current render as a base image.");
    }
    const data = await response.json().catch(() => ({}));
    const fileId = typeof data?.file_id === "string" ? data.file_id : "";
    if (!fileId) {
      throw new Error("Base image registration did not return a file id.");
    }
    return fileId;
  };

  const uploadAccessoryCad = async (file: File): Promise<string> => {
    const payload = new FormData();
    payload.append("file", file);
    const response = await fetch("/api/youcam/file/upload", { method: "POST", body: payload });
    if (!response.ok) {
      throw new Error("Accessory upload failed. Check the file type and try again.");
    }
    const data: CadUploadResponse = await response.json();
    if (!data.file_id) {
      throw new Error("Accessory upload succeeded but no file id was returned.");
    }
    return data.file_id;
  };

  // Hosts the accessory on our own server so YouCam can fetch it as a ref_file_url.
  const uploadAccessoryPublicUrl = async (file: File): Promise<string> => {
    const payload = new FormData();
    payload.append("file", file);
    const response = await fetch("/api/cad/upload", { method: "POST", body: payload });
    if (!response.ok) {
      throw new Error("Accessory hosting failed.");
    }
    const data = await response.json().catch(() => ({}));
    const url = typeof data?.cad_image_url === "string" ? data.cad_image_url : "";
    if (!url) {
      throw new Error("Accessory hosting did not return a URL.");
    }
    return url;
  };

  // Direct-URL path (YouCam's recommended chaining): pass the fresh base render URL and
  // the accessory URL straight to cloth-v3, no download/re-upload.
  const runDirectClothLayer = async (baseImageUrl: string, accessoryFile: File): Promise<string> => {
    const accessoryUrl = await uploadAccessoryPublicUrl(accessoryFile);
    const response = await fetch("/api/youcam/layer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base_image_url: baseImageUrl, accessory_image_url: accessoryUrl }),
    });
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const message =
        typeof errorPayload?.detail === "string"
          ? errorPayload.detail
          : `Direct layer failed: ${response.status} ${response.statusText}`;
      throw new Error(message);
    }
    const final = await response.json().catch(() => ({}));
    const url = typeof final?.output_image_url === "string" ? final.output_image_url : "";
    if (!url) {
      throw new Error("Direct layer completed but no output image was returned.");
    }
    return url;
  };

  // Fallback: multi-source image-to-image using file ids (uploads bytes to YouCam directly,
  // so it works even when the accessory URL is not publicly reachable, e.g. localhost).
  const runFileIdLayer = async (
    baseImageUrl: string,
    accessoryFile: File,
    accessoryPrompt: string
  ): Promise<string> => {
    const [baseFileId, accessoryFileId] = await Promise.all([
      registerImageUrlAsSource(baseImageUrl),
      uploadAccessoryCad(accessoryFile),
    ]);

    const detail = accessoryPrompt.trim() ? ` The accessory is: ${accessoryPrompt.trim()}.` : "";
    const layerPrompt = clampPrompt(
      `Keep the model, face, pose, background and existing garment from the first image exactly as-is. ` +
        `Add the item shown in the second reference image onto the model, fitted naturally with realistic drape, shadows and occlusion.${detail} ` +
        `Photorealistic, ultra-HD, editorial. Do not alter the face or the existing outfit.`
    );

    const response = await fetch("/api/youcam/image-to-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        src_file_ids: [baseFileId, accessoryFileId],
        prompt: layerPrompt,
        model: "youcam-image-v2",
        size: "928*1664",
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const message =
        typeof errorPayload?.detail === "string"
          ? errorPayload.detail
          : `Layer render failed: ${response.status} ${response.statusText}`;
      throw new Error(message);
    }

    const final = await response.json().catch(() => ({}));
    const url = typeof final?.output_image_url === "string" ? final.output_image_url : "";
    if (!url) {
      throw new Error("Layer render completed but no output image was returned.");
    }
    return url;
  };

  // Layers an accessory onto a card's current render. Tries the direct-URL cloth-v3 path
  // first, then falls back to the multi-source file-id path.
  const addLayerToArchetype = async (archetypeId: number, accessoryFile: File, accessoryPrompt: string) => {
    setArchetypePipelineErrorsById((current) => ({ ...current, [archetypeId]: "" }));

    const baseImageUrl = archetypeImagesById[archetypeId];
    if (!baseImageUrl) {
      setArchetypePipelineErrorsById((current) => ({
        ...current,
        [archetypeId]: "Render this card before adding a layer.",
      }));
      return;
    }
    if (!accessoryFile) {
      setArchetypePipelineErrorsById((current) => ({
        ...current,
        [archetypeId]: "Upload an accessory CAD to layer.",
      }));
      return;
    }

    setRunningArchetypeIds((current) => (current.includes(archetypeId) ? current : [...current, archetypeId]));

    try {
      let layeredUrl = "";
      try {
        layeredUrl = await runDirectClothLayer(baseImageUrl, accessoryFile);
      } catch (directError) {
        console.warn("[addLayer] Direct cloth-v3 path failed, falling back to file ids.", directError);
        layeredUrl = await runFileIdLayer(baseImageUrl, accessoryFile, accessoryPrompt);
      }

      setArchetypeLayerStackById((current) => ({
        ...current,
        [archetypeId]: [...(current[archetypeId] || []), baseImageUrl],
      }));
      setArchetypeImagesById((current) => ({ ...current, [archetypeId]: layeredUrl }));
    } catch (error) {
      setArchetypePipelineErrorsById((current) => ({
        ...current,
        [archetypeId]: error instanceof Error ? error.message : "Failed to add layer",
      }));
    } finally {
      setRunningArchetypeIds((current) => current.filter((id) => id !== archetypeId));
    }
  };

  const undoArchetypeLayer = (archetypeId: number) => {
    setArchetypeLayerStackById((currentStacks) => {
      const stack = currentStacks[archetypeId] || [];
      if (stack.length === 0) {
        return currentStacks;
      }
      const previousImage = stack[stack.length - 1];
      setArchetypeImagesById((currentImages) => ({ ...currentImages, [archetypeId]: previousImage }));
      return { ...currentStacks, [archetypeId]: stack.slice(0, -1) };
    });
  };

  const handleCadFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    updatePreviewFromFile(file);
    await uploadCad(file);
    event.target.value = "";
  };

  const handleCadDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    updatePreviewFromFile(file);
    await uploadCad(file);
  };

  const handleCadDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleCadDragLeave = () => {
    setDragActive(false);
  };

  const clearCadSelection = () => {
    if (previewObjectUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }
    previewObjectUrlRef.current = null;
    setCadImageUrl("");
    setCadFileName("");
    setCadFileId("");
    setUploadError("");
    setPipelineError("");
    setDragActive(false);
    setArchetypeImagesById({});
    setArchetypeLayerStackById({});
    setRunningArchetypeIds([]);
    setArchetypePipelineErrorsById({});
  };

  return {
    cadImageUrl,
    cadFileName,
    uploadingCad,
    uploadError,
    runningPipeline,
    pipelineError,
    dragActive,
    archetypeImagesById,
    archetypeLayerStackById,
    runningArchetypeIds,
    archetypePipelineErrorsById,
    handleCadFileSelect,
    handleCadDrop,
    handleCadDragOver,
    handleCadDragLeave,
    clearCadSelection,
    runPipeline,
    runSingleArchetypePipeline,
    addLayerToArchetype,
    undoArchetypeLayer,
  };
}
