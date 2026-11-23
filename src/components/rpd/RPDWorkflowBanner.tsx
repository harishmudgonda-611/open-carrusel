"use client";

import { AlertTriangle, CheckCircle2, Link2, ImagePlus, ShieldCheck } from "lucide-react";
import type { Carousel } from "@/types/carousel";

export function RPDWorkflowBanner({ carousel }: { carousel: Carousel }) {
  const brief = carousel.rpdProductBrief;
  const verified = brief?.status === "verified";
  const hasRefs = (carousel.referenceImages?.length ?? 0) > 0;
  return (
    <section className="shrink-0 border-b border-border bg-amber-50/70 dark:bg-amber-950/20 px-4 py-3">
      <div className="flex flex-col gap-2 max-w-5xl mx-auto">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-700 dark:text-amber-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold">RPD Product Fidelity Mode</p>
            <p className="text-xs text-muted-foreground">This app builds HTML layouts. An image-generation / exact garment-transfer provider is not connected; it will not pretend to create an anime model wearing the exact product.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {carousel.productUrl && <a href={carousel.productUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 hover:underline"><Link2 className="h-3 w-3" />Source product</a>}
          <span className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1"><ImagePlus className="h-3 w-3" />{hasRefs ? `${carousel.referenceImages.length} source image(s) attached` : "Upload source screenshots in the chat panel"}</span>
          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${verified ? "bg-green-50 text-green-800 border-green-200" : "bg-background"}`}>{verified ? <CheckCircle2 className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}{verified ? "Product brief verified" : "Product brief not yet verified"}</span>
        </div>
        {brief && <p className="text-[11px] text-muted-foreground">Brief: {brief.productName || "Untitled product"} · {brief.variants.length} variant(s) recorded · status: {brief.status}</p>}
      </div>
    </section>
  );
}
