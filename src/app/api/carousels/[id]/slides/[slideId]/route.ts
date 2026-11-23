import { NextResponse } from "next/server";
import { updateSlide, deleteSlide } from "@/lib/carousels";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; slideId: string }> }
) {
  const { id, slideId } = await params;
  try {
    const body = await request.json();
    const allowed = ["html", "notes", "rpdKind", "qcStatus", "qcNotes"];
    const updates = Object.fromEntries(Object.entries(body as Record<string, unknown>).filter(([key]) => allowed.includes(key)));
    const validKinds = ["product-details", "colour-variant", "cta", "other"];
    const validStatuses = ["pending", "pass", "fail", "not-verified"];
    const requiredQcChecks = ["character identity", "product identity", "garment realism", "pose/visibility", "variant colour", "anatomy", "composition", "text accuracy"];
    if ((updates.rpdKind !== undefined && !validKinds.includes(String(updates.rpdKind))) ||
        (updates.qcStatus !== undefined && !validStatuses.includes(String(updates.qcStatus))) ||
        (updates.qcNotes !== undefined && (!Array.isArray(updates.qcNotes) || updates.qcNotes.length > 30 || updates.qcNotes.some((note: unknown) => typeof note !== "string" || note.length > 500))) ||
        (updates.html !== undefined && typeof updates.html !== "string") ||
        (updates.notes !== undefined && typeof updates.notes !== "string")) {
      return NextResponse.json({ error: "Invalid slide metadata" }, { status: 400 });
    }
    if (updates.qcStatus === "pass" && (!updates.qcNotes || !requiredQcChecks.every((check) => (updates.qcNotes as string[]).some((note) => note.toLowerCase().includes(check))))) {
      return NextResponse.json({ error: "QC PASS requires recorded checks for all fidelity criteria" }, { status: 400 });
    }
    const slide = await updateSlide(id, slideId, updates);
    if (!slide) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(slide);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; slideId: string }> }
) {
  const { id, slideId } = await params;
  const deleted = await deleteSlide(id, slideId);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
