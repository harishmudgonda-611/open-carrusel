export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
}

export interface BrandFonts {
  heading: string;
  body: string;
}

export interface CustomFont {
  name: string;
  path: string;
}

export interface BrandConfig {
  name: string;
  colors: BrandColors;
  fonts: BrandFonts;
  customFonts: CustomFont[];
  logoPath: string | null;
  styleKeywords: string[];
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_BRAND: BrandConfig = {
  name: "Right Price Deal",
  colors: {
    primary: "#6d1735",
    secondary: "#6b6b1e",
    accent: "#e8b323",
    background: "#fff8ed",
    surface: "#f8ebdd",
  },
  fonts: {
    heading: "Inter",
    body: "Inter",
  },
  customFonts: [],
  logoPath: null,
  styleKeywords: ["minimal", "premium", "product-first", "warm neutral"],
  createdAt: "",
  updatedAt: "",
};
