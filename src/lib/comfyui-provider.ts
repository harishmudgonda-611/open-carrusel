import { readFile, mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { generateId, now } from "@/lib/utils";
import { readDataSafe, writeData } from "@/lib/data";
import { getCarousel, addReferenceImage } from "@/lib/carousels";
import type { ReferenceImage } from "@/types/carousel";

const JOBS_FILE = "rpd-image-jobs.json";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_OUTPUT_IMAGES = 4;
const MAX_WAIT_MS = 15_000;

export type ImageJobStatus = "queued" | "running" | "completed" | "failed";

export interface RPDImageJob {
  id: string;
  carouselId: string;
  promptId?: string;
  status: ImageJobStatus;
  prompt: string;
  negativePrompt: string;
  sourceImageIds: string[];
  outputs: ReferenceImage[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

interface JobsData { jobs: RPDImageJob[] }

function getConfig() {
  const raw = process.env.COMFYUI_BASE_URL?.trim() || "http://127.0.0.1:8188";
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("COMFYUI_BASE_URL must be a valid URL"); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("ComfyUI URL must be HTTP(S) without credentials, query, or fragment");
  }
  const host = url.hostname.toLowerCase();
  const explicitlyAllowed = (process.env.COMFYUI_ALLOWED_HOSTS || "")
    .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  const isLoopback = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);
  if (!isLoopback && !explicitlyAllowed.includes(host)) {
    throw new Error("Remote ComfyUI host is blocked. Add its hostname to COMFYUI_ALLOWED_HOSTS to explicitly authorize it.");
  }
  url.pathname = url.pathname.replace(/\/$/, "");
  return {
    baseUrl: url.toString().replace(/\/$/, ""),
    workflowPath: process.env.COMFYUI_WORKFLOW_PATH?.trim(),
    garmentNodeId: process.env.COMFYUI_GARMENT_NODE_ID?.trim(),
    characterNodeId: process.env.COMFYUI_CHARACTER_NODE_ID?.trim(),
    promptNodeId: process.env.COMFYUI_PROMPT_NODE_ID?.trim(),
    negativePromptNodeId: process.env.COMFYUI_NEGATIVE_PROMPT_NODE_ID?.trim(),
    bearerToken: process.env.COMFYUI_BEARER_TOKEN,
  };
}

async function comfyFetch(url: string, init: RequestInit = {}) {
  const config = getConfig();
  const headers = new Headers(init.headers);
  if (config.bearerToken) headers.set("Authorization", `Bearer ${config.bearerToken}`);
  const response = await fetch(url, { ...init, headers, redirect: "manual", signal: AbortSignal.timeout(MAX_WAIT_MS) });
  if (response.status >= 300 && response.status < 400) throw new Error("ComfyUI redirect blocked for security");
  return response;
}

async function loadWorkflow() {
  const config = getConfig();
  if (!config.workflowPath) throw new Error("COMFYUI_WORKFLOW_PATH is not configured (export a ComfyUI API-format workflow)");
  const file = path.resolve(config.workflowPath);
  const workflow = JSON.parse(await readFile(file, "utf-8")) as Record<string, { inputs?: Record<string, unknown>; class_type?: string }>;
  if (!workflow || typeof workflow !== "object" || Array.isArray(workflow) || !Object.keys(workflow).length) {
    throw new Error("Workflow file must contain a non-empty ComfyUI API prompt object");
  }
  const required = [
    ["COMFYUI_GARMENT_NODE_ID", config.garmentNodeId],
    ["COMFYUI_CHARACTER_NODE_ID", config.characterNodeId],
    ["COMFYUI_PROMPT_NODE_ID", config.promptNodeId],
  ] as const;
  for (const [envName, id] of required) {
    if (!id || !workflow[id]?.inputs) throw new Error(`${envName} must point to an existing workflow node with inputs`);
  }
  if (config.negativePromptNodeId && !workflow[config.negativePromptNodeId]?.inputs) {
    throw new Error("COMFYUI_NEGATIVE_PROMPT_NODE_ID must point to a node with inputs");
  }
  return { workflow, config };
}

async function uploadReference(ref: ReferenceImage, baseUrl: string): Promise<string> {
  const uploadRoot = path.resolve(process.cwd(), "public/uploads");
  const filePath = path.resolve(ref.absPath);
  if (!filePath.startsWith(uploadRoot + path.sep)) throw new Error("Reference image path is outside the uploads directory");
  const bytes = await readFile(filePath);
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error("Reference image exceeds 10MB provider upload limit");
  const normalized = await sharp(bytes).rotate().png().toBuffer();
  const form = new FormData();
  form.append("image", new Blob([normalized], { type: "image/png" }), `${ref.id}.png`);
  form.append("overwrite", "true");
  const response = await comfyFetch(`${baseUrl}/upload/image`, { method: "POST", body: form });
  if (!response.ok) throw new Error(`ComfyUI image upload failed (${response.status})`);
  const result = await response.json() as { name?: string; subfolder?: string; type?: string };
  if (!result.name) throw new Error("ComfyUI returned an invalid upload response");
  return result.subfolder ? `${result.subfolder}/${result.name}` : result.name;
}

async function saveJob(job: RPDImageJob) {
  const data = await readDataSafe<JobsData>(JOBS_FILE, { jobs: [] });
  const index = data.jobs.findIndex((j) => j.id === job.id);
  if (index === -1) data.jobs.push(job); else data.jobs[index] = job;
  await writeData(JOBS_FILE, data);
}

export async function getImageJob(id: string): Promise<RPDImageJob | null> {
  const data = await readDataSafe<JobsData>(JOBS_FILE, { jobs: [] });
  return data.jobs.find((j) => j.id === id) ?? null;
}

export async function getImageProviderStatus() {
  try {
    const config = getConfig();
    const configured = Boolean(config.workflowPath && config.garmentNodeId && config.characterNodeId && config.promptNodeId);
    const response = await comfyFetch(`${config.baseUrl}/system_stats`);
    if (!response.ok) return { configured, connected: false, message: `ComfyUI returned HTTP ${response.status}` };
    return { configured, connected: true, message: configured ? "ComfyUI is reachable and workflow configuration is present" : "ComfyUI is reachable; workflow node configuration is incomplete" };
  } catch (error) {
    return { configured: false, connected: false, message: error instanceof Error ? error.message : "Provider unavailable" };
  }
}

export async function createImageJob(input: {
  carouselId: string; garmentImageId: string; characterImageId: string;
  prompt: string; negativePrompt?: string;
}): Promise<RPDImageJob> {
  const carousel = await getCarousel(input.carouselId);
  if (!carousel) throw new Error("Campaign not found");
  const brief = carousel.rpdProductBrief;
  if (!brief || brief.status !== "verified") throw new Error("Verify and lock the Product Fidelity Brief before image generation");
  const variant = brief.variants.find((v) => v.referenceImageIds.includes(input.garmentImageId) && v.verified);
  if (!variant) throw new Error("Garment source image must be mapped to a verified product variant");
  const refs = carousel.referenceImages ?? [];
  const garment = refs.find((r) => r.id === input.garmentImageId);
  const character = refs.find((r) => r.id === input.characterImageId);
  if (!garment || !character || garment.id === character.id) throw new Error("Select distinct garment and character reference images from this campaign");
  const { workflow, config } = await loadWorkflow();
  const garmentFile = await uploadReference(garment, config.baseUrl);
  const characterFile = await uploadReference(character, config.baseUrl);
  const cloned = structuredClone(workflow);
  cloned[config.garmentNodeId!].inputs!.image = garmentFile;
  cloned[config.characterNodeId!].inputs!.image = characterFile;
  cloned[config.promptNodeId!].inputs!.text = input.prompt.slice(0, 8000);
  if (config.negativePromptNodeId) cloned[config.negativePromptNodeId].inputs!.text = (input.negativePrompt || "").slice(0, 4000);
  const response = await comfyFetch(`${config.baseUrl}/prompt`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: cloned, client_id: `rpd-${input.carouselId}` }),
  });
  const payload = await response.json() as { prompt_id?: string; error?: unknown; node_errors?: unknown };
  if (!response.ok || !payload.prompt_id) throw new Error("ComfyUI rejected workflow submission");
  const job: RPDImageJob = {
    id: generateId(), carouselId: input.carouselId, promptId: payload.prompt_id,
    status: "queued", prompt: input.prompt, negativePrompt: input.negativePrompt || "",
    sourceImageIds: [garment.id, character.id], outputs: [], createdAt: now(), updatedAt: now(),
  };
  await saveJob(job);
  return job;
}

