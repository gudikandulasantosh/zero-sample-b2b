import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

import type { AnalyzeResponse, GarmentPreset, SelfieUploadResponse, TryonResponse } from "./types";

async function readError(response: Response, fallback: string): Promise<string> {
  const payload = await response.json().catch(() => ({}));
  if (payload && typeof payload.detail === "string") {
    return payload.detail;
  }
  return fallback;
}

export function useConcierge() {
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState("");
  const [selfieFileName, setSelfieFileName] = useState("");
  const [selfieFileId, setSelfieFileId] = useState("");
  const [selfieHostedUrl, setSelfieHostedUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [analysisError, setAnalysisError] = useState("");

  const [renderingPresetId, setRenderingPresetId] = useState("");
  const [renderResult, setRenderResult] = useState<TryonResponse | null>(null);
  const [renderError, setRenderError] = useState("");

  const previewObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  const updatePreviewFromFile = (file: File) => {
    if (previewObjectUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }
    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    setSelfiePreviewUrl(objectUrl);
  };

  const uploadSelfie = async (file: File) => {
    setUploadError("");
    setAnalysisError("");
    setRenderError("");
    setAnalysis(null);
    setRenderResult(null);
    setUploading(true);

    try {
      updatePreviewFromFile(file);

      const youcamForm = new FormData();
      youcamForm.append("file", file);
      const youcamResponse = await fetch("/api/youcam/file/upload", {
        method: "POST",
        body: youcamForm,
      });
      if (!youcamResponse.ok) {
        throw new Error(await readError(youcamResponse, "Selfie upload failed."));
      }
      const youcamData: SelfieUploadResponse = await youcamResponse.json();
      if (!youcamData.file_id) {
        throw new Error("Upload succeeded but no file_id was returned.");
      }
      setSelfieFileId(youcamData.file_id);
      setSelfieFileName(file.name);

      // Also host the selfie so cloth-v3 can fetch it as src_file_url during try-on.
      const hostForm = new FormData();
      hostForm.append("file", file);
      const hostResponse = await fetch("/api/cad/upload", { method: "POST", body: hostForm });
      if (hostResponse.ok) {
        const hostData = await hostResponse.json().catch(() => ({}));
        if (typeof hostData?.cad_image_url === "string") {
          setSelfieHostedUrl(hostData.cad_image_url);
        }
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Selfie upload failed.");
      setSelfieFileId("");
      setSelfieFileName("");
      setSelfieHostedUrl("");
    } finally {
      setUploading(false);
    }
  };

  const handleSelfieSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      void uploadSelfie(file);
    }
    event.target.value = "";
  };

  const handleSelfieDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      void uploadSelfie(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  };

  const clearSelfie = () => {
    if (previewObjectUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }
    previewObjectUrlRef.current = null;
    setSelfiePreviewUrl("");
    setSelfieFileName("");
    setSelfieFileId("");
    setSelfieHostedUrl("");
    setAnalysis(null);
    setRenderResult(null);
    setUploadError("");
    setAnalysisError("");
    setRenderError("");
  };

  const analyzeSkin = async () => {
    setAnalysisError("");
    setRenderResult(null);

    if (uploading) {
      setAnalysisError("Wait for the selfie upload to finish before scanning.");
      return;
    }
    if (!selfieFileId) {
      setAnalysisError("Upload a selfie before running the skin scan.");
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch("/api/concierge/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ src_file_id: selfieFileId, src_file_url: selfieHostedUrl || undefined }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Skin analysis failed."));
      }
      const data: AnalyzeResponse = await response.json();
      setAnalysis(data);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Skin analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const renderGarment = async (preset: GarmentPreset) => {
    setRenderError("");

    if (!selfieHostedUrl && !selfiePreviewUrl) {
      setRenderError("Upload a selfie before rendering a look.");
      return;
    }

    setRenderingPresetId(preset.id);
    try {
      const response = await fetch("/api/concierge/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_selfie_url: selfieHostedUrl || selfiePreviewUrl,
          preset_id: preset.id,
        }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Try-on render failed."));
      }
      const data: TryonResponse = await response.json();
      setRenderResult(data);
    } catch (error) {
      setRenderError(error instanceof Error ? error.message : "Try-on render failed.");
    } finally {
      setRenderingPresetId("");
    }
  };

  return {
    selfiePreviewUrl,
    selfieFileName,
    selfieFileId,
    uploading,
    uploadError,
    dragActive,
    analyzing,
    analysis,
    analysisError,
    renderingPresetId,
    renderResult,
    renderError,
    handleSelfieSelect,
    handleSelfieDrop,
    handleDragOver,
    handleDragLeave,
    clearSelfie,
    analyzeSkin,
    renderGarment,
  };
}
