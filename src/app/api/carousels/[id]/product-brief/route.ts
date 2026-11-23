import { NextResponse } from "next/server";
import { getCarousel, updateRPDProductBrief } from "@/lib/carousels";
import type { RPDProductBrief } from "@/types/carousel";

const MAX_ITEMS = 50;
const MAX_TEXT = 2000;
const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length <= MAX_ITEMS && v.every((item) => typeof item === "string" && item.length <= MAX_TEXT);

function validateBrief(v: unknown, referenceImageIds: Set<string>): v is RPDProductBrief {
  if (!v || typeof v !== "object") return false;
  const b = v as Record<string, unknown>;
  for (const key of ["sourceUrl", "productName", "brand", "sellingPrice", "originalPrice", "discount", "fabric", "garmentDescription"]) {
    if (b[key] !== undefined && (typeof b[key] !== "string" || b[key].length > MAX_TEXT)) return false;
  }
  if (!isStringArray(b.verifiedOffers) || !isStringArray(b.verifiedFeatures) ||
      !isStringArray(b.includedPieces) || !isStringArray(b.verificationNotes)) return false;
  if (!Array.isArray(b.variants) || b.variants.length > MAX_ITEMS || !b.variants.every((variant) =>
    variant && typeof variant === "object" && typeof variant.name === "string" && variant.name.length <= 100 &&
    Array.isArray(variant.referenceImageIds) && variant.referenceImageIds.length <= 20 &&
    variant.referenceImageIds.every((id: unknown) => typeof id === "string" && referenceImageIds.has(id)) &&
    typeof variant.verified === "boolean")) return false;
  if (!["draft", "verified", "needs-source"].includes(String(b.status))) return false;
  if (b.sourceUrl) {
    try {
      const url = new URL(b.sourceUrl as string);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return false;
    } catch {
      return false;
    }
  }
  // A verified brief must be actionable: product identity/source and all verified
  // variants must map to their exact uploaded reference images.
  if (b.status === "verified" && (
    !b.sourceUrl || !b.productName || !Array.isArray(b.variants) || b.variants.length === 0 ||
    !b.variants.every((variant) => variant.verified && variant.referenceImageIds.length > 0)
  )) return false;
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
    const carousel = await getCarousel(id);
    if (!carousel) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    const referenceImageIds = new Set((carousel.referenceImages ?? []).map((image) => image.id));
    if (!validateBrief(body, referenceImageIds)) return NextResponse.json({ error: "Invalid product brief or unmapped source images" }, { status: 400 });
    const updated = await updateRPDProductBrief(id, body);
    if (!updated) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    return NextResponse.json({ brief: updated.rpdProductBrief });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
