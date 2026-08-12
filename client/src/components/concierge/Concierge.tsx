import { ArrowLeft, Loader2, ScanFace, Sparkles, UploadCloud, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import GarmentRecommendations from "./GarmentRecommendations";
import SkinMetrics from "./SkinMetrics";
import { useConcierge } from "./useConcierge";

export default function Concierge() {
  const navigate = useNavigate();
  const {
    selfiePreviewUrl,
    selfieFileName,
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
  } = useConcierge();

  return (
    <div className="dashboard-shell">
      <div className="dashboard-noise" aria-hidden="true" />

      <header className="dashboard-topbar">
        <div className="brand-wrap">
          <div className="brand-mark" aria-hidden="true">
            AA
          </div>
          <div>
            <p className="brand-eyebrow">Client Concierge · B2B2C</p>
            <h1 className="brand-title">AI Personal Atelier</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <button type="button" className="ghost-btn" onClick={() => navigate("/")}>
            <ArrowLeft size={16} />
            Switch mode
          </button>
        </div>
      </header>

      <main className="dashboard-grid">
        <aside className="control-panel">
          <div className="panel-block">
            <p className="panel-kicker">Step 1</p>
            <h2>Selfie Scan</h2>

            {selfiePreviewUrl ? (
              <div className="cad-preview">
                <img src={selfiePreviewUrl} alt="Selfie preview" />
                <div className="cad-actions">
                  <button type="button" className="clear-btn" onClick={clearSelfie}>
                    <X size={14} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`upload-dropzone${dragActive ? " dragging" : ""}`}
                onDrop={handleSelfieDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <UploadCloud size={26} />
                <p>Drop a selfie here or choose a photo</p>
                <label className="upload-btn">
                  <input type="file" accept="image/*" hidden onChange={handleSelfieSelect} />
                  Choose photo
                </label>
              </div>
            )}

            {selfieFileName ? <p className="cad-meta">{selfieFileName}</p> : null}
            {uploadError ? <p className="upload-error">{uploadError}</p> : null}
          </div>

          <div className="control-panel-run-sticky is-visible">
            <button type="button" className="run-btn" onClick={analyzeSkin} disabled={analyzing || uploading}>
              {analyzing ? <Loader2 size={16} className="spin" /> : <ScanFace size={16} />}
              {analyzing ? "Scanning skin…" : "Scan My Skin"}
            </button>
            {analysisError ? <p className="error-note">{analysisError}</p> : null}
            <p className="flow-note">
              Skin AI measures undertone, oiliness, redness &amp; texture, then matches fabrics that flatter you.
            </p>
          </div>
        </aside>

        <section className="content-stage">
          <div className="stage-header">
            <p className="stage-kicker">Your Style Profile</p>
            <h2>Personalized fabric &amp; color matching</h2>
            <p className="stage-sub">
              One selfie drives an end-to-end loop: diagnostic Skin AI decides which materials suit you, and
              generative VTO renders them on you.
            </p>
          </div>

          {!analysis ? (
            <div className="matrix-empty">
              <div className="matrix-empty-icon">
                <Sparkles size={22} />
              </div>
              <p className="matrix-empty-title">Scan a selfie to begin</p>
              <p className="matrix-empty-sub">Upload a photo and run the skin scan to reveal your matches.</p>
            </div>
          ) : (
            <>
              <SkinMetrics target={analysis.target} rationale={analysis.rationale} provider={analysis.provider} />

              <GarmentRecommendations
                recommendations={analysis.recommendations}
                topMatchId={analysis.top_match?.id}
                renderingPresetId={renderingPresetId}
                onRender={renderGarment}
              />

              {renderError ? <p className="error-note">{renderError}</p> : null}

              {renderResult?.output_image_url ? (
                <section className="render-block">
                  <p className="stage-kicker">Step 3 · Photorealistic Try-On</p>
                  <div className="render-frame">
                    <img src={renderResult.output_image_url} alt="Rendered try-on" />
                  </div>
                </section>
              ) : null}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
