import { readPublicEnv } from "./env-public.js";

/**
 * 统计 ID 从环境变量读取，勿在此文件写入真实 ID。
 * - CI：GitHub Secrets → deploy.yml 的 env
 * - 本地：docs/.env（见 docs/.env.example）
 */
export const googleAnalyticsId = readPublicEnv("GOOGLE_ANALYTICS_ID");

export const baiduAnalyticsId = readPublicEnv("BAIDU_ANALYTICS_ID");
