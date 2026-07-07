import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "README.md",
  "src/router.tsx",
  "src/routes/__root.tsx",
  "src/generated/guide-data.ts",
  "wrangler.jsonc",
  // TanStack Start build output (@cloudflare/vite-plugin): prerendered client + Worker.
  "dist/client/index.html",
  "dist/server/index.js",
];

for (const file of requiredFiles) {
  await access(path.join(root, file));
}

// The Worker is the TanStack Start server entry; routing (incl. SSR fallback) is
// owned by Start, so no _redirects / not_found_handling is used. Guard the config.
const wranglerConfig = await readFile(path.join(root, "wrangler.jsonc"), "utf8");
if (!wranglerConfig.includes("@tanstack/react-start/server-entry")) {
  throw new Error('wrangler.jsonc: main must be "@tanstack/react-start/server-entry"');
}
if (!wranglerConfig.includes("nodejs_compat")) {
  throw new Error("wrangler.jsonc: compatibility_flags must include nodejs_compat");
}

// Prerender (SSG) sanity: a representative document page must contain rendered
// markdown, not just an empty shell.
const sampleDoc = path.join(root, "dist", "client", "guide", "kotlin-idioms", "index.html");
const sampleHtml = await readFile(sampleDoc, "utf8");
if (!sampleHtml.includes("markdown-body") || !sampleHtml.includes('class="shiki')) {
  throw new Error("prerendered doc page is missing rendered content / highlighted code");
}

const docs = (await readdir(path.join(root, "docs"))).filter((file) => file.endsWith(".md"));
if (docs.length < 9) {
  throw new Error(`expected at least 9 docs, got ${docs.length}`);
}

const seenOrders = new Set();
for (const file of docs) {
  const raw = await readFile(path.join(root, "docs", file), "utf8");
  if (raw.includes("TODO")) {
    throw new Error(`${file}: contains TODO`);
  }
  if (raw.includes("/Users/") || raw.includes("~/")) {
    throw new Error(`${file}: contains local filesystem path`);
  }
  // order may be a decimal (e.g. 2.5) to slot a doc between two integers.
  const orderRaw = raw.match(/^order:\s*([\d.]+)/m)?.[1];
  if (!orderRaw || !Number.isFinite(Number(orderRaw))) {
    throw new Error(`${file}: missing numeric order`);
  }
  const order = Number(orderRaw);
  if (seenOrders.has(order)) {
    throw new Error(`${file}: duplicated order ${order}`);
  }
  seenOrders.add(order);
}

console.log(`Validated ${docs.length} Markdown files, prerendered output, and Cloudflare deploy config`);
