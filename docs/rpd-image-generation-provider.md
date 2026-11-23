# RPD Image Generation Provider — Decision & Implementation Plan

## Goal

Turn the RPD workflow into an actual image-producing carousel pipeline while preserving the source garment, verified product facts, and character consistency.

## Provider decision: optional self-hosted ComfyUI

**Default provider:** ComfyUI's local HTTP API. It is open-source, self-hosted, and does not require a paid API account or per-image fees. Users can connect a ComfyUI host they control.

The integration should not silently send product or model reference images to third-party services.

### Required host

- A separate computer with a compatible GPU and enough VRAM for the selected model/workflow.
- ComfyUI installed and running with its HTTP API enabled.
- A vetted virtual try-on or image-edit workflow exported in ComfyUI API format.
- Required models/LoRAs installed by the host owner.

This is **not practical on a typical Android phone** as a local inference host. Android can use the app's UI to connect to a separately owned host if the user has one, but it cannot be presented as phone-only/local generation.

## Recommended workflow

1. The Product Fidelity Brief must be approved and locked.
2. User supplies or selects the stable anime Character Anchor image.
3. Select the exact source garment/variant reference image by image ID.
4. Submit both references and a constrained prompt to the configured ComfyUI workflow.
5. Queue the workflow through ComfyUI's API.
6. Poll the job/history until completed or failed.
7. Retrieve the output image and save it as a new campaign asset.
8. Run visual QC against source garment and Character Anchor.
9. Mark pass/fail; failed results are not silently accepted and may be regenerated.
10. Use the accepted image as the slide artwork; HTML/CSS may add only approved minimal overlays.

## Integration shape

- Server-side provider adapter; no direct browser calls to the generation host.
- Environment/configuration values: `COMFYUI_BASE_URL`, optional `COMFYUI_API_KEY` only if a user-controlled gateway requires it, and a selected workflow file.
- `GET /api/image-provider/status`: health/configuration check.
- `POST /api/image-provider/jobs`: submit validated garment/model references and a structured prompt.
- `GET /api/image-provider/jobs/:id`: status and output.
- A workflow adapter maps input image nodes, prompt nodes, seed, and output nodes. Workflow node IDs must be configured, not guessed.
- Store provider job IDs, workflow version/hash, seed, source image IDs, prompt, and QC outcome in campaign metadata.

## Security requirements

- Never accept an arbitrary provider URL from a campaign prompt.
- Restrict configured URLs to localhost or an explicitly allow-listed private host; validate redirects to prevent SSRF.
- Keep provider secrets server-side.
- Limit input/output size, job concurrency, duration, and output file type.
- Do not expose ComfyUI's API directly to the public internet.
- Make external transmission explicit if a remote host is configured.

## Fidelity rules

- Product source images are the truth for garment design and colour.
- The Character Anchor is the truth for anime identity.
- Use only verified variant images mapped to their source IDs.
- Never invent embroidery, fabric, cut, pieces, or accessories.
- If the model cannot reproduce garment details accurately, fail QC and use the original product photo or request another source image.
- The app must label generated images as AI-generated promotional imagery.

## Cost model

- Software/API: free when self-hosted.
- Hardware and electricity: user-owned costs.
- No paid API assumption or cloud credit dependency.
- Optional cloud provider support may be added later as an explicit user-selected adapter, never as the default.

## Decision

Do **not** claim the RPD image-generation requirement is completed until a provider adapter, a tested workflow template, source-image upload/queue/result handling, and fidelity QC are implemented and validated end-to-end.
