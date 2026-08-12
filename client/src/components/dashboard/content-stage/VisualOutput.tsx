import type { CadResponse, VtoResponse } from "../types";

type VisualOutputProps = {
  cadResult: CadResponse | null;
  vtoResult: VtoResponse | null;
};

export default function VisualOutput({ cadResult, vtoResult }: VisualOutputProps) {
  if (!cadResult && !vtoResult) {
    return null;
  }

  return (
    <section className="visual-output-block">
      <article className="visual-output-card">
        <div className="visual-output-copy">
          <p>Step 1</p>
          <strong>Rendered Garment</strong>
          <span>
            {cadResult
              ? `${cadResult.provider ?? "unknown"} • ${cadResult.prompt_used}`
              : "CAD render output will appear here."}
          </span>
        </div>
        <div className="visual-output-frame">
          {cadResult ? (
            <img src={cadResult.rendered_garment_url} alt="Rendered garment output" className="visual-output-image" />
          ) : (
            <div className="visual-output-empty">Run Step 1 to preview garment render</div>
          )}
        </div>
      </article>

      <article className="visual-output-card">
        <div className="visual-output-copy">
          <p>Step 2</p>
          <strong>Apparel VTO Result</strong>
          <span>
            {vtoResult
              ? `${vtoResult.provider ?? "youcam"} • ${vtoResult.fit_status} • ${vtoResult.harmony_score}% harmony`
              : "YouCam cloth-v3 output will appear here."}
          </span>
        </div>
        <div className="visual-output-frame">
          {vtoResult ? (
            <img src={vtoResult.output_image_url} alt="Virtual try-on output" className="visual-output-image" />
          ) : (
            <div className="visual-output-empty">Run Step 2 to preview VTO result</div>
          )}
        </div>
      </article>
    </section>
  );
}
