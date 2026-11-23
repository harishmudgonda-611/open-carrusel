import { NextResponse } from "next/server";
import { refreshImageJob } from "@/lib/comfyui-provider";

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  try {
    const job = await refreshImageJob(jobId);
    if (!job) return NextResponse.json({ error: "Image job not found" }, { status: 404 });
    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to check image job" }, { status: 502 });
  }
}
