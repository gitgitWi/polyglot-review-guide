# Polyglot Review Guide

TypeScript developers often need to review backend code written in Kotlin, Go, and eventually languages like Rust or Zig. This project is a public, review-first field guide for that situation.

The initial guide covers Kotlin and Go from a TypeScript/Node.js perspective, with emphasis on runtime models, type systems, validation, error handling, ecosystem conventions, and AI-generated code review.

Alan is used as an example product brand, but the content is intentionally written for public reference rather than internal codebase documentation.

## Stack

- Vite
- React
- TanStack Router
- Zustand
- Shiki
- TypeScript
- Markdown source files
- Cloudflare Pages-compatible static build

## Local Development

```sh
bun install
bun run dev
```

The dev server starts on a Vite URL, usually `http://127.0.0.1:5173`.

## Build

```sh
bun run build
```

The build script:

1. Reads Markdown files from `docs/`.
2. Generates typed document data at `src/generated/guide-data.ts`.
3. Builds the Vite app to `dist/`.
4. Validates public-facing content and Cloudflare Pages assets.

## Cloudflare Pages

For a Git-connected Cloudflare Pages project, use:

- Build command: `bun run build`
- Build output directory: `dist`

The `public/_redirects` file is copied into `dist/_redirects` so direct links to TanStack Router routes work as SPA routes.

For release-based direct upload deployments, `.github/workflows/release-production.yml` uses Cloudflare Wrangler Action with:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

The workflow passes `pages deploy dist --project-name=polyglot-review-guide` directly, so a `wrangler.toml` file is not required. Add one only if you want Wrangler defaults such as `pages_build_output_dir` to be shared between local CLI usage and CI.

## Content Structure

- `docs/00-overview.md`: learning map
- `docs/01-syntax-map.md`: TypeScript to Kotlin/Go syntax comparison
- `docs/02-types-and-modeling.md`: type systems and domain modeling
- `docs/03-functions-control-flow.md`: functions and control flow
- `docs/04-async-concurrency.md`: async, threads, goroutines, context
- `docs/05-validation-errors.md`: validation and error handling
- `docs/06-kotlin-idioms.md`: Kotlin syntax with no JS/TS analog (sealed class, object, extension functions, `by` delegation, …)
- `docs/07-kotlin-ecosystem.md`: Kotlin server ecosystem
- `docs/08-kotlin-spring-review.md`: Kotlin/Spring review guide
- `docs/09-go-idioms.md`: Go syntax with no JS/TS analog (pointers, struct embedding, channels, `iota`, type switches, …)
- `docs/10-go-ecosystem.md`: Go server ecosystem
- `docs/11-go-service-review.md`: Go HTTP service review guide
- `docs/12-ai-code-review-checklist.md`: AI code review checklist

## Tags

Each document declares topic `tags` in its front matter. Tags power full-text search (typing a tag name in the sidebar search matches) and a dedicated tag browser at `/tags` (index) and `/tags/:tag` (per-tag document list). Clickable tag chips appear at the top of every document.

## Adding More Languages

Add a Markdown file under `docs/` with front matter. `tags` is an optional array; every other field is required:

```md
---
title: "Rust Review Guide"
category: "review"
language: "rust"
order: 20
summary: "Rust concepts TypeScript developers should know when reviewing code."
tags: [ownership, error-handling, code-review]
---
```

`order` must be a unique integer; the filename numeric prefix should match it. Then run:

```sh
bun run build
```
