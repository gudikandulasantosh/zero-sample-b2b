import { Download } from "lucide-react";

type TopBarProps = {
  onExportReport: () => void;
  exportDisabled?: boolean;
};

export default function TopBar({ onExportReport, exportDisabled = false }: TopBarProps) {
  return (
    <header className="dashboard-topbar">
      <div className="brand-wrap">
        <div className="brand-mark" aria-hidden="true">
          ZS
        </div>
        <div>
          <p className="brand-eyebrow">Zero-Sample B2B</p>
          <h1 className="brand-title">Garment Fit Console</h1>
        </div>
      </div>

      <div className="topbar-actions">
        <button type="button" className="ghost-btn" onClick={onExportReport} disabled={exportDisabled}>
          <Download size={16} />
          Export All Techpacks
        </button>
      </div>
    </header>
  );
}
