import { NextResponse } from "next/server";
import { listCarousels, createCarousel } from "@/lib/carousels";
import type { AspectRatio, CampaignMode } from "@/types/carousel";

export async function GET() {
  const carousels = await listCarousels();
  return NextResponse.json({ carousels });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, aspectRatio, productUrl, campaignMode } = body as {
      name?: string;
      aspectRatio?: AspectRatio;
      productUrl?: string;
      campaignMode?: CampaignMode;
    };

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (productUrl && (typeof productUrl !== "string" || !/^https?:\/\//i.test(productUrl.trim()))) {
      return NextResponse.json({ error: "Product URL must be a valid http(s) URL" }, { status: 400 });
    }

    const validRatios: AspectRatio[] = ["1:1", "4:5", "9:16"];
    const ratio = validRatios.includes(aspectRatio as AspectRatio) ? (aspectRatio as AspectRatio) : "9:16";
    const mode: CampaignMode = campaignMode === "generic" ? "generic" : "rpd";
    const carousel = await createCarousel(name.trim(), ratio, { campaignMode: mode, productUrl });
    return NextResponse.json(carousel, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
