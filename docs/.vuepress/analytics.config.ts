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
 * 统计 ID 从环境变量读取，勿在此文件写入真实 ID。
 * - CI：GitHub Secrets → deploy.yml 的 env
 * - 本地：docs/.env（见 docs/.env.example）
 */
export const googleAnalyticsId = process.env.GOOGLE_ANALYTICS_ID ?? "";

export const baiduAnalyticsId = process.env.BAIDU_ANALYTICS_ID ?? "";
