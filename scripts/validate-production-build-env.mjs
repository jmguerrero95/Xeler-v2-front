#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Production-only Vite contract. Values are intentionally never emitted: the
 * browser bundle may contain public values, but build logs must not.
 */
const required = [
  "VITE_API_URL",
  "VITE_PUSHER_APP_KEY",
  "VITE_PUSHER_CLUSTER",
  "VITE_TURNSTILE_SITE_KEY",
];

const optionalWithExplicitDefault = [
  "VITE_API_GOOGLE",
  "VITE_BROADCAST_AUTH_URL",
  "VITE_PUSHER_HOST",
  "VITE_PUSHER_PORT",
  "VITE_PUSHER_SCHEME",
  "VITE_ENV_NETWORK",
  "VITE_IDENTITY_PHONE_VERIFICATION_REQUIRED",
  "VITE_ORDER_TRACKING_POLL_INTERVAL_MS",
];

const invalidMarkers = /localhost|127\.0\.0\.1|demo|placeholder|change[_-]?me/i;
const failures = [];
const value = (name) => String(process.env[name] ?? "").trim();
const excludedDirectories = new Set(["node_modules", "dist", "viejo", "coverage"]);
const includedTopLevelFiles = new Set(["Dockerfile", "package.json", "package-lock.json", "vite.config.ts"]);
const trackedPaths = (directory = process.cwd()) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (excludedDirectories.has(entry.name)) return [];
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) return trackedPaths(absolute);
    const path = relative(process.cwd(), absolute);
    return path.startsWith("src/") || path.startsWith("scripts/") || includedTopLevelFiles.has(path)
      ? [path]
      : [];
  });

for (const name of required) {
  if (!value(name)) failures.push(`${name}:MISSING`);
}

const apiUrl = value("VITE_API_URL");
try {
  const parsed = new URL(apiUrl);
  if (parsed.protocol !== "https:" || parsed.origin !== "https://v2.xeler.io" || parsed.pathname.replace(/\/+$/, "") !== "/api") {
    failures.push("VITE_API_URL:INVALID_PRODUCTION_DESTINATION");
  }
} catch {
  failures.push("VITE_API_URL:INVALID_URL");
}

for (const name of ["VITE_PUSHER_APP_KEY", "VITE_TURNSTILE_SITE_KEY"]) {
  if (invalidMarkers.test(value(name))) failures.push(`${name}:INVALID_MARKER`);
}

const pusherHost = value("VITE_PUSHER_HOST");
if (pusherHost) {
  if (invalidMarkers.test(pusherHost)) failures.push("VITE_PUSHER_HOST:INVALID_MARKER");
  const port = Number(value("VITE_PUSHER_PORT"));
  if (!Number.isInteger(port) || port < 1 || port > 65535) failures.push("VITE_PUSHER_PORT:INVALID");
  if (value("VITE_PUSHER_SCHEME") !== "https") failures.push("VITE_PUSHER_SCHEME:HTTPS_REQUIRED");
}

const broadcastUrl = value("VITE_BROADCAST_AUTH_URL");
if (broadcastUrl) {
  try {
    const parsed = new URL(broadcastUrl, apiUrl);
    if (parsed.origin !== "https://v2.xeler.io" || !parsed.pathname.startsWith("/api/")) {
      failures.push("VITE_BROADCAST_AUTH_URL:OFFICIAL_API_REQUIRED");
    }
  } catch {
    failures.push("VITE_BROADCAST_AUTH_URL:INVALID_URL");
  }
}

const baselinePath = join(process.cwd(), "FRONTEND_PRODUCTION_BASELINE_MANIFEST.json");
if (!existsSync(baselinePath)) {
  failures.push("FRONTEND_PRODUCTION_BASELINE_MANIFEST:MISSING");
} else {
  try {
    const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
    const allowed = new Set(
      value("ALLOWED_SOURCE_DIFF")
        .split(",")
        .map((path) => path.trim())
        .filter(Boolean),
    );
    const knownFiles = baseline.files ?? {};
    const changed = [...new Set([...Object.keys(knownFiles), ...trackedPaths()])]
      .filter((path) => {
        const absolute = join(process.cwd(), path);
        if (!existsSync(absolute)) return true;
        return !knownFiles[path] || createHash("sha256").update(readFileSync(absolute)).digest("hex") !== knownFiles[path];
      })
    const unexpected = changed.filter((path) => !allowed.has(path));
    if (unexpected.length) failures.push(`SOURCE_DIFF_GATE:UNAPPROVED_${unexpected.length}`);
  } catch {
    failures.push("FRONTEND_PRODUCTION_BASELINE_MANIFEST:INVALID");
  }
}

if (failures.length) {
  console.error(`PRODUCTION_BUILD_ENV_PREFLIGHT=FAIL ${failures.join(",")}`);
  process.exit(1);
}

console.log(
  `PRODUCTION_BUILD_ENV_PREFLIGHT=PASS REQUIRED=${required.length} OPTIONAL=${optionalWithExplicitDefault.length}`,
);
