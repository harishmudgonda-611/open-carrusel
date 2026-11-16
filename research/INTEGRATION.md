# Source-backed research for carousel content

Open Carrusel is a local-first carousel editor with an existing Claude CLI/WebFetch research path. Avoid adding a second always-on crawler or duplicating the model-agent workflow.

## Appropriate additions
- Keep the current human-directed WebFetch path as the default research mechanism.
- **MarkItDown** can be an optional local preprocessing tool for user-provided PDFs, Office documents and research notes.
- **Crawl4AI / Scrapy** are optional external preprocessing adapters only for public sources that permit automated collection; they are not dependencies of the editor.
- **AutoScraper / Scrapling** are useful for fixture-based extraction experiments only, not access-control evasion.

## Evidence attached to a carousel brief
Store source URL, title, publisher, publication date when available, retrieval timestamp and excerpt/hash. Keep source notes separate from generated slide copy. Do not present model-generated statements as verified facts. Flag missing or conflicting evidence and retain citations in captions or a final source slide when the brief requires factual content.

## Safety and local-first behavior
No background crawling, no credential collection, no login/paywall/CAPTCHA bypass, no hidden remote upload of user files. Respect terms, robots directives, rate limits and copyright. Any optional document conversion runs locally and requires explicit user selection.

## Delivery status
Documentation-only; existing Claude CLI and editor flow are unchanged. A future optional document-ingestion feature needs fixture tests, local-file permission checks and a clear user action.