"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { Carousel, ReferenceImage } from "@/types/carousel";

type ProviderStatus = { configured: boolean; connected: boolean; message: string };
type ImageJob = { id: string; status: "queued" | "running" | "completed" | "failed"; error?: string; outputs: ReferenceImage[] };

function buildPrompt(carousel: Carousel) {
  const brief = carousel.rpdProductBrief;
  const garment = brief?.garmentDescription || brief?.productName || "the exact garment shown in the garment reference image";
  const facts = [brief?.fabric, ...(brief?.verifiedFeatures ?? []), ...(brief?.includedPieces ?? [])].filter(Boolean).join("; ");
  return [
    "Create one 9:16 vertical promotional fashion image.",
    "Use the character reference as the exact anime-inspired character identity; do not turn the character into a photorealistic human.",
    "Render the clothing as photorealistic fabric with natural folds, texture, stitching, and realistic construction.",
    "Dress the character in the exact garment shown in the garment source image. Preserve silhouette, neckline, sleeves, length, cut, colour, print, motif placement, embroidery, borders, buttons, lace, dupatta and all visible details. Do not redesign, embellish, simplify, or invent details.",
    `Garment reference description: ${garment}.`,
    facts ? `Only verified product facts: ${facts}.` : "",
    "Use a minimal, premium, neutral background. Natural fashion pose with the garment clearly visible. No promotional text or extra accessories. Add only the small watermark 'Right Price Deal'.",
  ].filter(Boolean).join("\n");
}

