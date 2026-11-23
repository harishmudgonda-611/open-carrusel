export type AspectRatio = "1:1" | "4:5" | "9:16";

export type CampaignMode = "generic" | "rpd";

export type RPDSlideKind = "product-details" | "colour-variant" | "cta" | "other";

export type RPDQualityStatus = "pending" | "pass" | "fail" | "not-verified";

export interface RPDVariant {
  name: string;
  referenceImageIds: string[];
  verified: boolean;
}

export interface RPDProductBrief {
  sourceUrl?: string;
  productName?: string;
  brand?: string;
  sellingPrice?: string;
  originalPrice?: string;
  discount?: string;
  verifiedOffers: string[];
  verifiedFeatures: string[];
  fabric?: string;
  garmentDescription?: string;
  includedPieces?: string[];
  variants: RPDVariant[];
  verificationNotes: string[];
  status: "draft" | "verified" | "needs-source";
  updatedAt?: string;
}

export interface Slide {
  id: string;
  html: string;
  previousVersions: string[];
  order: number;
  notes: string;
  rpdKind?: RPDSlideKind;
  qcStatus?: RPDQualityStatus;
  qcNotes?: string[];
}

export interface ReferenceImage {
  id: string;
  url: string;
  absPath: string;
  name: string;
  addedAt: string;
}

export interface Carousel {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  slides: Slide[];
  referenceImages: ReferenceImage[];
  caption?: string;
  hashtags?: string[];
  chatSessionId: string | null;
  isTemplate: boolean;
  tags: string[];
  campaignMode?: CampaignMode;
  productUrl?: string;
  rpdProductBrief?: RPDProductBrief;
  createdAt: string;
  updatedAt: string;
}

export interface CarouselsData {
  carousels: Carousel[];
}

export const DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
};

export const MAX_SLIDES = 20;
export const MAX_VERSIONS = 5;
