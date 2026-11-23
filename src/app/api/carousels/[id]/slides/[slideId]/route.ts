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
