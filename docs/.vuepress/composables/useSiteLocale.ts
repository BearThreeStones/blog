import { computed, type ComputedRef } from 'vue';
import { useRouteLocale } from 'vuepress/client';

import glossary from '../i18n/unity-glossary.json' with { type: 'json' };
import enUS from '../i18n/messages/en-US.js';
import zhCN from '../i18n/messages/zh-CN.js';

export type SiteLocaleId = 'zh' | 'en';

const messages = {
  zh: zhCN,
  en: enUS,
} as const;

const warnedTerms = new Set<string>();

export function localePathPrefix(routeLocale: string): string {
  if (!routeLocale || routeLocale === '/') return '';
  return routeLocale.endsWith('/') ? routeLocale.slice(0, -1) : routeLocale;
}

export function localizeRoutePath(path: string, routeLocale: string): string {
  const prefix = localePathPrefix(routeLocale);
  if (!prefix) return path;
  if (path.startsWith(`${prefix}/`) || path === prefix || path === `${prefix}/`) {
    return path;
  }
  if (path === '/' || path === '/index.html') {
    return `${prefix}/`;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${prefix}${normalized}`;
}

export function useSiteLocale(): {
  locale: ComputedRef<SiteLocaleId>;
  routeLocale: ComputedRef<string>;
  t: (key: keyof typeof zhCN, params?: Record<string, string | number>) => string;
  tUnity: (term: string) => string;
  localizePath: (path: string) => string;
} {
  const routeLocale = useRouteLocale();

  const locale = computed<SiteLocaleId>(() =>
    routeLocale.value === '/en/' || routeLocale.value === '/en' ? 'en' : 'zh',
  );

  const t = (key: keyof typeof zhCN, params?: Record<string, string | number>): string => {
    const table = messages[locale.value];
    let text = String(table[key] ?? messages.zh[key] ?? key);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  };

  const tUnity = (term: string): string => {
    if (locale.value === 'en') return term;
    const zh =
      (glossary as Record<string, string>)[term] ??
      (glossary as Record<string, string>)[term.trim()];
    if (zh) return zh;
    if (!warnedTerms.has(term)) {
      warnedTerms.add(term);
      if (typeof console !== 'undefined') {
        console.warn(`[useSiteLocale] Missing Unity glossary entry for: ${term}`);
      }
    }
    return term;
  };

  const localizePath = (path: string): string =>
    localizeRoutePath(path, routeLocale.value);

  const folderLabel = (folderKey: string, fallback?: string): string => {
    const en =
      messages.en.folderLabels[folderKey as keyof typeof messages.en.folderLabels] ??
      fallback ??
      folderKey;
    return locale.value === 'en' ? en : tUnity(en);
  };

  return { locale, routeLocale, t, tUnity, localizePath, folderLabel };
}
