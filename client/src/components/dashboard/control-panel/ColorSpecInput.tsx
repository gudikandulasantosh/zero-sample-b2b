import { useEffect, useState } from "react";

type ColorSpecInputProps = {
  color: string;
  onColorChange: (value: string) => void;
};

function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toUpperCase()}`;
  }
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    const expanded = trimmed
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
    return `#${expanded}`.toUpperCase();
  }
  return null;
}

export default function ColorSpecInput({ color, onColorChange }: ColorSpecInputProps) {
  const [colorText, setColorText] = useState(color);

  useEffect(() => {
    setColorText(color);
  }, [color]);

  const commitColorText = () => {
    const normalized = normalizeHexColor(colorText);
    if (!normalized) {
      return;
    }
    setColorText(normalized);
    onColorChange(normalized);
  };

  const handlePickerChange = (value: string) => {
    const normalized = value.toUpperCase();
    setColorText(normalized);
    onColorChange(normalized);
  };

  return (
    <div className="color-field">
      <input
        id="color-spec"
        type="color"
        value={color}
        onChange={(e) => handlePickerChange(e.target.value)}
        aria-label="Garment color"
      />
      <input
        type="text"
        className="field-input"
        value={colorText}
        onChange={(e) => setColorText(e.target.value)}
        onBlur={commitColorText}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commitColorText();
          }
        }}
        placeholder="#C85A17"
        aria-label="Garment color hex code"
      />
    </div>
  );
}
