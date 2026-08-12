import fs from "node:fs";
import path from "node:path";

import cors from "cors";
import express from "express";
import multer from "multer";

import { CORS_ORIGINS, ROOT_DIR, UPLOADS_DIR } from "./config.js";
import { HttpError, toHttpError } from "./errors.js";
import { runCadToPhoto } from "./cadToPhoto.js";
import { runYoucamClothLayer, runYoucamImageToImage, runYoucamVto, uploadYoucamFile, uploadYoucamFileFromUrl } from "./youcam.js";

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
const CLIENT_DIST_DIR = path.resolve(ROOT_DIR, "..", "client", "dist");

const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(
  cors({
    origin: CORS_ORIGINS,
    credentials: true,
  })
);
app.use("/uploads", express.static(UPLOADS_DIR));

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${timestamp}_${safeName}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
});

const uploadInMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/cad/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new HttpError(400, "Upload 'file' is required");
    }

    const origin = `${req.protocol}://${req.get("host")}`;
    const cadImageUrl = `${origin}/uploads/${req.file.filename}`;
    res.json({
      status: "success",
      cad_image_url: cadImageUrl,
      original_name: req.file.originalname,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/youcam/file/upload", uploadInMemory.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new HttpError(400, "Upload 'file' is required");
    }

    const result = await uploadYoucamFile({
      fileName: req.file.originalname,
      contentType: req.file.mimetype || "image/jpg",
      fileSize: req.file.size,
      fileBuffer: req.file.buffer,
    });

    res.json({
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/youcam/file/upload-from-url", async (req, res, next) => {
  try {
    const { image_url, file_name } = req.body || {};
    if (!image_url) {
      throw new HttpError(400, "image_url is required");
    }

    const result = await uploadYoucamFileFromUrl({ url: image_url, fileName: file_name });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/youcam/layer", async (req, res, next) => {
  try {
    const { base_image_url, accessory_image_url } = req.body || {};
    if (!base_image_url || !accessory_image_url) {
      throw new HttpError(400, "base_image_url and accessory_image_url are required");
    }

    const result = await runYoucamClothLayer({ base_image_url, accessory_image_url });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/youcam/image-to-image", async (req, res, next) => {
  try {
    const { src_file_id, src_file_ids, prompt, model, size } = req.body || {};

    const result = await runYoucamImageToImage({
      src_file_id,
      src_file_ids,
      prompt,
      model,
      size,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/cad-to-photo", async (req, res, next) => {
  try {
    const { cad_image_url, prompt, fabric_color } = req.body || {};
    if (!cad_image_url || !prompt || !fabric_color) {
      throw new HttpError(400, "cad_image_url, prompt, and fabric_color are required");
    }

    const result = await runCadToPhoto({ cad_image_url, prompt, fabric_color });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/youcam/virtual-tryon", async (req, res, next) => {
  try {
    const { garment_image_url, target_model_id, model_selfie_url } = req.body || {};
    if (!garment_image_url || !target_model_id) {
      throw new HttpError(400, "garment_image_url and target_model_id are required");
    }

    const result = await runYoucamVto({
      garment_image_url,
      target_model_id,
      model_selfie_url,
    });

    res.json({
      status: "success",
      ...result,
      target_model_id,
      selfie_received: Boolean(model_selfie_url),
    });
  } catch (error) {
    next(error);
  }
});

if (fs.existsSync(CLIENT_DIST_DIR)) {
  app.use(express.static(CLIENT_DIST_DIR));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    return res.sendFile(path.join(CLIENT_DIST_DIR, "index.html"));
  });
}

app.use((error, _req, res, _next) => {
  const httpError = toHttpError(error);
  res.status(httpError.statusCode || 500).json({ detail: httpError.detail || "Internal Server Error" });
});

// On Vercel the app is exported and invoked as a serverless function, so we
// only bind a port when running the server directly (local dev / node start).
if (!process.env.VERCEL) {
  const port = Number.parseInt(process.env.PORT || "8000", 10);
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
    console.log(`Uploads directory: ${path.relative(ROOT_DIR, UPLOADS_DIR)}`);
  });
}

export default app;
