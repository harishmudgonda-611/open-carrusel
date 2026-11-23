# ComfyUI workflow setup for RPD

This is a provider adapter, not a bundled model. A user installs ComfyUI and an image-edit/virtual-try-on workflow compatible with their model and hardware, then exports it in **API format**.

## Configuration

Set these server environment variables:

| Variable | Required | Description |
|---|---|---|
| `COMFYUI_BASE_URL` | No | Default `http://127.0.0.1:8188` |
| `COMFYUI_WORKFLOW_PATH` | Yes | Absolute path to API-format workflow JSON |
| `COMFYUI_GARMENT_NODE_ID` | Yes | Load Image node ID for the garment source |
| `COMFYUI_CHARACTER_NODE_ID` | Yes | Load Image node ID for the character anchor |
| `COMFYUI_PROMPT_NODE_ID` | Yes | Positive CLIP Text Encode node ID |
| `COMFYUI_NEGATIVE_PROMPT_NODE_ID` | No | Negative CLIP Text Encode node ID |
| `COMFYUI_ALLOWED_HOSTS` | No | Comma-separated explicit remote host allow-list |
| `COMFYUI_BEARER_TOKEN` | No | Optional gateway bearer token; kept server-side |

By default only loopback hosts are allowed. Remote hosts are blocked unless explicitly allow-listed. ComfyUI itself is unauthenticated by default; do not expose it to the public internet. An allow-listed remote host should be a private, trusted endpoint or a secured gateway.

The workflow must have the configured node IDs with an `inputs.image` field on both Load Image nodes and an `inputs.text` field on prompt nodes. Outputs must include one or more image files. The adapter uploads the source images, submits the workflow, polls history and downloads generated images into this app's local `public/uploads/generated` directory.

## Endpoints

- `GET /api/image-provider/status`: reports connection/configuration state.
- `POST /api/image-provider/jobs`: submit a generation. JSON fields: `carouselId`, `garmentImageId`, `characterImageId`, `prompt`, optional `negativePrompt`. Requires a verified brief and the garment source mapped to a verified variant.
- `GET /api/image-provider/jobs/{jobId}`: refresh status and import outputs to campaign references once completed.

Example generation prompt should be constructed from verified brief facts and must explicitly instruct the workflow to preserve the exact garment design, colour, silhouette, embroidery/print placement, pieces and fabric appearance; do not add unsupported details. The app currently does not generate the prompt automatically and does not perform AI-based fidelity scoring. Human visual QC remains mandatory.

## Security and limits

- Server-side only. Never call ComfyUI from the browser.
- URL redirects are rejected; host must be loopback or explicitly allow-listed.
- Uploaded source refs must resolve inside `public/uploads`.
- Input upload limit 10 MB; output limit 30 MB.
- Output image files are normalized to PNG.
- The app does not expose ComfyUI's API key or workflow file to the browser.
- Protect this app with authentication before exposing it to an untrusted network; these endpoints are not a replacement for application authentication.
