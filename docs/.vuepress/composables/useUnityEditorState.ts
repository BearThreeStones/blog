import {
  computed,
  inject,
  provide,
  ref,
  watch,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from 'vue';

import type {
  CatalogHeading,
  CatalogNode,
  UnityCatalog,
} from '../plugins/unity-editor-catalog/types.js';

export type ViewMode = 'list' | 'grid';

export interface PanelSizes {
  hierarchyWidth: number;
  inspectorWidth: number;
  projectHeight: number;
  projectTreeWidth: number;
}

const STORAGE_KEY = 'unity-editor-panel-sizes';

const DEFAULT_SIZES: PanelSizes = {
  hierarchyWidth: 240,
  inspectorWidth: 280,
  projectHeight: 220,
  projectTreeWidth: 200,
};

export interface UnityEditorState {
  catalog: UnityCatalog;
  currentFolderId: Ref<string>;
  selectedAssetId: Ref<string | null>;
  searchQuery: Ref<string>;
  viewMode: Ref<ViewMode>;
  thumbnailLevel: Ref<number>;
  expandedIds: Ref<Set<string>>;
  panelSizes: Ref<PanelSizes>;
  currentFolder: ComputedRef<CatalogNode | null>;
  folderAssets: ComputedRef<CatalogNode[]>;
  selectedAsset: ComputedRef<CatalogNode | null>;
  defaultArticle: ComputedRef<CatalogNode | null>;
  outlineArticle: ComputedRef<CatalogNode | null>;
  selectedHeadingSlug: Ref<string | null>;
  breadcrumbSegments: ComputedRef<{ id: string; label: string }[]>;
  setCurrentFolder: (id: string) => void;
  scrollArticleToHeading: (slug: string) => void;
  syncFolderForAsset: (node: CatalogNode) => void;
  selectAsset: (node: CatalogNode | null) => void;
  toggleExpanded: (id: string) => void;
  isExpanded: (id: string) => boolean;
}

const UnityEditorStateKey: InjectionKey<UnityEditorState> = Symbol('unityEditorState');

function loadPanelSizes(): PanelSizes {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_SIZES };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SIZES };
    return { ...DEFAULT_SIZES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SIZES };
  }
}

