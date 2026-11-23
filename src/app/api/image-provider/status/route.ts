import { NextResponse } from "next/server";
import { getImageProviderStatus } from "@/lib/comfyui-provider";

export async function GET() {
  return NextResponse.json(await getImageProviderStatus());
}
