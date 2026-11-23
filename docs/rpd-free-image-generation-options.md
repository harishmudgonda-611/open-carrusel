# RPD: zero-cost image-generation test options

This guide distinguishes free testing from a dependable production provider. **No free GPU service is guaranteed to remain available or suitable for commercial use.** Check the host/model terms before publishing generated content.

## Recommended short test: Hugging Face ZeroGPU try-on demo

- Browser-based, no local GPU required.
- A Leffa ZeroGPU demo/API option may be tested here: https://huggingface.co/spaces/monk7/vtryon-a\n- Leffa's model/code license is reported as MIT; verify all dependency/checkpoint terms before commercial publishing. The Space author documents an anonymous JSON API, but its availability is not guaranteed.\n- Avoid using CatVTON or IDM-VTON for commercial RPD content without separate authorization; their model licenses are non-commercial.
- ZeroGPU free account quota is limited (currently documented as 5 GPU minutes/day, with queues and eligibility restrictions).
- Typical demo workflow: upload person/model reference, upload garment reference, choose garment type, run try-on, download result.
- This tests whether garment transfer works with the chosen anime character. It does **not** establish that the output will remain anime or faithfully preserve every garment detail.
- Treat this as an experimental third-party service: images are uploaded to the host. Do not upload private images or images without rights/permission.

Official ZeroGPU information: https://huggingface.co/docs/hub/en/spaces-zerogpu\n\nThe CatVTON demo is useful for non-commercial experimentation only; the upstream model card states CC BY-NC-SA 4.0. Do not use it in commercial Right Price Deal promotion unless you have explicit commercial permission.

## More flexible temporary GPU: Kaggle Notebook

Kaggle notebooks can offer free GPU sessions (availability and quota depend on account and current platform policy). Official docs currently describe GPU notebook sessions and a 12-hour session maximum. This is a notebook runtime, not a persistent API server.

Official documentation: https://www.kaggle.com/docs/notebooks

Potential use:
1. Create a Kaggle notebook on the account.
2. Enable Internet and a GPU accelerator in Notebook settings, subject to eligibility/availability.
3. Install and run ComfyUI plus a compatible image-edit/virtual-try-on workflow.
4. Use only for an interactive, temporary experiment. Do not expose an unauthenticated ComfyUI server to the public internet.
5. Save generated outputs to notebook output/storage and download them; runtime/session can stop.

A secure tunnel can make a temporary endpoint reachable, but a public tunnel is an additional security risk and not a stable free service. Do not connect it to the production app unless it is protected by authentication, short-lived, host allow-listing and an explicit user consent step.

## Why this is not wired as a default production provider

- ZeroGPU has a small daily quota and queue; it is designed for interactive demos.
- Public Spaces can change, go offline, alter API endpoints or model behavior.
- Gradio API contracts differ by Space. An integration must be pinned to a specific Space/API and re-tested.
- Garment fidelity and anime identity are not guaranteed by a virtual try-on model.
- Third-party processing means source images leave the user's device/server.

## RPD production recommendation

Keep the ComfyUI adapter as the primary **self-hosted** provider and treat ZeroGPU/Kaggle as manual experiments until one exact workflow passes the RPD fidelity gate on a representative product:
- exact colour, cut, print/motif placement, neckline and garment pieces
- anime character remains anime
- clothing remains visually realistic
- no invented features
- full garment visible and good anatomy
- human review required; never auto-mark generated images as QC PASS

## User test links

- CatVTON ZeroGPU demo: https://huggingface.co/spaces/Nandha2017/virtual-tryon
- Hugging Face ZeroGPU documentation: https://huggingface.co/docs/hub/en/spaces-zerogpu
- Kaggle Notebooks: https://www.kaggle.com/docs/notebooks
