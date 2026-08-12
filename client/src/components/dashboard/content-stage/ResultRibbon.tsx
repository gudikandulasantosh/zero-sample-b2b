import { Link2 } from "lucide-react";

import type { CadResponse, VtoResponse } from "../types";

type ResultRibbonProps = {
  cadResult: CadResponse | null;
  vtoResult: VtoResponse | null;
  matrixRisk: string;
};

export default function ResultRibbon({ cadResult, vtoResult, matrixRisk }: ResultRibbonProps) {
  return (
    <div className="result-ribbon">
      <article>
        <p>Step 1 Output</p>
        <strong>{cadResult ? "Rendered Garment Ready" : "Waiting to run"}</strong>
        <span>
          <Link2 size={14} />
          {cadResult ? cadResult.rendered_garment_url : "No render URL yet"}
        </span>
      </article>
      <article>
        <p>Sell-Through Risk Index</p>
        <strong>{vtoResult ? `${vtoResult.harmony_score}% Harmony` : "Waiting to run"}</strong>
        <span>
          {vtoResult ? `${vtoResult.fit_status} • ${vtoResult.undertone_delta}` : `${matrixRisk} risk • matrix-driven`}
        </span>
      </article>
    </div>
  );
}
