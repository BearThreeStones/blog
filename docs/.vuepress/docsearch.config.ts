import { readPublicEnv } from "./env-public.js";

/**
 * DocSearch 凭证从环境变量读取，勿在此文件写入密钥。
 * - CI：GitHub Actions Secrets → deploy.yml 的 env
 * - 本地：复制 docs/.env.example 为 docs/.env 并填写（由 config.ts 通过 load-docs-env 加载）
 */
export const docsearchAppId = readPublicEnv("DOCSEARCH_APP_ID");

export const docsearchApiKey = readPublicEnv("DOCSEARCH_API_KEY");

export const docsearchIndexName = readPublicEnv("DOCSEARCH_INDEX_NAME");
