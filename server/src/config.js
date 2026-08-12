import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, "..");
export const UPLOADS_DIR = path.resolve(ROOT_DIR, "uploads");

export const CORS_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
];
