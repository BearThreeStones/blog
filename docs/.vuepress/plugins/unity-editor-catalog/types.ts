export type AssetType = 'cs' | 'scene' | 'prefab' | 'mat' | 'texture' | 'pdf';

export type FileKind = 'image' | 'pdf';

export interface CatalogHeading {
  slug: string;
  title: string;
  level: number;
  children: CatalogHeading[];
}

export interface CatalogMeta {
  title: string;
  date?: string;
  categories: string[];
  tags: string[];
  icon?: string;
  pageview?: boolean;
  excerpt?: string;
  /** WebGL demo ids from ![game](path), maps to /games/{id}/ */
  unityGames?: string[];
  /** Static asset URL for type=file nodes */
  resourceUrl?: string;
  fileKind?: FileKind;
  /** Markdown heading outline (h2–h6) for Hierarchy TOC */
  headings?: CatalogHeading[];
}

export interface CatalogNode {
  id: string;
  type: 'folder' | 'article' | 'file';
  label: string;
  /** VuePress route for articles; resource URL for files */
  path: string;
  assetType: AssetType;
  children?: CatalogNode[];
  meta: CatalogMeta;
}

export interface UnityCatalog {
  root: CatalogNode;
  /** First article in natural sort order; used for Hierarchy default TOC */
  defaultArticleId?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __UNITY_CATALOG__: UnityCatalog | undefined;
}

export {};
