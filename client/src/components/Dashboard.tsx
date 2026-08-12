import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import ContentStage from "./dashboard/ContentStage";
import ControlPanel from "./dashboard/ControlPanel";
import TopBar from "./dashboard/TopBar";
import { useCadUpload } from "./dashboard/hooks/useCadUpload";
import { useArchetypes } from "./dashboard/hooks/useArchetypes";
import { FABRIC_TEXTURE_OPTIONS } from "./dashboard/control-panel/FabricTextureSelect";
import {
  BODY_TYPE_OPTIONS,
  TARGET_GENDER_OPTIONS,
  DRAPE_TYPE_OPTIONS,
  LIGHTING_OPTIONS,
  POSE_OPTIONS,
  DEFAULT_FABRIC_WEIGHT,
  DEFAULT_PRINT_SCALE,
} from "./dashboard/control-panel/FabricSpecSection";
import type { ArchetypeRenderSpec } from "./dashboard/types";
import { PROJECT_NAME } from "./dashboard/control-panel/ProjectSection";
import { exportCombinedTechPack } from "./dashboard/content-stage/techPack";

export default function Dashboard() {
  const navigate = useNavigate();
  const [color, setColor] = useState("#C85A17");
  const [fabricTexture, setFabricTexture] = useState<string>(FABRIC_TEXTURE_OPTIONS[0]);
  const [targetGender, setTargetGender] = useState<(typeof TARGET_GENDER_OPTIONS)[number]>(TARGET_GENDER_OPTIONS[0]);
  const [bodyType, setBodyType] = useState<(typeof BODY_TYPE_OPTIONS)[number]>(BODY_TYPE_OPTIONS[0]);
  const [fabricWeight, setFabricWeight] = useState<number>(DEFAULT_FABRIC_WEIGHT);
  const [drapeType, setDrapeType] = useState<string>(DRAPE_TYPE_OPTIONS[0]);
  const [lighting, setLighting] = useState<string>(LIGHTING_OPTIONS[0]);
  const [printScale, setPrintScale] = useState<number>(DEFAULT_PRINT_SCALE);
  const [pose, setPose] = useState<string>(POSE_OPTIONS[0]);
  const [cadDescription, setCadDescription] = useState("");
  const [selectedArchetypeIds, setSelectedArchetypeIds] = useState<number[]>([]);
  const [archetypeRenderSpecById, setArchetypeRenderSpecById] = useState<Record<number, ArchetypeRenderSpec>>({});
  const previousArchetypeSnapshotKeyRef = useRef("");

  const { archetypes, updateArchetypePrompt } = useArchetypes();

  useEffect(() => {
    const nextArchetypeSnapshotKey = archetypes
      .map((item, index) => `${item.id || index + 1}`)
      .join("|");
    if (!nextArchetypeSnapshotKey) {
      return;
    }

    if (previousArchetypeSnapshotKeyRef.current !== nextArchetypeSnapshotKey) {
      setSelectedArchetypeIds([]);
      setArchetypeRenderSpecById({});
      previousArchetypeSnapshotKeyRef.current = nextArchetypeSnapshotKey;
    }
  }, [archetypes]);

  const selectedArchetypeIdSet = useMemo(() => new Set(selectedArchetypeIds), [selectedArchetypeIds]);
  const defaultRenderSpec = useMemo<ArchetypeRenderSpec>(
    () => ({
      color,
      fabricTexture,
      targetGender,
      bodyType,
      extendedPrompt: "",
      fabricWeight,
      drapeType,
      lighting,
      printScale,
      pose,
    }),
    [color, fabricTexture, targetGender, bodyType, fabricWeight, drapeType, lighting, printScale, pose]
  );

  const archetypePromptJobs = archetypes
    .map((item, index) => ({
      id: item.id || index + 1,
      basePrompt: (item.prompt || item.type).trim(),
    }))
    .filter((job) => selectedArchetypeIdSet.has(job.id))
    .map((job) => {
      const spec = archetypeRenderSpecById[job.id] || defaultRenderSpec;
      return {
        id: job.id,
        prompt: job.basePrompt,
        extendedPrompt: spec.extendedPrompt.trim(),
        garmentColor: spec.color,
        fabricTexture: spec.fabricTexture,
        cadDescription,
        targetGender: spec.targetGender,
        bodyType: spec.bodyType,
        fabricWeight: spec.fabricWeight,
        drapeType: spec.drapeType,
        lighting: spec.lighting,
        printScale: spec.printScale,
        pose: spec.pose,
      };
    });

  const handleArchetypeToggle = (archetypeId: number) => {
    setSelectedArchetypeIds((current) => {
      if (current.includes(archetypeId)) {
        return current.filter((id) => id !== archetypeId);
      }
      return [...current, archetypeId];
    });
  };

  const {
    cadImageUrl,
    cadFileName,
    uploadingCad,
    uploadError,
    runningPipeline,
    pipelineError,
    dragActive,
    archetypeImagesById,
    runningArchetypeIds,
    archetypePipelineErrorsById,
    archetypeLayerStackById,
    handleCadFileSelect,
    handleCadDrop,
    handleCadDragOver,
    handleCadDragLeave,
    clearCadSelection,
    runPipeline,
    runSingleArchetypePipeline,
    addLayerToArchetype,
    undoArchetypeLayer,
  } = useCadUpload(archetypePromptJobs, color, fabricTexture, cadDescription, targetGender, bodyType, fabricWeight, drapeType, lighting, printScale, pose);

  const handleArchetypeCardSaveAndRender = async (archetypeId: number, prompt: string, spec: ArchetypeRenderSpec) => {
    updateArchetypePrompt(archetypeId, prompt);
    setArchetypeRenderSpecById((current) => ({
      ...current,
      [archetypeId]: spec,
    }));

    await runSingleArchetypePipeline({
      id: archetypeId,
      prompt: prompt.trim(),
      extendedPrompt: spec.extendedPrompt.trim(),
      garmentColor: spec.color,
      fabricTexture: spec.fabricTexture,
      cadDescription,
      targetGender: spec.targetGender,
      bodyType: spec.bodyType,
      fabricWeight: spec.fabricWeight,
      drapeType: spec.drapeType,
      lighting: spec.lighting,
      printScale: spec.printScale,
      pose: spec.pose,
    });
  };

  const handleCadClear = () => {
    clearCadSelection();
    setCadDescription("");
  };

  const handleExportCombinedReport = () => {
    const entries = archetypes
      .map((item, index) => {
        const id = item.id || index + 1;
        const renderedImageUrl = item.img || archetypeImagesById[id];
        if (!renderedImageUrl) {
          return null;
        }
        return {
          item,
          spec: archetypeRenderSpecById[id] || defaultRenderSpec,
          renderedImageUrl,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    void exportCombinedTechPack({
      entries,
      cadImageUrl,
      cadDescription,
      projectName: PROJECT_NAME,
    });
  };



  return (
    <div className="dashboard-shell">
      <div className="dashboard-noise" aria-hidden="true" />

      <TopBar onExportReport={handleExportCombinedReport} onSwitchMode={() => navigate("/")} />

      <main className="dashboard-grid">
        <ControlPanel
          cadFileName={cadFileName}
          draggingCad={dragActive}
          uploadingCad={uploadingCad}
          uploadError={uploadError}
          cadImageUrl={cadImageUrl}
          cadDescription={cadDescription}
          color={color}
          fabricTexture={fabricTexture}
          targetGender={targetGender}
          bodyType={bodyType}
          fabricWeight={fabricWeight}
          drapeType={drapeType}
          lighting={lighting}
          printScale={printScale}
          pose={pose}
          runningPipeline={runningPipeline}
          pipelineError={pipelineError}
          selectedArchetypeCount={archetypePromptJobs.length}
          onCadDragOver={handleCadDragOver}
          onCadDragLeave={handleCadDragLeave}
          onCadDrop={handleCadDrop}
          onCadFileSelect={handleCadFileSelect}
          onCadClear={handleCadClear}
          onCadDescriptionChange={setCadDescription}
          onFabricTextureChange={setFabricTexture}
          onColorChange={setColor}
          onTargetGenderChange={setTargetGender}
          onBodyTypeChange={setBodyType}
          onFabricWeightChange={setFabricWeight}
          onDrapeTypeChange={setDrapeType}
          onLightingChange={setLighting}
          onPrintScaleChange={setPrintScale}
          onPoseChange={setPose}
          onRunPipeline={runPipeline}
        />

        <ContentStage
          archetypes={archetypes}
          selectedArchetypeIds={selectedArchetypeIds}
          onArchetypeToggle={handleArchetypeToggle}
          archetypeRenderSpecById={archetypeRenderSpecById}
          defaultRenderSpec={defaultRenderSpec}
          runningArchetypeIds={runningArchetypeIds}
          archetypePipelineErrorsById={archetypePipelineErrorsById}
          onArchetypeSaveAndRender={handleArchetypeCardSaveAndRender}
          archetypeImagesById={archetypeImagesById}
          archetypeLayerStackById={archetypeLayerStackById}
          onAddArchetypeLayer={addLayerToArchetype}
          onUndoArchetypeLayer={undoArchetypeLayer}
          cadImageUrl={cadImageUrl}
          cadDescription={cadDescription}
          projectName={PROJECT_NAME}
        />
      </main>
    </div>
  );
}
