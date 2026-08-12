export const FABRIC_TEXTURE_OPTIONS = [
  "Combed Ringspun Cotton Jersey (180 GSM)",
  "French Terry Cotton (320 GSM)",
  "Pique Knit Cotton (220 GSM)",
  "Organic Cotton Jersey (185 GSM)",
  "Linen Plain Weave (200 GSM)",
  "Linen-Cotton Blend (220 GSM)",
  "Silk Satin (95 GSM)",
  "Silk Charmeuse (110 GSM)",
  "Wool Flannel (320 GSM)",
  "Merino Wool Jersey (210 GSM)",
  "Cashmere-Wool Blend (280 GSM)",
  "Brushed Twill Wool (300 GSM)",
  "Denim 12oz (407 GSM)",
  "Stretch Denim (360 GSM)",
  "Viscose Crepe (170 GSM)",
  "Rayon Challis (145 GSM)",
  "Tencel Twill (210 GSM)",
  "Modal Jersey (180 GSM)",
  "Nylon Ripstop (120 GSM)",
  "Polyester Mesh (160 GSM)",
  "Scuba Knit (300 GSM)",
  "Performance Poly-Spandex Knit (190 GSM)",
  "Faux Leather PU (430 GSM)",
  "Structured Italian Leather",
  "Neoprene Foam Jersey (280 GSM)",
  "Corduroy Cotton Blend (300 GSM)",
  "Boucle Knit Wool Blend (340 GSM)",
  "Tweed Wool Blend (360 GSM)",
  "Canvas Cotton-Linen Blend (290 GSM)",
  "Recycled Polyester Twill (220 GSM)",
  "Cupro Twill (185 GSM)",
  "Organza Silk Blend (90 GSM)",
  "Velvet Cotton Blend (330 GSM)",
  "Sateen Cotton Blend (210 GSM)",
  "Jacquard Poly-Viscose (260 GSM)",
  "Sherpa Fleece Polyester (350 GSM)",
  "Softshell Polyester (280 GSM)",
  "Microfiber Suede (240 GSM)",
  "Bamboo Jersey (200 GSM)",
  "Hemp-Cotton Canvas (300 GSM)",
  "Lurex Knit Blend (190 GSM)",
  "Crinkle Crepe Blend (175 GSM)",
  "Seersucker Cotton Blend (160 GSM)",
  "Gabardine Wool Blend (290 GSM)",
  "Heavyweight Cotton Jersey (240 GSM)",
  "Cotton Twill (260 GSM)",
  "Ribbed Knit Cotton (280 GSM)",
] as const;

type FabricTextureSelectProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function FabricTextureSelect({
  value,
  onChange,
}: FabricTextureSelectProps) {
  return (
    <select
      id="fabric-texture"
      className="field-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {FABRIC_TEXTURE_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}