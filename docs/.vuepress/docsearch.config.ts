import { readPublicEnv } from "./env-public.js";

/**
 * DocSearch 凭证从环境变量读取，勿在此文件写入密钥。
 * - CI：GitHub Actions Secrets → deploy.yml 的 env
 * - 本地：复制 docs/.env.example 为 docs/.env 并填写（由 config.ts 通过 load-docs-env 加载）
 * - 客户端：config.ts 通过 Vite define 注入 __DOCSEARCH_*（浏览器中 process.env 不可用）
 */
declare const __DOCSEARCH_APP_ID__: string | undefined;
declare const __DOCSEARCH_API_KEY__: string | undefined;
declare const __DOCSEARCH_INDEX_NAME__: string | undefined;

function envValue(key: string, inlined?: string): string {
  if (inlined) return inlined;
  return readPublicEnv(key);
}

export const docsearchAppId = envValue(
  "DOCSEARCH_APP_ID",
  typeof __DOCSEARCH_APP_ID__ !== "undefined" ? __DOCSEARCH_APP_ID__ : undefined,
);

export const docsearchApiKey = envValue(
  "DOCSEARCH_API_KEY",
  typeof __DOCSEARCH_API_KEY__ !== "undefined" ? __DOCSEARCH_API_KEY__ : undefined,
);

export const docsearchIndexName = envValue(
  "DOCSEARCH_INDEX_NAME",
  typeof __DOCSEARCH_INDEX_NAME__ !== "undefined"
    ? __DOCSEARCH_INDEX_NAME__
    : undefined,
);

export const hasDocSearch =
  Boolean(docsearchAppId) &&
  Boolean(docsearchApiKey) &&
  Boolean(docsearchIndexName) &&
  !docsearchAppId.startsWith("YOUR_");