function findNodeById(root: CatalogNode, id: string): CatalogNode | null {
  if (root.id === id) return root;
  if (!root.children) return null;
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

function findParentId(root: CatalogNode, targetId: string): string | null {
  for (const child of root.children ?? []) {
    if (child.id === targetId) return root.id;
    const found = findParentId(child, targetId);
    if (found) return found;
  }
  return null;
}

function findPathToNode(root: CatalogNode, id: string): CatalogNode[] {
  if (root.id === id) return [root];
  if (!root.children) return [];
  for (const child of root.children) {
    const sub = findPathToNode(child, id);
    if (sub.length) return [root, ...sub];
  }
  return [];
}

function collectArticles(node: CatalogNode): CatalogNode[] {
  const result: CatalogNode[] = [];
  const walk = (n: CatalogNode): void => {
    if (n.type === 'article') result.push(n);
    n.children?.forEach(walk);
  };
  node.children?.forEach(walk);
  return result;
}

function fuzzyMatch(query: string, node: CatalogNode): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const hay = [
    node.label,
    node.meta.title,
    ...node.meta.categories,
    ...node.meta.tags,
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

const NATURAL_SORT: Intl.CollatorOptions = { numeric: true, sensitivity: 'base' };

function compareNodeLabels(a: CatalogNode, b: CatalogNode): number {
  return a.label.localeCompare(b.label, 'zh-CN', NATURAL_SORT);
}

function collectMatchingInFolder(folder: CatalogNode, query: string): CatalogNode[] {
  const items: CatalogNode[] = [];
  const walk = (node: CatalogNode): void => {
    for (const child of node.children ?? []) {
      if (fuzzyMatch(query, child)) items.push(child);
      if (child.type === 'folder') walk(child);
    }
  };
  walk(folder);
  return items.sort(compareNodeLabels);
}

export function createUnityEditorState(catalog: UnityCatalog): UnityEditorState {
  const currentFolderId = ref(catalog.root.id);
  const selectedAssetId = ref<string | null>(null);
  const searchQuery = ref('');
  const viewMode = ref<ViewMode>('grid');
  const thumbnailLevel = ref(80);
  const expandedIds = ref(new Set<string>([catalog.root.id]));
  const panelSizes = ref<PanelSizes>(loadPanelSizes());

  const currentFolder = computed(() =>
    findNodeById(catalog.root, currentFolderId.value),
  );

  const folderAssets = computed(() => {
    const folder = currentFolder.value;
    if (!folder) return [];
    const q = searchQuery.value.trim();
    if (q) return collectMatchingInFolder(folder, q);
    return [...(folder.children ?? [])].sort(compareNodeLabels);
  });

  const selectedAsset = computed(() => {
    if (!selectedAssetId.value) return null;
    return findNodeById(catalog.root, selectedAssetId.value);
  });

  const defaultArticle = computed(() => {
    if (!catalog.defaultArticleId) return null;
    return findNodeById(catalog.root, catalog.defaultArticleId);
  });

  const outlineArticle = computed(() => {
    if (selectedAsset.value?.type === 'article') return selectedAsset.value;
    return defaultArticle.value;
  });

  const selectedHeadingSlug = ref<string | null>(null);

  const collectHeadingExpandIds = (
    headings: CatalogHeading[],
    parentPath = '',
  ): string[] => {
    const ids: string[] = [];
    for (const h of headings) {
      const id = parentPath ? `${parentPath}/${h.slug}` : `outline-${h.slug}`;
      ids.push(id);
      if (h.children.length) {
        ids.push(...collectHeadingExpandIds(h.children, id));
      }
    }
    return ids;
  };

  watch(
    outlineArticle,
    (article) => {
      selectedHeadingSlug.value = null;
      if (!article?.meta.headings?.length) return;
      const next = new Set(expandedIds.value);
      collectHeadingExpandIds(article.meta.headings).forEach((id) => next.add(id));
      expandedIds.value = next;
    },
    { immediate: true },
  );

  const breadcrumbSegments = computed(() => {
    const path = findPathToNode(catalog.root, currentFolderId.value);
    return path.map((n) => ({ id: n.id, label: n.label }));
  });

  const setCurrentFolder = (id: string): void => {
    currentFolderId.value = id;
    selectedAssetId.value = null;
    const next = new Set(expandedIds.value);
    findPathToNode(catalog.root, id).forEach((n) => next.add(n.id));
    expandedIds.value = next;
  };

  const selectAsset = (node: CatalogNode | null): void => {
    selectedAssetId.value = node?.id ?? null;
  };

  const syncFolderForAsset = (node: CatalogNode): void => {
    const parentId = findParentId(catalog.root, node.id);
    if (!parentId) return;
    currentFolderId.value = parentId;
    const next = new Set(expandedIds.value);
    findPathToNode(catalog.root, parentId).forEach((n) => next.add(n.id));
    expandedIds.value = next;
  };

  const toggleExpanded = (id: string): void => {
    const next = new Set(expandedIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expandedIds.value = next;
  };

  const isExpanded = (id: string): boolean => expandedIds.value.has(id);

  const scrollArticleToHeading = (slug: string): void => {
    selectedHeadingSlug.value = slug;
  };

  return {
    catalog,
    currentFolderId,
    selectedAssetId,
    searchQuery,
    viewMode,
    thumbnailLevel,
    expandedIds,
    panelSizes,
    currentFolder,
    folderAssets,
    selectedAsset,
    defaultArticle,
    outlineArticle,
    selectedHeadingSlug,
    breadcrumbSegments,
    setCurrentFolder,
    scrollArticleToHeading,
    syncFolderForAsset,
    selectAsset,
    toggleExpanded,
    isExpanded,
  };
}

export function provideUnityEditorState(catalog: UnityCatalog): UnityEditorState {
  const state = createUnityEditorState(catalog);
  provide(UnityEditorStateKey, state);
  return state;
}

export function useUnityEditorState(): UnityEditorState {
  const state = inject(UnityEditorStateKey);
  if (!state) {
    throw new Error('useUnityEditorState must be used within UnityEditorLayout');
  }
  return state;
}

export function persistPanelSizes(sizes: PanelSizes): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
  } catch {
    /* ignore */
  }
}

export { collectArticles, compareNodeLabels, findNodeById, findParentId };
