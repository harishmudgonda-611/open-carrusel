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
  );
}
