import { useEffect, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import CadSpecSection from "./control-panel/CadSpecSection";
import FabricSpecSection from "./control-panel/FabricSpecSection";
import type { BodyType, TargetGender } from "./control-panel/FabricSpecSection";
import ProjectSection from "./control-panel/ProjectSection";
import RunPipelineSection from "./control-panel/RunPipelineSection";

type ControlPanelProps = {
  cadFileName: string;
  draggingCad: boolean;
  uploadingCad: boolean;
  uploadError: string;
  cadImageUrl: string;
  cadDescription: string;
  color: string;
  fabricTexture: string;
  targetGender: TargetGender;
  bodyType: BodyType;
  fabricWeight: number;
  drapeType: string;
  lighting: string;
  printScale: number;
  pose: string;
  runningPipeline: boolean;
  pipelineError: string;
  selectedArchetypeCount: number;
  onCadDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onCadDragLeave: () => void;
  onCadDrop: (event: DragEvent<HTMLDivElement>) => void;
  onCadFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onCadClear: () => void;
  onCadDescriptionChange: (value: string) => void;
  onFabricTextureChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onTargetGenderChange: (value: TargetGender) => void;
  onBodyTypeChange: (value: BodyType) => void;
  onFabricWeightChange: (value: number) => void;
  onDrapeTypeChange: (value: string) => void;
  onLightingChange: (value: string) => void;
  onPrintScaleChange: (value: number) => void;
  onPoseChange: (value: string) => void;
  onRunPipeline: () => void;
};

export default function ControlPanel({
  cadFileName,
  draggingCad,
  uploadingCad,
  uploadError,
  cadImageUrl,
  cadDescription,
  color,
  fabricTexture,
  targetGender,
  bodyType,
  fabricWeight,
  drapeType,
  lighting,
  printScale,
  pose,
  runningPipeline,
  pipelineError,
  selectedArchetypeCount,
  onCadDragOver,
  onCadDragLeave,
  onCadDrop,
  onCadFileSelect,
  onCadClear,
  onCadDescriptionChange,
  onFabricTextureChange,
  onColorChange,
  onTargetGenderChange,
  onBodyTypeChange,
  onFabricWeightChange,
  onDrapeTypeChange,
  onLightingChange,
  onPrintScaleChange,
  onPoseChange,
  onRunPipeline,
}: ControlPanelProps) {
  const [showStickyRunSection, setShowStickyRunSection] = useState(false);

  useEffect(() => {
    const updateStickyVisibility = () => {
      setShowStickyRunSection(window.scrollY >= 250);
    };

    updateStickyVisibility();
    window.addEventListener("scroll", updateStickyVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateStickyVisibility);
    };
  }, []);

  return (
    <aside className="control-panel">
      <ProjectSection />

      <CadSpecSection
        cadFileName={cadFileName}
        draggingCad={draggingCad}
        uploadingCad={uploadingCad}
        uploadError={uploadError}
        cadImageUrl={cadImageUrl}
        cadDescription={cadDescription}
        onCadDragOver={onCadDragOver}
        onCadDragLeave={onCadDragLeave}
        onCadDrop={onCadDrop}
        onCadFileSelect={onCadFileSelect}
        onCadClear={onCadClear}
        onCadDescriptionChange={onCadDescriptionChange}
      />

      <FabricSpecSection
        fabricTexture={fabricTexture}
        color={color}
        targetGender={targetGender}
        bodyType={bodyType}
        fabricWeight={fabricWeight}
        drapeType={drapeType}
        lighting={lighting}
        printScale={printScale}
        pose={pose}
        onFabricTextureChange={onFabricTextureChange}
        onColorChange={onColorChange}
        onTargetGenderChange={onTargetGenderChange}
        onBodyTypeChange={onBodyTypeChange}
        onFabricWeightChange={onFabricWeightChange}
        onDrapeTypeChange={onDrapeTypeChange}
        onLightingChange={onLightingChange}
        onPrintScaleChange={onPrintScaleChange}
        onPoseChange={onPoseChange}
      />

      <div className={`control-panel-run-sticky ${showStickyRunSection ? "is-visible" : ""}`}>
        <RunPipelineSection
          loading={runningPipeline}
          pipelineError={pipelineError}
          selectedArchetypeCount={selectedArchetypeCount}
          onRunPipeline={onRunPipeline}
        />
      </div>
    </aside>
  );
}
