#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const excludedDirectories = new Set(["node_modules", "dist", "viejo", "coverage"]);
const includedTopLevelFiles = new Set(["Dockerfile", "package.json", "package-lock.json", "vite.config.ts"]);

const collect = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (excludedDirectories.has(entry.name)) return [];
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) return collect(absolute);
    const path = relative(root, absolute);
    if (path.startsWith("src/") || path.startsWith("scripts/") || includedTopLevelFiles.has(path)) return [path];
    return [];
  });

const files = Object.fromEntries(
  collect(root)
    .sort()
    .map((path) => [
      path,
      createHash("sha256").update(readFileSync(join(root, path))).digest("hex"),
    ]),
);

writeFileSync(
  join(root, "FRONTEND_PRODUCTION_BASELINE_MANIFEST.json"),
  `${JSON.stringify({ version: 1, files }, null, 2)}\n`,
  { mode: 0o600 },
);
console.log(`FRONTEND_PRODUCTION_BASELINE_MANIFEST=CREATED FILES=${Object.keys(files).length}`);
