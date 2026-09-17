// Copies pdfjs-dist's worker into public/ so it's served as a plain static
// file at a fixed URL. pdf.js requires the worker version to exactly match
// the API version, so this must stay in sync with the installed package —
// hence running it as a postinstall script rather than committing the file
// as a one-off copy.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const destDir = join(root, "public");
const dest = join(destDir, "pdf.worker.min.mjs");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log("Copied pdf.worker.min.mjs to public/");
