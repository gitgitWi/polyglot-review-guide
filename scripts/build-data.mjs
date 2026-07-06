import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = path.join(root, "docs");
const outDir = path.join(root, "src", "generated");
const outFile = path.join(outDir, "guide-data.ts");

function parseFrontMatter(raw, file) {
  if (!raw.startsWith("---\n")) {
    throw new Error(`${file}: missing front matter`);
  }
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) {
    throw new Error(`${file}: unterminated front matter`);
  }

  const front = raw.slice(4, end).trim();
  const body = raw.slice(end + "\n---\n".length).trim();
  const meta = {};

  for (const line of front.split("\n")) {
    const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!match) {
      throw new Error(`${file}: invalid front matter line: ${line}`);
    }
    const [, key, value] = match;
    meta[key] = value.replace(/^"(.*)"$/, "$1");
  }

  const required = ["title", "category", "language", "order", "summary"];
  for (const key of required) {
    if (!meta[key]) {
      throw new Error(`${file}: missing ${key}`);
    }
  }
  meta.order = Number(meta.order);
  if (!Number.isFinite(meta.order)) {
    throw new Error(`${file}: order must be numeric`);
  }

  return { meta, body };
}

const files = (await readdir(docsDir))
  .filter((file) => file.endsWith(".md"))
  .sort();

const docs = [];
for (const file of files) {
  const raw = await readFile(path.join(docsDir, file), "utf8");
  const { meta, body } = parseFrontMatter(raw, file);
  docs.push({
    id: file.replace(/^\d+-/, "").replace(/\.md$/, ""),
    file,
    ...meta,
    body,
    wordCount: body.split(/\s+/).filter(Boolean).length,
  });
}

docs.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

await mkdir(outDir, { recursive: true });
await writeFile(
  outFile,
  `export const guideDocs = ${JSON.stringify(docs, null, 2)} as const;\n\nexport type GuideDoc = (typeof guideDocs)[number];\n`,
  "utf8",
);

console.log(`Generated ${path.relative(root, outFile)} from ${docs.length} documents`);
