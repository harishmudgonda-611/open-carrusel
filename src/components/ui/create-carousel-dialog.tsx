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
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    setError(null);
    try {
      await onCreate(trimmed, aspectRatio, productUrl.trim() || undefined);
      setName("");
      setProductUrl("");
      setAspectRatio("9:16");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Campaign creation failed. Please try again.");
    } finally {
      setCreating(false);
    }
  };