export function RPDImageProviderPanel({ carousel, onGenerated }: { carousel: Carousel; onGenerated: () => void }) {
  const [provider, setProvider] = useState<ProviderStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [garmentId, setGarmentId] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [promptOverride, setPromptOverride] = useState<string | null>(null);
  const [negativePrompt, setNegativePrompt] = useState("photorealistic human, altered garment design, wrong colour, invented embroidery, changed neckline, missing pieces, extra accessories, text, watermark duplication, malformed anatomy, extra fingers, cropped garment");
  const [job, setJob] = useState<ImageJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fallbackProductId, setFallbackProductId] = useState("");
  const [fallbackCharacterId, setFallbackCharacterId] = useState("");
  const [fallbackSubmitting, setFallbackSubmitting] = useState(false);

  const references = useMemo(() => carousel.referenceImages ?? [], [carousel.referenceImages]);
  const defaultPrompt = useMemo(() => buildPrompt(carousel), [carousel]);
  const prompt = promptOverride ?? defaultPrompt;
  const mappedGarmentRefs = useMemo(() => {
    const ids = new Set(carousel.rpdProductBrief?.variants.filter(v => v.verified).flatMap(v => v.referenceImageIds) ?? []);
    return references.filter(ref => ids.has(ref.id));
  }, [carousel.rpdProductBrief, references]);

  const refreshStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/image-provider/status");
      setProvider(await res.json());
    } catch {
      setProvider({ configured: false, connected: false, message: "Unable to reach provider status endpoint" });
    } finally { setLoadingStatus(false); }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- state is updated only after the asynchronous provider request.\n  useEffect(() => { void refreshStatus(); }, [refreshStatus]);

  const jobId = job?.id;
  const isPending = job?.status === "queued" || job?.status === "running";
  useEffect(() => {
    if (!jobId || !isPending) return;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/image-provider/jobs/${jobId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to check generation job");
        const updated: ImageJob = data.job;
        setJob(updated);
        if (updated.status === "completed") onGenerated();
        if (updated.status === "failed") setError(updated.error || "Generation failed");
      } catch (e) { setError(e instanceof Error ? e.message : "Generation status error"); }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [jobId, isPending, onGenerated]);

  function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[char] ?? char));
  }

  function safeImageUrl(value: string) {
    if (value.startsWith("/uploads/")) return value;
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
    } catch {
      return "";
    }
  }

  async function createFidelitySafeSlide() {
    const product = references.find((ref) => ref.id === fallbackProductId);
    const character = references.find((ref) => ref.id === fallbackCharacterId);
    const productUrl = product ? safeImageUrl(product.url) : "";
    const characterUrl = character ? safeImageUrl(character.url) : "";
    if (!product || !character || !productUrl || !characterUrl || product.id === character.id) {
      setError("Choose two different valid source images.");
      return;
    }

    setError("");
    setFallbackSubmitting(true);
    try {
      const html = `<div style="width:100%;height:100%;box-sizing:border-box;background:#f5efe7;color:#2f2924;font-family:Arial,sans-serif;display:flex;flex-direction:column;padding:3.5%;gap:2.5%;overflow:hidden">
        <div style="flex:1;min-height:0;display:grid;grid-template-columns:1.12fr .88fr;gap:2.5%;align-items:stretch">
          <div style="min-width:0;min-height:0;background:#fff;border-radius:22px;overflow:hidden;display:flex;align-items:center;justify-content:center;border:1px solid #e8ded3">
            <img src="${escapeHtml(productUrl)}" alt="Original product source photo" style="width:100%;height:100%;object-fit:contain;display:block" />
          </div>
          <div style="min-width:0;min-height:0;background:#eee3d7;border-radius:22px;overflow:hidden;display:flex;align-items:center;justify-content:center;border:1px solid #e8ded3">
            <img src="${escapeHtml(characterUrl)}" alt="Illustrative anime character" style="width:100%;height:100%;object-fit:contain;display:block" />
          </div>
        </div>
        <div style="flex:0 0 auto;text-align:center;font-size:clamp(12px,2.2vw,26px);line-height:1.3;color:#62574d;padding:0 2%">Original product photo • Character is illustrative and is not shown wearing a verified transfer</div>
        <div style="flex:0 0 auto;text-align:center;font-size:clamp(12px,2vw,24px);letter-spacing:.06em;font-weight:700;color:#5d5147">Right Price Deal</div>
      </div>`;

      const res = await fetch(`/api/carousels/${carousel.id}/slides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          notes: "Fidelity-safe composition: original product source shown untouched beside a separate illustrative anime character. No virtual try-on or garment-transfer claim. Review source image framing before publishing.",
          rpdKind: "product-details",
          qcStatus: "not-verified",
          qcNotes: ["Product source image retained unchanged", "Character is separate and illustrative", "No garment-transfer claim", "Composition requires human visual review"],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to create fallback slide");
      onGenerated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fallback slide creation failed");
    } finally {
      setFallbackSubmitting(false);
    }
  }

  async function generate() {
    setError("");
    setJob(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/image-provider/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carouselId: carousel.id, garmentImageId: garmentId, characterImageId: characterId, prompt, negativePrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Provider submission failed");
      setJob(data.job);
    } catch (e) { setError(e instanceof Error ? e.message : "Generation failed"); }
    finally { setSubmitting(false); }
  }

  return (
    <>
      <details className="border-b border-border bg-surface px-3 py-2">
        <summary className="cursor-pointer select-none text-sm font-medium">Fidelity-safe product + anime composition</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <p className="text-xs text-muted-foreground md:col-span-2">Creates a slide from the untouched original product image and a separate anime-character image. It does not generate a try-on or imply that the character is wearing the product. Both images remain independently visible.</p>
          <div className="grid gap-2">
            <label className="text-xs font-medium">Original product source</label>
            <select className="h-9 rounded-md border border-border bg-background px-2 text-sm" value={fallbackProductId} onChange={(e) => setFallbackProductId(e.target.value)}>
              <option value="">Choose product photo</option>
              {references.map((ref) => <option key={ref.id} value={ref.id}>{ref.name}</option>)}
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-medium">Separate anime character</label>
            <select className="h-9 rounded-md border border-border bg-background px-2 text-sm" value={fallbackCharacterId} onChange={(e) => setFallbackCharacterId(e.target.value)}>
              <option value="">Choose character image</option>
              {references.filter((ref) => ref.id !== fallbackProductId).map((ref) => <option key={ref.id} value={ref.id}>{ref.name}</option>)}
            </select>
          </div>
          <Button variant="outline" size="sm" disabled={!fallbackProductId || !fallbackCharacterId || fallbackProductId === fallbackCharacterId || fallbackSubmitting} onClick={() => void createFidelitySafeSlide()}>
            {fallbackSubmitting ? "Creating slide…" : "Create safe composition slide"}
          </Button>
        </div>
      </details>
      <details className="border-b border-border bg-surface px-3 py-2">
      <summary className="cursor-pointer select-none text-sm font-medium">AI garment image generation <span className="ml-2 text-xs text-muted-foreground">{provider?.connected ? "ComfyUI connected" : "Provider setup required"}</span></summary>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs md:col-span-2"><strong>Product-fidelity fail-safe:</strong> Virtual try-on is experimental. If it changes the garment, omits any included piece, or makes the character photorealistic, reject the result. Do not repeat the same provider/configuration with prompt-only tweaks. Use the untouched product photo with a separate anime character as the honest fallback.</div>\n        <div className="rounded-md border border-border p-3 text-xs">
          <div className="font-medium">Provider</div>
          <div className={provider?.connected ? "text-green-600" : "text-muted-foreground"}>{loadingStatus ? "Checking…" : provider?.message || "Not checked"}</div>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => void refreshStatus()}>Check connection</Button>
          <p className="mt-2 text-muted-foreground">Self-hosted ComfyUI only by default. Remote hosts require an explicit server allow-list. This app does not provide paid APIs or a model host.</p>
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-medium">Verified garment source</label>
          <select className="h-9 rounded-md border border-border bg-background px-2 text-sm" value={garmentId} onChange={e => setGarmentId(e.target.value)}>
            <option value="">Select verified garment image</option>
            {mappedGarmentRefs.map(ref => <option key={ref.id} value={ref.id}>{ref.name}</option>)}
          </select>
          <label className="text-xs font-medium">Anime character anchor</label>
          <select className="h-9 rounded-md border border-border bg-background px-2 text-sm" value={characterId} onChange={e => setCharacterId(e.target.value)}>
            <option value="">Select character reference</option>
            {references.filter(ref => ref.id !== garmentId).map(ref => <option key={ref.id} value={ref.id}>{ref.name}</option>)}
          </select>
        </div>
        <div className="grid gap-2 md:col-span-2">
          <label className="text-xs font-medium">Generation prompt</label>
          <textarea className="min-h-28 w-full rounded-md border border-border bg-background p-2 text-xs" value={prompt} onChange={e => setPromptOverride(e.target.value)} />
          <label className="text-xs font-medium">Negative prompt</label>
          <textarea className="min-h-16 w-full rounded-md border border-border bg-background p-2 text-xs" value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)} />
          <Button size="sm" disabled={!provider?.configured || !provider.connected || !garmentId || !characterId || !prompt.trim() || submitting || isPending} onClick={generate}>
            {submitting ? "Submitting…" : "Generate image"}
          </Button>
        </div>
      </div>
      {job && <div className="mt-3 rounded-md border border-border p-3 text-sm"><strong>Job:</strong> {job.status}{job.error && <p className="text-destructive">{job.error}</p>}{job.outputs?.length > 0 && <div className="mt-2 grid grid-cols-2 gap-2">{job.outputs.map(ref => <a key={ref.id} href={ref.url} target="_blank" rel="noreferrer"><Image src={ref.url} alt={ref.name} width={540} height={960} unoptimized className="w-full rounded border border-border" /></a>)}</div>}</div>}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {!carousel.rpdProductBrief || carousel.rpdProductBrief.status !== "verified" ? <p className="mt-2 text-xs text-amber-600">Generation is disabled until the Product Fidelity Brief is verified.</p> : null}
    </details>
    </>
  );
}
