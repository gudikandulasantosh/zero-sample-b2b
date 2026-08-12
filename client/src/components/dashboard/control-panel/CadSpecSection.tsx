import type { ChangeEvent, DragEvent } from "react";
import { Layers, Upload } from "lucide-react";

type CadSpecSectionProps = {
  cadFileName: string;
  draggingCad: boolean;
  uploadingCad: boolean;
  uploadError: string;
  cadImageUrl: string;
  cadDescription: string;
  onCadDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onCadDragLeave: () => void;
  onCadDrop: (event: DragEvent<HTMLDivElement>) => void;
  onCadFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onCadClear: () => void;
  onCadDescriptionChange: (value: string) => void;
};

export default function CadSpecSection({
  cadFileName,
  draggingCad,
  uploadingCad,
  uploadError,
  cadImageUrl,
  cadDescription,
  onCadDragOver,
  onCadDragLeave,
  onCadDrop,
  onCadFileSelect,
  onCadClear,
  onCadDescriptionChange,
}: CadSpecSectionProps) {
  return (
    <section className="panel-block">
      <h3>
        <Layers size={16} />
        Digital CAD Spec
      </h3>
      {cadFileName ? (
        <div className="cad-box">
          <p className="cad-file">{cadFileName}</p>
        </div>
      ) : null}
      <div
        className={`upload-dropzone ${draggingCad ? "is-active" : ""}`}
        onDragOver={onCadDragOver}
        onDragLeave={onCadDragLeave}
        onDrop={onCadDrop}
      >
        <Upload size={16} />
        <p>Drop CAD file here or choose from disk</p>
        <label htmlFor="cad-file-upload" className="upload-btn">
          {uploadingCad ? "Uploading..." : cadFileName ? "Add New CAD Design" : "Select CAD File"}
        </label>
        <input
          id="cad-file-upload"
          type="file"
          accept=".svg,.png,.jpg,.jpeg,.webp"
          onChange={onCadFileSelect}
          hidden
        />
      </div>
      <details className="cad-notes-toggle">
        <summary>Optional CAD description</summary>
        <label className="field-label" htmlFor="cad-description">
          Add notes for the render prompt
        </label>
        <textarea
          id="cad-description"
          className="field-input field-textarea"
          value={cadDescription}
          onChange={(event) => onCadDescriptionChange(event.target.value)}
          placeholder="Describe construction details, silhouette, trims, or design intent to include in the prompt."
        />
        <p className="field-help">This text is folded into the start prompt when you run the pipeline.</p>
      </details>
      {cadImageUrl ? (
        <div className="cad-preview">
          <img src={cadImageUrl} alt={cadFileName ? `${cadFileName} preview` : "CAD preview"} loading="lazy" />
        </div>
      ) : null}

      {cadFileName ? (
        <div className="cad-actions">
          <button
            type="button"
            className="upload-btn clear-btn"
            onClick={onCadClear}
            disabled={uploadingCad}
          >
            Delete CAD Design
          </button>
        </div>
      ) : null}

      {uploadError ? <p className="error-note upload-error">{uploadError}</p> : null}
    </section>
  );
}
