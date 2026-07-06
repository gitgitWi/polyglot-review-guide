import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "README.md",
  "index.html",
  "src/main.tsx",
  "src/router.tsx",
  "src/generated/guide-data.ts",
  "dist/index.html",
  "dist/_redirects",
];

for (const file of requiredFiles) {
  await access(path.join(root, file));
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
  const order = raw.match(/^order:\s*(\d+)/m)?.[1];
  if (!order) {
    throw new Error(`${file}: missing numeric order`);
  }
  if (seenOrders.has(order)) {
    throw new Error(`${file}: duplicated order ${order}`);
  }
  seenOrders.add(order);
}

console.log(`Validated ${docs.length} Markdown files and Cloudflare Pages assets`);
