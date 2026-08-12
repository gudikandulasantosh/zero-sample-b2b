import type { Archetype, ArchetypeRenderSpec } from "./types";
import ArchetypeGrid from "./content-stage/ArchetypeGrid";
import StageHeader from "./content-stage/StageHeader";

type ContentStageProps = {
  archetypes: Archetype[];
  selectedArchetypeIds: number[];
  onArchetypeToggle: (archetypeId: number) => void;
  archetypeRenderSpecById: Record<number, ArchetypeRenderSpec>;
  defaultRenderSpec: ArchetypeRenderSpec;
  runningArchetypeIds: number[];
  archetypePipelineErrorsById: Record<number, string>;
  onArchetypeSaveAndRender: (archetypeId: number, prompt: string, spec: ArchetypeRenderSpec) => Promise<void>;
  archetypeImagesById: Record<number, string>;
  archetypeLayerStackById: Record<number, string[]>;
  onAddArchetypeLayer: (archetypeId: number, accessoryFile: File, accessoryPrompt: string) => Promise<void>;
  onUndoArchetypeLayer: (archetypeId: number) => void;
  cadImageUrl?: string;
  cadDescription?: string;
  projectName?: string;
};

export default function ContentStage({
  archetypes,
  selectedArchetypeIds,
  onArchetypeToggle,
  archetypeRenderSpecById,
  defaultRenderSpec,
  runningArchetypeIds,
  archetypePipelineErrorsById,
  onArchetypeSaveAndRender,
  archetypeImagesById,
  archetypeLayerStackById,
  onAddArchetypeLayer,
  onUndoArchetypeLayer,
  cadImageUrl,
  cadDescription,
  projectName,
}: ContentStageProps) {
  return (
    <section className="content-stage">
      <StageHeader />

      <ArchetypeGrid
        archetypes={archetypes}
        archetypeImagesById={archetypeImagesById}
        selectedArchetypeIds={selectedArchetypeIds}
        onArchetypeToggle={onArchetypeToggle}
        archetypeRenderSpecById={archetypeRenderSpecById}
        defaultRenderSpec={defaultRenderSpec}
        runningArchetypeIds={runningArchetypeIds}
        archetypePipelineErrorsById={archetypePipelineErrorsById}
        onArchetypeSaveAndRender={onArchetypeSaveAndRender}
        archetypeLayerStackById={archetypeLayerStackById}
        onAddArchetypeLayer={onAddArchetypeLayer}
        onUndoArchetypeLayer={onUndoArchetypeLayer}
        cadImageUrl={cadImageUrl}
        cadDescription={cadDescription}
        projectName={projectName}
      />
    </section>
  );
}
