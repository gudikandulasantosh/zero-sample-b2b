import { LayoutGrid } from "lucide-react";

import type { Archetype, ArchetypeRenderSpec } from "../types";
import ArchetypeCard from "./ArchetypeCard";
type ArchetypeGridProps = {
  archetypes: Archetype[];
  archetypeImagesById: Record<number, string>;
  selectedArchetypeIds: number[];
  onArchetypeToggle: (archetypeId: number) => void;
  archetypeRenderSpecById: Record<number, ArchetypeRenderSpec>;
  defaultRenderSpec: ArchetypeRenderSpec;
  runningArchetypeIds: number[];
  archetypePipelineErrorsById: Record<number, string>;
  onArchetypeSaveAndRender: (archetypeId: number, prompt: string, spec: ArchetypeRenderSpec) => Promise<void>;
  archetypeLayerStackById: Record<number, string[]>;
  onAddArchetypeLayer: (archetypeId: number, accessoryFile: File, accessoryPrompt: string) => Promise<void>;
  onUndoArchetypeLayer: (archetypeId: number) => void;
  cadImageUrl?: string;
  cadDescription?: string;
  projectName?: string;
};

export default function ArchetypeGrid({
  archetypes,
  archetypeImagesById,
  selectedArchetypeIds,
  onArchetypeToggle,
  archetypeRenderSpecById,
  defaultRenderSpec,
  runningArchetypeIds,
  archetypePipelineErrorsById,
  onArchetypeSaveAndRender,
  archetypeLayerStackById,
  onAddArchetypeLayer,
  onUndoArchetypeLayer,
  cadImageUrl,
  cadDescription,
  projectName,
}: ArchetypeGridProps) {
  const selectedIdSet = new Set(selectedArchetypeIds);
  const runningIdSet = new Set(runningArchetypeIds);
  const selectedArchetypes = archetypes
    .map((item, index) => ({
      archetypeId: item.id || index + 1,
      item,
    }))
    .filter((entry) => selectedIdSet.has(entry.archetypeId));

  return (
    <>
      <div className="archetype-chip-group" role="group" aria-label="Select archetypes for VTO pipeline">
        {archetypes.map((item, index) => {
          const archetypeId = item.id || index + 1;
          const isSelected = selectedIdSet.has(archetypeId);
          return (
            <button
              key={`chip-${archetypeId}`}
              type="button"
              className={`archetype-select-chip ${isSelected ? "is-selected" : ""}`}
              onClick={() => onArchetypeToggle(archetypeId)}
              aria-pressed={isSelected}
            >
              {item.skinTone ? (
                <span className="skin-swatch" style={{ background: item.skinTone }} aria-hidden="true" />
              ) : null}
              {item.type}
            </button>
          );
        })}
      </div>

      {selectedArchetypes.length === 0 ? (
        <div className="matrix-empty" role="status">
          <span className="matrix-empty-icon" aria-hidden="true">
            <LayoutGrid size={22} />
          </span>
          <p className="matrix-empty-title">No archetypes selected</p>
          <p className="matrix-empty-sub">Tap a skin-tone chip above to render its profile card.</p>
        </div>
      ) : (
        <div className="matrix-grid">
          {selectedArchetypes.map(({ archetypeId, item }) => {
            const isSelected = selectedIdSet.has(archetypeId);

            return (
              <ArchetypeCard
                key={archetypeId}
                archetypeId={archetypeId}
                item={item}
                imageUrl={item.img || archetypeImagesById[archetypeId]}
                isSelected={isSelected}
                renderSpec={archetypeRenderSpecById[archetypeId] || defaultRenderSpec}
                isRendering={runningIdSet.has(archetypeId)}
                renderError={archetypePipelineErrorsById[archetypeId] || ""}
                cadImageUrl={cadImageUrl}
                cadDescription={cadDescription}
                projectName={projectName}
                layerCount={(archetypeLayerStackById[archetypeId] || []).length}
                onAddLayer={onAddArchetypeLayer}
                onUndoLayer={onUndoArchetypeLayer}
                onSaveAndRender={onArchetypeSaveAndRender}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
