import { NextResponse } from "next/server";
import { getCarousel, updateCarousel, deleteCarousel } from "@/lib/carousels";
import type { AspectRatio, CampaignMode } from "@/types/carousel";

const validRatios: AspectRatio[] = ["1:1", "4:5", "9:16"];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const carousel = await getCarousel(id);
  if (!carousel) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(carousel);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json() as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
    if (validRatios.includes(body.aspectRatio as AspectRatio)) updates.aspectRatio = body.aspectRatio;
    if (Array.isArray(body.tags) && body.tags.every((tag) => typeof tag === "string")) updates.tags = body.tags;
    if (typeof body.chatSessionId === "string" || body.chatSessionId === null) updates.chatSessionId = body.chatSessionId;
    if (typeof body.caption === "string") updates.caption = body.caption;
    if (Array.isArray(body.hashtags) && body.hashtags.every((tag) => typeof tag === "string")) updates.hashtags = body.hashtags;
    if (body.campaignMode === "rpd" || body.campaignMode === "generic") updates.campaignMode = body.campaignMode as CampaignMode;
    if (typeof body.productUrl === "string" && /^https?:\/\//i.test(body.productUrl)) updates.productUrl = body.productUrl;
    const updated = await updateCarousel(id, updates as Parameters<typeof updateCarousel>[1]);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await deleteCarousel(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
