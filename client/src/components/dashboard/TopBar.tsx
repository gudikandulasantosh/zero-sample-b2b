import { ArrowLeft, Download } from "lucide-react";

type TopBarProps = {
  onExportReport: () => void;
  onSwitchMode: () => void;
};

export default function TopBar({ onExportReport, onSwitchMode }: TopBarProps) {
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
        <button type="button" className="ghost-btn" onClick={onSwitchMode}>
          <ArrowLeft size={16} />
          Switch mode
        </button>
        <button type="button" className="ghost-btn" onClick={onExportReport}>
          <Download size={16} />
          Export All Techpacks
        </button>
      </div>
    </header>
  );
}
