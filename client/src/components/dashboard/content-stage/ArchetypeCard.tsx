import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Download, FileText, Layers, Maximize2, Pencil, Undo2, X, ZoomIn, ZoomOut } from "lucide-react";

import { FABRIC_TEXTURE_OPTIONS } from "../control-panel/FabricTextureSelect";
import {
  BODY_TYPE_OPTIONS,
  TARGET_GENDER_OPTIONS,
  DRAPE_TYPE_OPTIONS,
  LIGHTING_OPTIONS,
  POSE_OPTIONS,
  FABRIC_WEIGHT_MIN,
  FABRIC_WEIGHT_MAX,
  DEFAULT_FABRIC_WEIGHT,
  PRINT_SCALE_MIN,
  PRINT_SCALE_MAX,
  DEFAULT_PRINT_SCALE,
  type BodyType,
  type TargetGender,
} from "../control-panel/FabricSpecSection";
import type { Archetype, ArchetypeRenderSpec } from "../types";
import { downloadImageFromUrl } from "./downloadImage";
import { analyzeContrast } from "./contrast";
import { exportTechPack } from "./techPack";

type ArchetypeCardProps = {
  archetypeId: number;
  item: Archetype;
  imageUrl?: string;
  isSelected: boolean;
  renderSpec: ArchetypeRenderSpec;
  isRendering: boolean;
  renderError: string;
  cadImageUrl?: string;
  cadDescription?: string;
  projectName?: string;
  layerCount: number;
  onAddLayer: (archetypeId: number, accessoryFile: File, accessoryPrompt: string) => Promise<void>;
  onUndoLayer: (archetypeId: number) => void;
  onSaveAndRender: (archetypeId: number, prompt: string, spec: ArchetypeRenderSpec) => Promise<void>;
};

function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    const expanded = trimmed
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
    return `#${expanded}`.toUpperCase();
  }
  return null;
}

