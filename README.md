# Zero-Sample B2B Dashboard

## BFF Single-Project Setup

Install dependencies for both client and server from the project root:

`npm install`

Run both services together (server + client):

`npm run dev`

This starts:

1. Server on `http://localhost:8000`
2. Client on `http://localhost:5173` (with `/api` and `/uploads` proxied to server)

Production-like flow:

1. Build client: `npm run build`
2. Start server: `npm run start`

When `client/dist` exists, server serves the client app and API from the same process.

## Real API Setup (Step 1 + Step 2)

Create `server/.env` and add values for your providers.

### Census API Key (Required for Sell-Through Demographics)

`CENSUS_API_KEY=your_census_key`

Get your key from:

`https://api.census.gov/data/key_signup.html`

Without this key, the Census ACS endpoint can return an HTML `Missing Key` page (HTTP 200), which will fail demographics matrix generation.

For debugging upstream provider issues, you can enable raw upstream responses in server error details:

`DEBUG_VERBOSE_UPSTREAM=true`

Set it back to `false` after integration.

### Step 1: CAD-to-Photo (Render API)

You can use either of these options:

1. Generic provider endpoint:

`CAD_RENDER_API_URL=https://your-render-endpoint`

`CAD_RENDER_API_KEY=your_render_api_key`

2. Replicate predictions API:

`REPLICATE_API_TOKEN=your_replicate_token`

`REPLICATE_MODEL_VERSION=your_model_version_id`

The server prefers `CAD_RENDER_API_URL` first, then Replicate.

### Step 2: YouCam VTO API

`YOUCAM_API_URL=https://your-youcam-endpoint`

`YOUCAM_API_KEY=your_youcam_key`

### Step 2 (SDK Async Task Mode)

If YouCam gave you a task-based SDK flow (start task then poll), set these:

`YOUCAM_API_KEY=your_youcam_key`

`YOUCAM_TASK_BASE_URL=https://yce-api-01.makeupar.com/s2s/v2.0/task/cloth-v3`

`YOUCAM_TASK_VERSION=1.0`

`YOUCAM_TASK_INDEX=0`

`YOUCAM_GARMENT_CATEGORY=auto`

`YOUCAM_SKIN_TONE_BASE_URL=https://yce-api-01.makeupar.com/s2s/v2.0/task/skin-tone-analysis`

`YOUCAM_TASK_POLL_INTERVAL_S=2`

`YOUCAM_TASK_MAX_ATTEMPTS=300`

Server behavior:

1. Starts cloth VTO task using `src_file_url` (model selfie), `ref_file_url` (garment image), and `garment_category`
2. Polls `GET {YOUCAM_TASK_BASE_URL}/{task_id}` until `success` or `error`
3. Optionally starts skin-tone-analysis task when `YOUCAM_SKIN_TONE_BASE_URL` is set
4. Returns normalized response to client

Important:

The `body-reshape` sample endpoint expects body-reshape feature parameters and is not directly compatible with garment VTO fields. For apparel VTO task mode, use `cloth-v3` instead. The cloth task requires:

1. `src_file_url`: model selfie / demographic subject image
2. `ref_file_url`: rendered garment image
3. `garment_category`: `full_body`, `upper_body`, `lower_body`, or `auto`

Priority order for Step 2:

1. Async task mode (when `YOUCAM_API_KEY` and `YOUCAM_TASK_BASE_URL` are set)
2. Direct endpoint mode (when `YOUCAM_API_URL` and `YOUCAM_API_KEY` are set)
3. Mock mode fallback

### Demo Fallback

If these variables are not set, server routes still work in `mock` mode so UI demos do not break.

### Upload Endpoint

Client CAD upload uses:

`POST /api/cad/upload`

Uploaded files are served from:

`/uploads/<file>`

If your AI provider requires file registration before inference, use this sequence:

1. Call the provider File API to create a new file upload session.
2. Upload the file bytes to the upload URL returned by that response.
3. Use the `file_id` from the same File API response when starting AI generation or VTO tasks.

This project's local upload endpoint is for demo/local hosting convenience. Provider-hosted workflows should pass provider `file_id` values to downstream AI endpoints when required.
