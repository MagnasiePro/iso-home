import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const BUDGET = 300 * 1024; // research.md §6, packs excluded
const size = gzipSync(readFileSync("dist/iso-home-card.js")).length;
console.log(`iso-home-card.js: ${(size / 1024).toFixed(1)} KB gzipped (budget 300 KB)`);
if (size > BUDGET) process.exit(1);
