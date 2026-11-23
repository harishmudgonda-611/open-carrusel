# Right Price Deal Studio

A local-first fashion affiliate carousel builder forked from Open Carrusel. It helps create product-first RPD campaigns from source product links and screenshots, with HTML slide layout, preview, and PNG export.

## RPD workflow

1. Create a campaign and optionally paste a product URL.
2. Inspect the source page; if access is blocked, upload product screenshots.
3. Save a Product Fidelity Brief with verified facts and colour variants.
4. Generate a single slide at a time: details poster, one image-only slide per verified variant, then CTA.
5. Export the carousel and create social captions.

## Product fidelity and image-generation limits

The app's current Claude CLI integration creates HTML/CSS slides; it does **not** include an image-generation or garment-transfer provider. It therefore cannot promise an anime model wearing the exact source garment. RPD prompts explicitly avoid fabricating generated imagery and prioritize untouched source product photography. A separate anime-character image can be composited only when supplied. The product source image remains the truth.

## Local setup

This project retains the Open Carrusel setup and local storage. Install dependencies and run `npm run dev`. AI chat requires Claude CLI. See upstream setup instructions and `npm run doctor`.

## Quality policy

Unknown product facts remain marked unverified. No unverified fabric/comfort claims, invented variants, fake links or QR codes. Colour slides are image-only except the discreet Right Price Deal watermark. One slide per request; wait for NEXT.

## Upstream

Based on [Open Carrusel](https://github.com/Hainrixz/open-carrusel), MIT license.
