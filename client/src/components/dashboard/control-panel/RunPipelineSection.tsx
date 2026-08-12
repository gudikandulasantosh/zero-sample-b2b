import { Sparkles } from "lucide-react";

type RunPipelineSectionProps = {
  loading: boolean;
  pipelineError: string;
  selectedArchetypeCount: number;
  onRunPipeline: () => void;
};

export default function RunPipelineSection({
  loading,
  pipelineError,
  selectedArchetypeCount,
  onRunPipeline,
}: RunPipelineSectionProps) {
  const selectionSuffix = selectedArchetypeCount > 0
    ? ` (${selectedArchetypeCount} selected)`
    : "";

  return (
    <>
      <button type="button" onClick={onRunPipeline} disabled={loading} className="run-btn">
        <Sparkles size={16} />
        {loading ? "Processing Pipeline..." : `Run VTO Pipeline${selectionSuffix}`}
      </button>

      {pipelineError ? <p className="error-note">{pipelineError}</p> : null}
    </>
  );
}
