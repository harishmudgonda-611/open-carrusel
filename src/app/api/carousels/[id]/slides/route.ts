import { NextResponse } from "next/server";
import { addSlide, reorderSlides, getCarousel } from "@/lib/carousels";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { html, notes, rpdKind, qcStatus, qcNotes } = body as { html?: string; notes?: string; rpdKind?: "product-details" | "colour-variant" | "cta" | "other"; qcStatus?: "pending" | "pass" | "fail" | "not-verified"; qcNotes?: string[] };
    const validKinds = ["product-details", "colour-variant", "cta", "other"];
    const validStatuses = ["pending", "pass", "fail", "not-verified"];
    const requiredQcChecks = ["character identity", "product identity", "garment realism", "pose/visibility", "variant colour", "anatomy", "composition", "text accuracy"];
    if ((rpdKind !== undefined && !validKinds.includes(rpdKind)) ||
        (qcStatus !== undefined && !validStatuses.includes(qcStatus)) ||
        (qcNotes !== undefined && (!Array.isArray(qcNotes) || qcNotes.length > 30 || qcNotes.some((note) => typeof note !== "string" || note.length > 500)))) {
      return NextResponse.json({ error: "Invalid slide metadata" }, { status: 400 });
    }
    if (qcStatus === "pass" && (!qcNotes || !requiredQcChecks.every((check) => qcNotes.some((note) => note.toLowerCase().includes(check))))) {
      return NextResponse.json({ error: "QC PASS requires recorded checks for all fidelity criteria" }, { status: 400 });
    }

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    const slide = await addSlide(id, html, notes, { rpdKind, qcStatus, qcNotes });
    if (!slide) {
      return NextResponse.json(
        { error: "Carousel not found or max slides reached" },
        { status: 400 }
      );
    }
    return NextResponse.json(slide, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { slideIds } = body as { slideIds?: string[] };

    if (!Array.isArray(slideIds)) {
      return NextResponse.json(
        { error: "slideIds array is required" },
        { status: 400 }
      );
    }

    const success = await reorderSlides(id, slideIds);
    if (!success) {
      return NextResponse.json(
        { error: "Carousel not found or invalid slide IDs" },
        { status: 400 }
      );
    }

    const carousel = await getCarousel(id);
    return NextResponse.json({ slides: carousel?.slides ?? [] });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
