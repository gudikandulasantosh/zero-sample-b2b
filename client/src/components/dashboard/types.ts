import type { BodyType, TargetGender } from "./control-panel/FabricSpecSection";

export type CadResponse = {
  status: string;
  provider?: string;
  rendered_garment_url: string;
  applied_color: string;
  prompt_used: string;
};

export type VtoResponse = {
  status: string;
  provider?: string;
  harmony_score: number;
  undertone_delta: string;
  fit_status: string;
  output_image_url: string;
  target_model_id?: string;
  selfie_received?: boolean;
};

export type CadUploadResponse = {
  status: string;
  file_id: string;
};

export type Archetype = {
  id: number;
  type: string;
  score: number;
  status: "green" | "yellow" | "red";
  img?: string;
  prompt?: string;
  skinTone?: string;
};

export type ArchetypeRenderSpec = {
  color: string;
  fabricTexture: string;
  targetGender: TargetGender;
  bodyType: BodyType;
  extendedPrompt: string;
  fabricWeight: number;
  drapeType: string;
  lighting: string;
  printScale: number;
  pose: string;
};

export type ApiErrorPayload = {
  detail?: string;
  message?: string;
};
