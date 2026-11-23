import { NextResponse } from "next/server";
import { getCarousel, updateRPDProductBrief } from "@/lib/carousels";
import type { RPDProductBrief } from "@/types/carousel";

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((item) => typeof item === "string" && item.length <= 500);

function validateBrief(v: unknown): v is RPDProductBrief {
  if (!v || typeof v !== "object") return false;
  const b = v as Record<string, unknown>;
  for (const key of ["sourceUrl", "productName", "brand", "sellingPrice", "originalPrice", "discount", "fabric", "garmentDescription"]) {
    if (b[key] !== undefined && typeof b[key] !== "string") return false;
  }
  if (!isStringArray(b.verifiedOffers) || !isStringArray(b.verifiedFeatures) ||
      !isStringArray(b.includedPieces) || !isStringArray(b.verificationNotes)) return false;
  if (!Array.isArray(b.variants) || !b.variants.every((variant) =>
    variant && typeof variant === "object" && typeof variant.name === "string" &&
    Array.isArray(variant.referenceImageIds) && variant.referenceImageIds.every((id: unknown) => typeof id === "string") &&
    typeof variant.verified === "boolean")) return false;
  if (!["draft", "verified", "needs-source"].includes(String(b.status))) return false;
  if (b.sourceUrl && !/^https?:\/\//i.test(b.sourceUrl as string)) return false;
  return true;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const carousel = await getCarousel(id);
  if (!carousel) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  return NextResponse.json({ brief: carousel.rpdProductBrief ?? null });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    if (!validateBrief(body)) return NextResponse.json({ error: "Invalid product brief" }, { status: 400 });
    const updated = await updateRPDProductBrief(id, body);
    if (!updated) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    return NextResponse.json({ brief: updated.rpdProductBrief });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
