import type { Plugin } from 'vuepress';
import { getDirname, path } from 'vuepress/utils';

import { writeCatalogFile } from './buildCatalog.js';
import type { UnityCatalog } from './types.js';

const __dirname = getDirname(import.meta.url);

let catalogSnapshot: UnityCatalog | null = null;

function ensureCatalog(app: { dir: { source: () => string } }): UnityCatalog {
  if (catalogSnapshot) return catalogSnapshot;
  const docsDir = app.dir.source();
  const vuepressDir = path.join(docsDir, '.vuepress');
  catalogSnapshot = writeCatalogFile(docsDir, vuepressDir);
  return catalogSnapshot;
}

export const unityEditorCatalogPlugin = (): Plugin => ({
  name: 'unity-editor-catalog',

  clientConfigFile: path.resolve(__dirname, './client.ts'),

  onInitialized(app) {
    ensureCatalog(app);
  },

  onPrepared(app) {
    ensureCatalog(app);
  },

  extendsPage() {
    return {
      unityCatalog: catalogSnapshot,
    };
  },

  define: (app) => ({
    __UNITY_CATALOG__: JSON.stringify(ensureCatalog(app)),
  }),
});

export default unityEditorCatalogPlugin;

export type {
  AssetType,
  CatalogHeading,
  CatalogMeta,
  CatalogNode,
  UnityCatalog,
} from './types.js';
