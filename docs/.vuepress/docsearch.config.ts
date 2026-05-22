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

/**
 * DocSearch 凭证从环境变量读取，勿在此文件写入密钥。
 * - CI：GitHub Actions Secrets → deploy.yml 的 env
 * - 本地：复制 docs/.env.example 为 docs/.env 并填写
 */
export const docsearchAppId = process.env.DOCSEARCH_APP_ID ?? "";

export const docsearchApiKey = process.env.DOCSEARCH_API_KEY ?? "";

export const docsearchIndexName = process.env.DOCSEARCH_INDEX_NAME ?? "";
