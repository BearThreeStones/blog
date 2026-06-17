import { defineClientConfig } from 'vuepress/client';

import type { UnityCatalog } from './types.js';

function parseCatalog(): UnityCatalog | null {
  if (typeof __UNITY_CATALOG__ === 'undefined') return null;
  try {
    const raw = __UNITY_CATALOG__;
    return typeof raw === 'string' ? (JSON.parse(raw) as UnityCatalog) : (raw as UnityCatalog);
  } catch {
    return null;
  }
}

export default defineClientConfig({
  enhance({ app }) {
    const catalog = parseCatalog();
    if (catalog?.root) {
      app.provide('unityCatalog', catalog);
    }
  },
});
