# RPD: Zero-cost image-generation testing

This guide separates **manual experiments** from a dependable production provider. Free GPU availability, quotas, queues, model weights, and third-party APIs can change. Verify the current terms before publishing generated content.

## Recommended first experiment: Leffa on Hugging Face ZeroGPU

- Browser demo: https://huggingface.co/spaces/monk7/vtryon-a
- The Space author describes an anonymous API and Leffa-based virtual try-on.
- It supports person image, garment image, garment category (upper/lower/dress), and generation settings.
- It is a third-party hosted service. Uploading images sends them to that host; do not upload private images or content without permission.
- The Space can sleep, queue, fail, change, or become unavailable. Its API contract must be rechecked before any app integration.
- Hugging Face currently documents a small free ZeroGPU quota (5 GPU minutes/day for free accounts), with eligibility, queue, and shared-capacity limitations. Check the official page for current terms.

### Important RPD mismatch

The demo expects a **full-body person image**, not an anime character design prompt. Virtual try-on may transform the input person into a photorealistic human. Therefore this is only an experiment for garment-transfer quality; it is **not approved** for RPD unless the output passes the anime-character identity gate.

### Manual test procedure (phone-friendly)

1. Open the Leffa Space in a browser.
2. Use a legally usable anime character reference image with a full-body pose. Do not use a private/person image.
3. Upload the exact product garment image.
4. Choose the closest supported category.
5. Generate one sample; avoid spending quota on repeated low-quality attempts.
6. Download the result and compare it side-by-side with the original garment source.
7. Record the pass/fail checklist below. If the anime character becomes a photorealistic human, the test **fails immediately**.

### RPD fidelity checklist

- [ ] Anime-inspired model remains clearly anime (not photorealistic human).
- [ ] Same model identity and recognizable face.
- [ ] Exact product silhouette/cut/neckline.
- [ ] Product colour is accurate.
- [ ] Print, motifs, embroidery, stitching and embellishments are not invented or moved.
- [ ] Correct garment pieces are present.
- [ ] Clothing texture and folds look realistic.
- [ ] Garment is fully visible; pose does not hide important details.
- [ ] Anatomy and hands are acceptable.
- [ ] No added text, logos, claims, or unwanted accessories.

**Any failed item means the sample is rejected.** Do not label it QC PASS or publish it.

## Commercial-use / licensing checks

- Leffa's upstream project reports an MIT license, but the complete pipeline includes dependencies and checkpoints. Review every applicable model/checkpoint/dependency license before commercial publication.
- Avoid CatVTON/IDM-VTON for commercial RPD content unless separate commercial permission is obtained; their upstream model licensing is non-commercial.
- A public demo's license badge does not automatically grant rights to every included dependency or uploaded image.

## Kaggle as a temporary GPU experiment

Kaggle notebooks may offer free GPU sessions depending on account eligibility, quotas, and availability. They are temporary notebook runtimes, not persistent production APIs.

1. Create/open a notebook and check GPU availability in settings.
2. Use only a workflow whose models and dependencies have acceptable licenses.
3. Run a single controlled test.
4. Save output to notebook output/storage and download it.
5. Do not expose an unauthenticated ComfyUI server through a public tunnel.

Official docs: https://www.kaggle.com/docs/notebooks

## Why no default production integration yet

- Public demo availability and API schemas can change.
- Free GPU quotas are small and queues may be long.
- External processing means product/person images leave the local environment.
- Try-on models can alter garment details and character identity.
- The current RPD workflow requires image-by-image human QC.

## Production recommendation

Keep the self-hosted ComfyUI adapter as the configurable provider. Use ZeroGPU/Kaggle only for manual experiments until a specific workflow repeatedly passes the RPD fidelity gate. Do not silently fall back to an external service, upload images without consent, or auto-mark outputs as QC PASS.

## Test links

- Leffa ZeroGPU Space: https://huggingface.co/spaces/monk7/vtryon-a
- Hugging Face ZeroGPU docs: https://huggingface.co/docs/hub/en/spaces-zerogpu
- Kaggle Notebooks: https://www.kaggle.com/docs/notebooks


## Real manual test log (user-run)

### Leffa + photorealistic person + teal ethnic 3-piece set

- **Observed:** generation completed; outfit colour and some printed details remained recognizable.
- **Rejected:** anime requirement failed because the result was a photorealistic person.

### Leffa + anime character + same teal ethnic 3-piece set

- **Observed:** anime identity remained anime; upper garment transfer was visible.
- **Rejected:** the output shortened/changed the kurta silhouette, did not faithfully transfer the dupatta, and retained the reference character's navy lower garment rather than the source pants pattern. Pattern details also changed.
- **Conclusion:** this test configuration is not suitable for full ethnic-set RPD product fidelity. Do not keep retrying the same upper-category workflow with prompt-only tweaks.

Screenshots were reviewed in the conversation; they are not committed as repository assets.

## Fail-safe production workflow when try-on fails

1. **Do not publish the generated try-on.** Mark it failed and keep the source product image as the truth.
2. Prefer a transparent cutout/composite workflow: preserve the original product photography untouched in a dedicated product panel and place an anime character beside it, with the anime styling limited to the character. This is the honest fallback and does not claim the character is wearing the exact garment.
3. If the product image contains a human model, do not claim a garment-preserving anime transformation unless that exact transformation has been visually verified. Anime treatment may be limited to the model/face only if the garment pixels/details remain unchanged and the result passes comparison.
4. Use generative try-on only as an optional candidate. The image must pass character style, exact silhouette, all included pieces, colour, pattern/motif placement, neckline, borders and embellishment checks.
5. A failed hard gate means the production method must change. Do not repeat the same model/configuration or simply rewrite the prompt.

**Recommended RPD architecture:** separate the product-fidelity path from the creative-character path. The product image is immutable source material; generated character assets are separate. Layout/compositing combines them without falsely representing the outfit as a successful try-on.
