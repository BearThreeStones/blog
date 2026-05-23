/**
 * Load docs/.env into process.env during Node builds only.
 * Do not import this file from theme.ts or other client bundles.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const __dir = dirname(fileURLToPath(import.meta.url));
const envMode =
  process.env.NODE_ENV === "production" ? "production" : "development";

for (const [key, value] of Object.entries(
  loadEnv(envMode, resolve(__dir, ".."), ""),
)) {
  if (process.env[key] === undefined) process.env[key] = value;
}
