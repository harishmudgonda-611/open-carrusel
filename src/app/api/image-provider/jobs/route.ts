import { NextResponse } from "next/server";
import { createImageJob } from "@/lib/comfyui-provider";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const { carouselId, garmentImageId, characterImageId, prompt, negativePrompt } = body;
    if (typeof carouselId !== "string" || typeof garmentImageId !== "string" ||
        typeof characterImageId !== "string" || typeof prompt !== "string" ||
        !prompt.trim() || prompt.length > 8000 ||
        (negativePrompt !== undefined && (typeof negativePrompt !== "string" || negativePrompt.length > 4000))) {
      return NextResponse.json({ error: "Invalid image-generation request" }, { status: 400 });
    }
    const job = await createImageJob({ carouselId, garmentImageId, characterImageId, prompt, negativePrompt: typeof negativePrompt === "string" ? negativePrompt : "" });
    return NextResponse.json({ job }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Provider submission failed" }, { status: 400 });
  }
}
