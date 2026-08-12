import { ArrowRight, Ruler, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-shell">
      <div className="dashboard-noise" aria-hidden="true" />

      <header className="landing-hero">
        <p className="brand-eyebrow">Perfect Corp · YouCam API</p>
        <h1 className="landing-title">Platform Landing</h1>
        <p className="landing-sub">
          One YouCam integration, two experiences — a designer CAD console and a consumer style concierge.
        </p>
      </header>

      <main className="landing-grid">
        <button type="button" className="landing-card" onClick={() => navigate("/studio")}>
          <div className="landing-card-icon">
            <Ruler size={22} />
          </div>
          <div className="landing-card-body">
            <p className="brand-eyebrow">Designer CAD Console · B2B</p>
            <h2>Zero-Sample Studio</h2>
            <ul>
              <li>CAD drop / flat spec</li>
              <li>Multi-skin archetype matrix</li>
              <li>Drape &amp; fabric tech</li>
              <li>Production tech pack</li>
            </ul>
          </div>
          <span className="landing-card-go">
            Enter <ArrowRight size={16} />
          </span>
        </button>

        <button type="button" className="landing-card" onClick={() => navigate("/atelier")}>
          <div className="landing-card-icon">
            <Sparkles size={22} />
          </div>
          <div className="landing-card-body">
            <p className="brand-eyebrow">Client Concierge · B2B2C</p>
            <h2>AI Personal Atelier</h2>
            <ul>
              <li>Customer selfie upload</li>
              <li>YouCam skin analysis</li>
              <li>Algorithmic fabric &amp; color match</li>
              <li>Photorealistic try-on</li>
            </ul>
          </div>
          <span className="landing-card-go">
            Enter <ArrowRight size={16} />
          </span>
        </button>
      </main>

      <footer className="landing-foot">Powered by YouCam Skin AI + Apparel VTO</footer>
    </div>
  );
}
