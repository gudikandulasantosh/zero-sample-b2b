import { Sliders } from "lucide-react";
import ColorSpecInput from "./ColorSpecInput";
import FabricTextureSelect from "./FabricTextureSelect";

export const TARGET_GENDER_OPTIONS = ["Female", "Male", "Non-binary"] as const;
export type TargetGender = (typeof TARGET_GENDER_OPTIONS)[number];
export const BODY_TYPE_OPTIONS = [
  "Well-proportioned editorial physique",
  "Slim physique",
  "Athletic physique",
  "Curvy physique",
  "Plus-size physique",
  "Full-figured physique",
  "Heavy-set physique",
  "Extended plus-size physique",
  "Petite physique",
] as const;
export type BodyType = (typeof BODY_TYPE_OPTIONS)[number];

// Sheen / drape behaviour describing how a fabric reflects light and hangs.
export const DRAPE_TYPE_OPTIONS = [
  "Matte",
  "Gloss / Satin",
  "Sheer",
  "Stiff",
  "Fluid",
] as const;
export type DrapeType = (typeof DRAPE_TYPE_OPTIONS)[number];

// Venue lighting presets used to sanity-check how a color reads before dyeing.
export const LIGHTING_OPTIONS = [
  "Studio Daylight",
  "Runway Spotlight",
  "Retail Warm",
  "Flash Photography",
] as const;
export type Lighting = (typeof LIGHTING_OPTIONS)[number];

// Standard pose variations to show garment movement and break lines.
export const POSE_OPTIONS = [
  "Front Standing",
  "Walking Profile",
  "3/4 Turn",
] as const;
export type Pose = (typeof POSE_OPTIONS)[number];

export const FABRIC_WEIGHT_MIN = 60;
export const FABRIC_WEIGHT_MAX = 500;
export const DEFAULT_FABRIC_WEIGHT = 220;

export const PRINT_SCALE_MIN = 50;
export const PRINT_SCALE_MAX = 200;
export const DEFAULT_PRINT_SCALE = 100;

type FabricSpecSectionProps = {
  fabricTexture: string;
  color: string;
  targetGender: TargetGender;
  bodyType: BodyType;
  fabricWeight: number;
  drapeType: string;
  lighting: string;
  printScale: number;
  pose: string;
  onFabricTextureChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onTargetGenderChange: (value: TargetGender) => void;
  onBodyTypeChange: (value: BodyType) => void;
  onFabricWeightChange: (value: number) => void;
  onDrapeTypeChange: (value: string) => void;
  onLightingChange: (value: string) => void;
  onPrintScaleChange: (value: number) => void;
  onPoseChange: (value: string) => void;
};

export default function FabricSpecSection({
  fabricTexture,
  color,
  targetGender,
  bodyType,
  fabricWeight,
  drapeType,
  lighting,
  printScale,
  pose,
  onFabricTextureChange,
  onColorChange,
  onTargetGenderChange,
  onBodyTypeChange,
  onFabricWeightChange,
  onDrapeTypeChange,
  onLightingChange,
  onPrintScaleChange,
  onPoseChange,
}: FabricSpecSectionProps) {
  return (
    <section className="panel-block">
      <h3>
        <Sliders size={16} />
        Fabric Render Spec
      </h3>
      <label className="field-label" htmlFor="fabric-texture">
        Fabric texture
      </label>
      <FabricTextureSelect
        value={fabricTexture}
        onChange={onFabricTextureChange}
      />

      <label className="field-label" htmlFor="color-spec">
        Garment color spec
      </label>
      <ColorSpecInput color={color} onColorChange={onColorChange} />
      <p className="field-help">Use color picker or type a hex code like #C85A17.</p>

      <label className="field-label" htmlFor="fabric-weight">
        Fabric weight (GSM)
      </label>
      <div className="slider-field">
        <input
          id="fabric-weight"
          type="range"
          className="field-slider"
          min={FABRIC_WEIGHT_MIN}
          max={FABRIC_WEIGHT_MAX}
          step={5}
          value={fabricWeight}
          onChange={(event) => onFabricWeightChange(Number(event.target.value))}
        />
        <span className="slider-value">{fabricWeight} GSM</span>
      </div>
      <p className="field-help">
        {fabricWeight <= 130 ? "Lightweight — sheer, fluid hang." : fabricWeight >= 320 ? "Heavyweight — structured, stiff hang." : "Midweight — balanced drape."}
      </p>

      <label className="field-label" htmlFor="drape-type">
        Sheen / drape type
      </label>
      <select
        id="drape-type"
        className="field-input"
        value={drapeType}
        onChange={(event) => onDrapeTypeChange(event.target.value)}
      >
        {DRAPE_TYPE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <p className="field-help">Controls tension lines, folds and highlights in the render.</p>

      <label className="field-label" htmlFor="lighting">
        Venue lighting
      </label>
      <select
        id="lighting"
        className="field-input"
        value={lighting}
        onChange={(event) => onLightingChange(event.target.value)}
      >
        {LIGHTING_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <p className="field-help">Preview how the color reads before committing dye.</p>

      <label className="field-label" htmlFor="print-scale">
        Print / pattern scale
      </label>
      <div className="slider-field">
        <input
          id="print-scale"
          type="range"
          className="field-slider"
          min={PRINT_SCALE_MIN}
          max={PRINT_SCALE_MAX}
          step={5}
          value={printScale}
          onChange={(event) => onPrintScaleChange(Number(event.target.value))}
        />
        <span className="slider-value">{printScale}%</span>
      </div>
      <p className="field-help">
        {printScale <= 75 ? "Micro-print density." : printScale >= 150 ? "Statement / oversized print." : "Standard print scale."}
      </p>

      <label className="field-label" htmlFor="pose">
        Model pose
      </label>
      <select
        id="pose"
        className="field-input"
        value={pose}
        onChange={(event) => onPoseChange(event.target.value)}
      >
        {POSE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <p className="field-help">Shows garment movement, breaks and slit behavior.</p>

      <label className="field-label" htmlFor="target-gender">
        Apply design to
      </label>
      <select
        id="target-gender"
        className="field-input"
        value={targetGender}
        onChange={(event) => onTargetGenderChange(event.target.value as TargetGender)}
      >
        {TARGET_GENDER_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <p className="field-help">This selection is applied when generating model prompts for each rendition.</p>

      <label className="field-label" htmlFor="body-type">
        Body type
      </label>
      <select
        id="body-type"
        className="field-input"
        value={bodyType}
        onChange={(event) => onBodyTypeChange(event.target.value as BodyType)}
      >
        {BODY_TYPE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <p className="field-help">Used in prompt generation. Defaults to well-proportioned if no value is provided.</p>
    </section>
  );
}