export default function ArchetypeCard({
  archetypeId,
  item,
  imageUrl,
  isSelected,
  renderSpec,
  isRendering,
  renderError,
  cadImageUrl,
  cadDescription,
  projectName,
  layerCount,
  onAddLayer,
  onUndoLayer,
  onSaveAndRender,
}: ArchetypeCardProps) {
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState(item.prompt || item.type);
  const [draftExtendedPrompt, setDraftExtendedPrompt] = useState(renderSpec.extendedPrompt || "");
  const [draftColor, setDraftColor] = useState(renderSpec.color || "#C85A17");
  const [draftFabricTexture, setDraftFabricTexture] = useState(renderSpec.fabricTexture || FABRIC_TEXTURE_OPTIONS[0]);
  const [draftTargetGender, setDraftTargetGender] = useState<TargetGender>(
    TARGET_GENDER_OPTIONS.includes(renderSpec.targetGender as TargetGender)
      ? (renderSpec.targetGender as TargetGender)
      : TARGET_GENDER_OPTIONS[0]
  );
  const [draftBodyType, setDraftBodyType] = useState<BodyType>(
    BODY_TYPE_OPTIONS.includes(renderSpec.bodyType as BodyType)
      ? (renderSpec.bodyType as BodyType)
      : BODY_TYPE_OPTIONS[0]
  );
  const [draftFabricWeight, setDraftFabricWeight] = useState<number>(renderSpec.fabricWeight ?? DEFAULT_FABRIC_WEIGHT);
  const [draftDrapeType, setDraftDrapeType] = useState<string>(renderSpec.drapeType || DRAPE_TYPE_OPTIONS[0]);
  const [draftLighting, setDraftLighting] = useState<string>(renderSpec.lighting || LIGHTING_OPTIONS[0]);
  const [draftPrintScale, setDraftPrintScale] = useState<number>(renderSpec.printScale ?? DEFAULT_PRINT_SCALE);
  const [draftPose, setDraftPose] = useState<string>(renderSpec.pose || POSE_OPTIONS[0]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [fitSize, setFitSize] = useState<{ width: number; height: number } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
  const [accessoryFile, setAccessoryFile] = useState<File | null>(null);
  const [accessoryPrompt, setAccessoryPrompt] = useState("");
  const stageRef = useRef<HTMLDivElement | null>(null);
  const naturalImageSizeRef = useRef<{ width: number; height: number } | null>(null);
  const currentPrompt = item.prompt || item.type;

  const contrast = useMemo(
    () => analyzeContrast(renderSpec.color, item.skinTone, item.type),
    [renderSpec.color, item.skinTone, item.type]
  );

  const hasPromptChanges = useMemo(() => {
    const normalizedColor = normalizeHexColor(draftColor) || draftColor.trim().toUpperCase();
    return (
      draftPrompt.trim() !== currentPrompt.trim() ||
      draftExtendedPrompt.trim() !== (renderSpec.extendedPrompt || "").trim() ||
      normalizedColor !== renderSpec.color.toUpperCase() ||
      draftFabricTexture !== renderSpec.fabricTexture ||
      draftTargetGender !== (renderSpec.targetGender as TargetGender) ||
      draftBodyType !== (renderSpec.bodyType as BodyType) ||
      draftFabricWeight !== (renderSpec.fabricWeight ?? DEFAULT_FABRIC_WEIGHT) ||
      draftDrapeType !== (renderSpec.drapeType || DRAPE_TYPE_OPTIONS[0]) ||
      draftLighting !== (renderSpec.lighting || LIGHTING_OPTIONS[0]) ||
      draftPrintScale !== (renderSpec.printScale ?? DEFAULT_PRINT_SCALE) ||
      draftPose !== (renderSpec.pose || POSE_OPTIONS[0])
    );
  }, [
    currentPrompt,
    draftBodyType,
    draftColor,
    draftDrapeType,
    draftExtendedPrompt,
    draftFabricTexture,
    draftFabricWeight,
    draftLighting,
    draftPose,
    draftPrintScale,
    draftPrompt,
    draftTargetGender,
    renderSpec.bodyType,
    renderSpec.color,
    renderSpec.drapeType,
    renderSpec.extendedPrompt,
    renderSpec.fabricTexture,
    renderSpec.fabricWeight,
    renderSpec.lighting,
    renderSpec.pose,
    renderSpec.printScale,
    renderSpec.targetGender,
  ]);

  const handleOpenEditor = () => {
    setDraftPrompt(currentPrompt);
    setDraftExtendedPrompt(renderSpec.extendedPrompt || "");
    setDraftColor(renderSpec.color || "#C85A17");
    setDraftFabricTexture(renderSpec.fabricTexture || FABRIC_TEXTURE_OPTIONS[0]);
    setDraftTargetGender(
      TARGET_GENDER_OPTIONS.includes(renderSpec.targetGender as TargetGender)
        ? (renderSpec.targetGender as TargetGender)
        : TARGET_GENDER_OPTIONS[0]
    );
    setDraftBodyType(
      BODY_TYPE_OPTIONS.includes(renderSpec.bodyType as BodyType)
        ? (renderSpec.bodyType as BodyType)
        : BODY_TYPE_OPTIONS[0]
    );
    setDraftFabricWeight(renderSpec.fabricWeight ?? DEFAULT_FABRIC_WEIGHT);
    setDraftDrapeType(renderSpec.drapeType || DRAPE_TYPE_OPTIONS[0]);
    setDraftLighting(renderSpec.lighting || LIGHTING_OPTIONS[0]);
    setDraftPrintScale(renderSpec.printScale ?? DEFAULT_PRINT_SCALE);
    setDraftPose(renderSpec.pose || POSE_OPTIONS[0]);
    setIsPromptEditorOpen(true);
  };

  const handleSavePrompt = async () => {
    const normalized = draftPrompt.trim();
    if (!normalized) {
      return;
    }

    const normalizedColor = normalizeHexColor(draftColor) || renderSpec.color;
    const nextSpec: ArchetypeRenderSpec = {
      color: normalizedColor,
      fabricTexture: draftFabricTexture,
      targetGender: draftTargetGender,
      bodyType: draftBodyType,
      extendedPrompt: draftExtendedPrompt.trim(),
      fabricWeight: draftFabricWeight,
      drapeType: draftDrapeType,
      lighting: draftLighting,
      printScale: draftPrintScale,
      pose: draftPose,
    };

    await onSaveAndRender(archetypeId, normalized, nextSpec);
    setDraftColor(normalizedColor);
    setIsPromptEditorOpen(false);
  };

  const handleExportTechPack = () => {
    exportTechPack({
      item,
      spec: renderSpec,
      renderedImageUrl: imageUrl,
      cadImageUrl,
      cadDescription,
      projectName,
    });
  };

  const handleApplyLayer = async () => {
    if (!accessoryFile) {
      return;
    }
    await onAddLayer(archetypeId, accessoryFile, accessoryPrompt);
    setAccessoryFile(null);
    setAccessoryPrompt("");
    setIsLayerPanelOpen(false);
  };

  const handleModalClose = () => {
    setIsImageModalOpen(false);
    setZoomLevel(1);
  };

  const handleDownload = async () => {
    if (!imageUrl || isDownloading) {
      return;
    }

    setIsDownloading(true);
    try {
      await downloadImageFromUrl(imageUrl, item.type);
    } finally {
      setIsDownloading(false);
    }
  };

  const updateFitSize = (naturalWidth: number, naturalHeight: number) => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const stageRect = stage.getBoundingClientRect();
    const availableWidth = Math.max(1, stageRect.width - 8);
    const availableHeight = Math.max(1, stageRect.height - 8);
    const fitScale = Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight);

    setFitSize({
      width: Math.max(1, Math.round(naturalWidth * fitScale)),
      height: Math.max(1, Math.round(naturalHeight * fitScale)),
    });
  };

  useEffect(() => {
    if (!isImageModalOpen) {
      return;
    }

    const handleResize = () => {
      const naturalSize = naturalImageSizeRef.current;
      if (!naturalSize) {
        return;
      }
      updateFitSize(naturalSize.width, naturalSize.height);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isImageModalOpen]);

  const imageModal =
    isImageModalOpen && imageUrl && typeof document !== "undefined"
      ? createPortal(
          <div className="profile-image-modal-backdrop" role="presentation" onClick={handleModalClose}>
            <div className="profile-image-modal" role="dialog" aria-modal="true" aria-label={`${item.type} image preview`} onClick={(event) => event.stopPropagation()}>
              <div className="profile-image-modal-toolbar">
                <div className="profile-image-modal-controls">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setZoomLevel((current) => Math.max(0.8, current - 0.2))}
                    aria-label="Zoom out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setZoomLevel(1)}
                    aria-label="Reset zoom"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setZoomLevel((current) => Math.min(3, current + 0.2))}
                    aria-label="Zoom in"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={handleDownload}
                    aria-label="Download preview image"
                    disabled={isDownloading}
                  >
                    <Download size={14} />
                    {isDownloading ? "Downloading..." : "Download"}
                  </button>
                </div>
                <button type="button" className="ghost-btn" onClick={handleModalClose} aria-label="Close preview">
                  <X size={15} />
                </button>
              </div>
              <div className="profile-image-modal-stage" ref={stageRef}>
                <div
                  className="profile-image-modal-canvas"
                  style={
                    fitSize
                      ? {
                          width: `${Math.round(fitSize.width * zoomLevel)}px`,
                          height: `${Math.round(fitSize.height * zoomLevel)}px`,
                        }
                      : { width: `${Math.round(zoomLevel * 100)}%` }
                  }
                >
                  <img
                    src={imageUrl}
                    alt={item.type}
                    className="profile-image-modal-image"
                    onLoad={(event) => {
                      const naturalWidth = event.currentTarget.naturalWidth;
                      const naturalHeight = event.currentTarget.naturalHeight;
                      naturalImageSizeRef.current = { width: naturalWidth, height: naturalHeight };
                      updateFitSize(naturalWidth, naturalHeight);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <article className={`profile-card ${isSelected ? "is-selected" : ""}`}>
        <div className="profile-image-wrap">
          {imageUrl ? (
            <>
              <img src={imageUrl} alt={item.type} className="profile-image" />
              <button
                type="button"
                className="profile-image-action"
                onClick={() => setIsImageModalOpen(true)}
                aria-label={`Open enlarged preview for ${item.type}`}
              >
                <Maximize2 size={15} />
                Preview
              </button>
            </>
          ) : (
            <div className="visual-output-empty">No Image</div>
          )}
          <div className="profile-gradient" aria-hidden="true" />
          <div className={`status-chip status-${item.status}`}>
            {item.status === "green" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            {item.score}%
          </div>
          {isRendering ? (
            <div className="profile-render-loader" role="status" aria-live="polite" aria-label="VTO pipeline running">
              <span className="profile-render-spinner" aria-hidden="true" />
              <span>Running VTO pipeline...</span>
            </div>
          ) : null}
        </div>

        <div className="profile-meta">
          <div>
            <p className="profile-type">
              {item.skinTone ? (
                <span className="skin-swatch" style={{ background: item.skinTone }} aria-hidden="true" />
              ) : null}
              {item.type}
            </p>
            <p className="profile-share">Prompt: {currentPrompt}</p>
          </div>
        </div>

        {contrast ? (
          <p className={`contrast-flag contrast-${contrast.level}`}>
            {contrast.level === "good" ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            <span>
              {contrast.message} <span className="contrast-ratio">({contrast.ratio}:1)</span>
            </span>
          </p>
        ) : null}

        <div className="profile-actions">
          {isPromptEditorOpen ? (
            <div className="profile-prompt-editor">
              <label htmlFor={`archetype-prompt-${archetypeId}`} className="field-label">
                Enhance prompt
              </label>
              <textarea
                id={`archetype-prompt-${archetypeId}`}
                className="field-input field-textarea"
                value={draftPrompt}
                onChange={(event) => setDraftPrompt(event.target.value)}
                placeholder="Add details to refine generated outputs"
              />

              <label htmlFor={`archetype-extended-prompt-${archetypeId}`} className="field-label">
                Additional prompt instructions
              </label>
              <textarea
                id={`archetype-extended-prompt-${archetypeId}`}
                className="field-input field-textarea"
                value={draftExtendedPrompt}
                onChange={(event) => setDraftExtendedPrompt(event.target.value)}
                placeholder="Add extra instructions for this card only"
              />

              <div className="profile-inline-spec-grid">
                <div>
                  <label htmlFor={`archetype-color-${archetypeId}`} className="field-label">
                    Garment color spec
                  </label>
                  <div className="color-field profile-inline-color">
                    <input
                      id={`archetype-color-picker-${archetypeId}`}
                      type="color"
                      value={normalizeHexColor(draftColor) || "#C85A17"}
                      onChange={(event) => setDraftColor(event.target.value.toUpperCase())}
                      aria-label="Garment color"
                    />
                    <input
                      id={`archetype-color-${archetypeId}`}
                      type="text"
                      className="field-input"
                      value={draftColor}
                      onChange={(event) => setDraftColor(event.target.value)}
                      onBlur={() => {
                        const normalizedColor = normalizeHexColor(draftColor);
                        if (normalizedColor) {
                          setDraftColor(normalizedColor);
                        }
                      }}
                      placeholder="#C85A17"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={`archetype-fabric-${archetypeId}`} className="field-label">
                    Fabric texture
                  </label>
                  <select
                    id={`archetype-fabric-${archetypeId}`}
                    className="field-input"
                    value={draftFabricTexture}
                    onChange={(event) => setDraftFabricTexture(event.target.value)}
                  >
                    {FABRIC_TEXTURE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`archetype-gender-${archetypeId}`} className="field-label">
                    Apply design to
                  </label>
                  <select
                    id={`archetype-gender-${archetypeId}`}
                    className="field-input"
                    value={draftTargetGender}
                    onChange={(event) => setDraftTargetGender(event.target.value as TargetGender)}
                  >
                    {TARGET_GENDER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`archetype-body-type-${archetypeId}`} className="field-label">
                    Body type
                  </label>
                  <select
                    id={`archetype-body-type-${archetypeId}`}
                    className="field-input"
                    value={draftBodyType}
                    onChange={(event) => setDraftBodyType(event.target.value as BodyType)}
                  >
                    {BODY_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`archetype-drape-${archetypeId}`} className="field-label">
                    Sheen / drape
                  </label>
                  <select
                    id={`archetype-drape-${archetypeId}`}
                    className="field-input"
                    value={draftDrapeType}
                    onChange={(event) => setDraftDrapeType(event.target.value)}
                  >
                    {DRAPE_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`archetype-lighting-${archetypeId}`} className="field-label">
                    Venue lighting
                  </label>
                  <select
                    id={`archetype-lighting-${archetypeId}`}
                    className="field-input"
                    value={draftLighting}
                    onChange={(event) => setDraftLighting(event.target.value)}
                  >
                    {LIGHTING_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`archetype-pose-${archetypeId}`} className="field-label">
                    Model pose
                  </label>
                  <select
                    id={`archetype-pose-${archetypeId}`}
                    className="field-input"
                    value={draftPose}
                    onChange={(event) => setDraftPose(event.target.value)}
                  >
                    {POSE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`archetype-weight-${archetypeId}`} className="field-label">
                    Fabric weight ({draftFabricWeight} GSM)
                  </label>
                  <input
                    id={`archetype-weight-${archetypeId}`}
                    type="range"
                    className="field-slider"
                    min={FABRIC_WEIGHT_MIN}
                    max={FABRIC_WEIGHT_MAX}
                    step={5}
                    value={draftFabricWeight}
                    onChange={(event) => setDraftFabricWeight(Number(event.target.value))}
                  />
                </div>

                <div>
                  <label htmlFor={`archetype-print-${archetypeId}`} className="field-label">
                    Print scale ({draftPrintScale}%)
                  </label>
                  <input
                    id={`archetype-print-${archetypeId}`}
                    type="range"
                    className="field-slider"
                    min={PRINT_SCALE_MIN}
                    max={PRINT_SCALE_MAX}
                    step={5}
                    value={draftPrintScale}
                    onChange={(event) => setDraftPrintScale(Number(event.target.value))}
                  />
                </div>
              </div>

              {renderError ? <p className="error-note inline-error">{renderError}</p> : null}

              <div className="profile-prompt-editor-actions">
                <button type="button" className="ghost-btn" onClick={() => setIsPromptEditorOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="save-prompt-btn"
                  onClick={handleSavePrompt}
                  disabled={isRendering || !hasPromptChanges || !draftPrompt.trim()}
                >
                  {isRendering ? "Updating..." : "Save & Re-render Card"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-action-row">
                <button type="button" className="ghost-btn profile-edit-btn" onClick={handleOpenEditor} disabled={isRendering}>
                  <Pencil size={14} />
                  {isRendering ? "Rendering..." : "Edit"}
                </button>
                <button
                  type="button"
                  className="ghost-btn profile-techpack-btn"
                  onClick={handleExportTechPack}
                  disabled={!imageUrl}
                  title={imageUrl ? "Export a factory-ready tech pack" : "Render this card first"}
                >
                  <FileText size={14} />
                  Tech Pack
                </button>
              </div>

              <div className="profile-action-row profile-layer-row">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setIsLayerPanelOpen((open) => !open)}
                  disabled={!imageUrl || isRendering}
                  title={imageUrl ? "Layer an accessory (hat, scarf...) onto this render" : "Render this card first"}
                >
                  <Layers size={14} />
                  Add layer
                </button>
                {layerCount > 0 ? (
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => onUndoLayer(archetypeId)}
                    disabled={isRendering}
                    title="Remove the most recent layer"
                  >
                    <Undo2 size={14} />
                    Undo ({layerCount})
                  </button>
                ) : null}
              </div>

              {isLayerPanelOpen ? (
                <div className="profile-prompt-editor profile-layer-editor">
                  <label htmlFor={`archetype-accessory-file-${archetypeId}`} className="field-label">
                    Accessory CAD (hat, scarf, belt...)
                  </label>
                  <input
                    id={`archetype-accessory-file-${archetypeId}`}
                    type="file"
                    className="field-input"
                    accept=".svg,.png,.jpg,.jpeg,.webp"
                    onChange={(event) => setAccessoryFile(event.target.files?.[0] || null)}
                  />

                  <label htmlFor={`archetype-accessory-prompt-${archetypeId}`} className="field-label">
                    Accessory description (optional)
                  </label>
                  <textarea
                    id={`archetype-accessory-prompt-${archetypeId}`}
                    className="field-input field-textarea"
                    value={accessoryPrompt}
                    onChange={(event) => setAccessoryPrompt(event.target.value)}
                    placeholder="e.g. wide-brim wool felt hat, worn slightly tilted"
                  />

                  {renderError ? <p className="error-note inline-error">{renderError}</p> : null}

                  <div className="profile-prompt-editor-actions">
                    <button type="button" className="ghost-btn" onClick={() => setIsLayerPanelOpen(false)}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="save-prompt-btn"
                      onClick={handleApplyLayer}
                      disabled={isRendering || !accessoryFile}
                    >
                      {isRendering ? "Layering..." : "Apply on top"}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </article>

      {imageModal}
    </>
  );
}