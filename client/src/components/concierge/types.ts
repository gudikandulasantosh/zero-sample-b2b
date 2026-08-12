export type SkinMetrics = {
  ita: number;
  oiliness: number;
  redness: number;
  texture: number;
  undertone: string;
};

export type RecommendationTarget = {
  metrics: SkinMetrics;
  toneBand: string;
  sheen: string;
  drape: string;
  surfaceTexture: string;
  palette: string;
};

export type GarmentPreset = {
  id: string;
  name: string;
  fabric: string;
  colorway: string;
  colorHex: string;
  sheen: string;
  drape: string;
  surfaceTexture: string;
  palette: string;
  garmentCategory: string;
  refImageUrl: string;
  matchScore?: number;
};

export type AnalyzeResponse = {
  status: string;
  provider?: string;
  metrics: SkinMetrics;
  target: RecommendationTarget;
  rationale: string[];
  top_match: GarmentPreset;
  recommendations: GarmentPreset[];
};

export type TryonResponse = {
  status: string;
  provider?: string;
  output_image_url: string;
  preset_id?: string;
  garment_ref_url?: string;
};

export type SelfieUploadResponse = {
  status: string;
  file_id: string;
};
