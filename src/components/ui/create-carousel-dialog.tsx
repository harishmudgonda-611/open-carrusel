"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Layers, X, Link2, Sparkles } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { AspectRatioSelector } from "@/components/editor/AspectRatioSelector";
import type { AspectRatio } from "@/types/carousel";

interface CreateCarouselDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, aspectRatio: AspectRatio, productUrl?: string) => Promise<void>;
}

export function CreateCarouselDialog({ open, onOpenChange, onCreate }: CreateCarouselDialogProps) {
  const [name, setName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, aspectRatio, productUrl.trim() || undefined);
    setName("");
    setProductUrl("");
    setAspectRatio("9:16");
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!creating) onOpenChange(nextOpen); }}>
      <Dialog.Portal>
        <Dialog.Overlay data-oc-overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content data-oc-dialog className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface border border-border p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center"><Layers className="h-4 w-4 text-accent" /></div>
              <Dialog.Title className="text-base font-semibold">New Right Price Deal Campaign</Dialog.Title>
            </div>
            <button type="button" onClick={() => !creating && onOpenChange(false)} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="Close" disabled={creating}><X className="h-4 w-4" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Campaign name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., KALINI embroidered kurta deal" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Product link (optional)</label>
              <div className="relative"><Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="Paste Myntra / Amazon / Flipkart link" inputMode="url" /></div>
              <p className="text-[11px] text-muted-foreground mt-1">AI will try to inspect it. If blocked, add product screenshots in the editor.</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Canvas</label>
              <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />
            </div>
            <div className="rounded-lg bg-muted/60 p-3 text-xs flex gap-2"><Sparkles className="h-4 w-4 shrink-0 text-accent" /><span>RPD rules: product-details slide, one image-only slide per verified colour, and final CTA. Slides are created one at a time.</span></div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={creating}>Cancel</Button>
            <Button variant="accent" size="sm" onClick={handleCreate} disabled={!name.trim() || creating}>{creating ? "Creating…" : "Create campaign"}</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