export async function refreshImageJob(id: string): Promise<RPDImageJob | null> {
  const job = await getImageJob(id);
  if (!job || !job.promptId || job.status === "completed" || job.status === "failed") return job;
  const config = getConfig();
  const response = await comfyFetch(`${config.baseUrl}/history/${encodeURIComponent(job.promptId)}`);
  if (!response.ok) throw new Error(`ComfyUI history request failed (${response.status})`);
  const history = await response.json() as Record<string, { outputs?: Record<string, { images?: Array<{ filename: string; subfolder?: string; type?: string }> }>; status?: { completed?: boolean; status_str?: string; messages?: unknown[] } }>;
  const entry = history[job.promptId];
  if (!entry) {
    job.status = "running"; job.updatedAt = now(); await saveJob(job); return job;
  }
  if (entry.status?.status_str === "error") {
    job.status = "failed"; job.error = "ComfyUI workflow failed"; job.updatedAt = now(); await saveJob(job); return job;
  }
  const imageOutputs = Object.values(entry.outputs ?? {}).flatMap((node) => node.images ?? []).slice(0, MAX_OUTPUT_IMAGES);
  if (!imageOutputs.length) {
    job.status = entry.status?.completed ? "failed" : "running";
    if (job.status === "failed") job.error = "Workflow completed without image outputs";
    job.updatedAt = now(); await saveJob(job); return job;
  }
  const uploadDir = path.resolve(process.cwd(), "public/uploads/generated");
  await mkdir(uploadDir, { recursive: true });
  const refs: ReferenceImage[] = [];
  for (const image of imageOutputs) {
    const viewUrl = new URL(`${config.baseUrl}/view`);
    viewUrl.searchParams.set("filename", image.filename);
    viewUrl.searchParams.set("subfolder", image.subfolder || "");
    viewUrl.searchParams.set("type", image.type || "output");
    const download = await comfyFetch(viewUrl.toString());
    if (!download.ok) throw new Error(`Could not download ComfyUI output (${download.status})`);
    const bytes = Buffer.from(await download.arrayBuffer());
    if (bytes.byteLength > 30 * 1024 * 1024) throw new Error("Generated output exceeds 30MB limit");
    const png = await sharp(bytes).rotate().png().toBuffer();
    const imageId = generateId();
    const filename = `${imageId}.png`;
    const absPath = path.join(uploadDir, filename);
    await writeFile(absPath, png);
    refs.push({ id: imageId, url: `/uploads/generated/${filename}`, absPath, name: `AI generated RPD image ${refs.length + 1}`, addedAt: now() });
  }
  for (const ref of refs) await addReferenceImage(job.carouselId, ref);
  job.outputs = refs; job.status = "completed"; job.updatedAt = now(); await saveJob(job);
  return job;
}
