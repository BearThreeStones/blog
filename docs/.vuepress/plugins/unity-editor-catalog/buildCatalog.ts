import fs from 'node:fs';
import path from 'node:path';

import type {
  AssetType,
  CatalogHeading,
  CatalogMeta,
  CatalogNode,
  UnityCatalog,
} from './types.js';

const FOLDER_LABELS: Record<string, string> = {
  algorithm: 'Algorithms',
  'game-dev': 'GameDev',
  'game-design-patterns': 'GameDesignPatterns',
  'unity-best-practice': 'UnityBestPractices',
};

const SHADER_KEYWORDS = ['shader', '渲染', '图形学', 'graphics', '贴图', '材质'];

const NATURAL_SORT: Intl.CollatorOptions = { numeric: true, sensitivity: 'base' };

function compareNaturalNames(a: string, b: string): number {
  return a.localeCompare(b, 'zh-CN', NATURAL_SORT);
}

function parseFrontmatter(raw: string): Record<string, unknown> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const fm: Record<string, unknown> = {};
  const lines = match[1].split(/\r?\n/);
  let listKey = '';

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const listItem = trimmed.match(/^-\s+(.+)$/);
    if (listItem && listKey) {
      const arr = (fm[listKey] as string[]) ?? [];
      arr.push(listItem[1].trim());
      fm[listKey] = arr;
      continue;
    }

    const kv = trimmed.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;

    const key = kv[1];
    const value = kv[2].trim();

    if (value === '') {
      listKey = key;
      fm[key] = [];
    } else {
      listKey = '';
      fm[key] =
        value === 'true' ? true : value === 'false' ? false : value.replace(/^['"]|['"]$/g, '');
    }
  }

  return fm;
}

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  return [String(value)];
}

const UNITY_GAME_RE = /!\[(?:game|unity:game)\]\(([^)]+)\)/g;

function extractUnityGames(body: string): string[] {
  const seen = new Set<string>();
  const games: string[] = [];
  for (const match of body.matchAll(UNITY_GAME_RE)) {
    const raw = match[1].trim();
    const gamePath = raw.split('?')[0].trim();
    if (!gamePath || seen.has(gamePath)) continue;
    seen.add(gamePath);
    games.push(gamePath);
  }
  return games;
}

function stripMarkdownInline(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim();
}

/** Align with markdown-it-anchor / VuePress default slug rules */
function slugifyHeading(title: string): string {
  return stripMarkdownInline(title)
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildHeadingTree(
  flat: { level: number; title: string; slug: string }[],
): CatalogHeading[] {
  const root: CatalogHeading[] = [];
  const stack: { level: number; node: CatalogHeading }[] = [];

  for (const item of flat) {
    const node: CatalogHeading = {
      slug: item.slug,
      title: item.title,
      level: item.level,
      children: [],
    };
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }
    stack.push({ level: item.level, node });
  }

  return root;
}

function extractHeadings(content: string): CatalogHeading[] {
  const body = content.replace(/^---[\s\S]*?---\r?\n?/, '');
  const flat: { level: number; title: string; slug: string }[] = [];
  const slugCounts = new Map<string, number>();

  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^(#{2,6})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length;
    const title = stripMarkdownInline(match[2]);
    if (!title) continue;

    let baseSlug = slugifyHeading(title);
    if (!baseSlug) baseSlug = `heading-${flat.length + 1}`;

    const count = slugCounts.get(baseSlug) ?? 0;
    const slug = count > 0 ? `${baseSlug}-${count}` : baseSlug;
    slugCounts.set(baseSlug, count + 1);

    flat.push({ level, title, slug });
  }

  return buildHeadingTree(flat);
}

function extractExcerpt(content: string): string {
  const body = content.replace(/^---[\s\S]*?---\r?\n?/, '');
  const beforeMore = body.split('<!-- more -->')[0] ?? body;
  const paragraph = beforeMore
    .replace(/^#+\s+.+$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  return paragraph?.slice(0, 160) ?? '';
}

function resolveAssetType(
  relPath: string,
  fm: Record<string, unknown>,
  body: string,
): AssetType {
  const explicit = fm.assetType as AssetType | undefined;
  if (
    explicit &&
    ['cs', 'scene', 'prefab', 'mat', 'texture', 'pdf'].includes(explicit)
  ) {
    return explicit;
  }

  const categories = toStringArray(fm.category).join(' ');
  const tags = toStringArray(fm.tag).join(' ');
  const haystack = `${categories} ${tags} ${body}`.toLowerCase();

  if (
    fm.unityDemo === true ||
    /!\[game\]\([^)]+\)/.test(body) ||
    /unity-webgl|createUnityInstance/i.test(body)
  ) {
    return 'scene';
  }

  if (fm.download || fm.repo || /github\.com|gitee\.com/i.test(body)) {
    return 'prefab';
  }

  if (SHADER_KEYWORDS.some((k) => haystack.includes(k.toLowerCase()))) {
    return haystack.includes('贴图') || haystack.includes('texture') ? 'texture' : 'mat';
  }

  if (relPath.startsWith('algorithm/') || categories.includes('算法')) {
    return 'cs';
  }

  return 'cs';
}

function filePathToRoute(postsRel: string): string {
  const withoutExt = postsRel.replace(/\.md$/i, '');
  if (withoutExt.endsWith('/README')) {
    const base = withoutExt.replace(/\/README$/, '');
    return `/${base}/`;
  }
  return `/${withoutExt}.html`;
}

function filePathToId(postsRel: string): string {
  return postsRel.replace(/\.md$/i, '').replace(/\\/g, '/');
}

function assetFileName(assetType: AssetType, title: string): string {
  const base = title.replace(/[^\w\u4e00-\u9fa5.-]+/g, '_').slice(0, 64);
  const ext: Record<AssetType, string> = {
    cs: '.cs',
    scene: '.unity',
    prefab: '.prefab',
    mat: '.mat',
    texture: '.png',
    pdf: '.pdf',
  };
  return `${base}${ext[assetType]}`;
}

function metaFromFm(fm: Record<string, unknown>, body: string, isArticle: boolean): CatalogMeta {
  const unityGames = isArticle ? extractUnityGames(body) : [];
  const meta: CatalogMeta = {
    title: String(fm.title ?? ''),
    date: fm.date ? String(fm.date) : undefined,
    categories: toStringArray(fm.category),
    tags: toStringArray(fm.tag),
    icon: fm.icon ? String(fm.icon) : undefined,
    pageview: fm.pageview === true,
    excerpt: isArticle ? extractExcerpt(body) : extractExcerpt(body) || undefined,
  };
  if (unityGames.length > 0) {
    meta.unityGames = unityGames;
  }
  if (isArticle) {
    const headings = extractHeadings(body);
    if (headings.length > 0) {
      meta.headings = headings;
    }
  }
  return meta;
}

function scanDirectory(postsDir: string, relDir: string): CatalogNode[] {
  const absDir = path.join(postsDir, relDir);
  if (!fs.existsSync(absDir)) return [];

  const nodes: CatalogNode[] = [];
  const entries = fs
    .readdirSync(absDir, { withFileTypes: true })
    .filter((e) => e.name !== 'media')
    .sort((a, b) => compareNaturalNames(a.name, b.name));

  const SKIP_DIRS = new Set(['media', 'images', 'Translated']);

  for (const entry of entries) {
    const childRel = relDir ? `${relDir}/${entry.name}` : entry.name;
    const childAbs = path.join(postsDir, childRel);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const folderKey = entry.name;
      const label = FOLDER_LABELS[folderKey] ?? folderKey;
      const readmeRel = `${childRel}/README.md`;
      const readmeAbs = path.join(postsDir, readmeRel);

      let meta: CatalogMeta = { title: label, categories: [], tags: [] };
      let routePath = filePathToRoute(`posts/${childRel}`);

      if (fs.existsSync(readmeAbs)) {
        const raw = fs.readFileSync(readmeAbs, 'utf-8');
        const fm = parseFrontmatter(raw);
        meta = metaFromFm(fm, raw, false);
        meta.title = String(fm.title ?? label);
        routePath = filePathToRoute(`posts/${readmeRel}`);
      }

      nodes.push({
        id: filePathToId(`posts/${childRel}`),
        type: 'folder',
        label,
        path: routePath,
        assetType: 'scene',
        meta,
        children: scanDirectory(postsDir, childRel),
      });
      continue;
    }

    if (!entry.name.endsWith('.md') || entry.name === 'README.md') continue;

    const raw = fs.readFileSync(childAbs, 'utf-8');
    const fm = parseFrontmatter(raw);
    if (fm.article !== true) continue;

    const postsRel = `posts/${childRel.replace(/\\/g, '/')}`;
    const relPath = childRel.replace(/\\/g, '/');
    const assetType = resolveAssetType(relPath, fm, raw);
    const title = String(fm.title ?? path.basename(entry.name, '.md'));

    nodes.push({
      id: filePathToId(postsRel),
      type: 'article',
      label: assetFileName(assetType, title),
      path: filePathToRoute(postsRel),
      assetType,
      meta: metaFromFm(fm, raw, true),
    });
  }

  maybeAppendReadmeAsLeafArticle(postsDir, relDir, nodes);
  appendPostAttachments(postsDir, relDir, nodes);

  return nodes;
}

const IMAGE_FILE_RE = /\.(png|jpe?g|gif|webp|svg)$/i;

function postsPathToUrl(postsRel: string): string {
  return `/${postsRel.replace(/\\/g, '/')}`;
}

function appendPostAttachments(
  postsDir: string,
  relDir: string,
  nodes: CatalogNode[],
): void {
  if (!relDir) return;

  const absDir = path.join(postsDir, relDir);
  if (!fs.existsSync(absDir)) return;

  const attachments: CatalogNode[] = [];

  const mediaAbs = path.join(absDir, 'media');
  if (fs.existsSync(mediaAbs) && fs.statSync(mediaAbs).isDirectory()) {
    const mediaRel = `${relDir}/media`;
    const mediaFiles = fs
      .readdirSync(mediaAbs, { withFileTypes: true })
      .filter((e) => e.isFile() && IMAGE_FILE_RE.test(e.name))
      .sort((a, b) => compareNaturalNames(a.name, b.name));

    const fileChildren: CatalogNode[] = mediaFiles.map((entry) => {
      const fileRel = `${mediaRel}/${entry.name}`;
      const postsRel = `posts/${fileRel.replace(/\\/g, '/')}`;
      const resourceUrl = postsPathToUrl(postsRel);
      return {
        id: filePathToId(postsRel),
        type: 'file' as const,
        label: entry.name,
        path: resourceUrl,
        assetType: 'texture' as const,
        meta: {
          title: entry.name,
          categories: [],
          tags: [],
          resourceUrl,
          fileKind: 'image' as const,
        },
      };
    });

    attachments.push({
      id: filePathToId(`posts/${mediaRel.replace(/\\/g, '/')}`),
      type: 'folder',
      label: 'media',
      path: postsPathToUrl(`posts/${mediaRel.replace(/\\/g, '/')}`),
      assetType: 'scene',
      meta: {
        title: 'media',
        categories: [],
        tags: [],
      },
      children: fileChildren,
    });
  }

  const pdfs = fs
    .readdirSync(absDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.pdf'))
    .sort((a, b) => compareNaturalNames(a.name, b.name));

  for (const entry of pdfs) {
    const fileRel = `${relDir}/${entry.name}`;
    const postsRel = `posts/${fileRel.replace(/\\/g, '/')}`;
    const resourceUrl = postsPathToUrl(postsRel);
    attachments.push({
      id: filePathToId(postsRel),
      type: 'file',
      label: entry.name,
      path: resourceUrl,
      assetType: 'pdf',
      meta: {
        title: entry.name,
        categories: [],
        tags: [],
        resourceUrl,
        fileKind: 'pdf',
      },
    });
  }

  if (!attachments.length) return;

  nodes.unshift(...attachments);
}

/** Leaf folders (e.g. Unity ebook dirs) often only have README.md without `article: true`. */
function maybeAppendReadmeAsLeafArticle(
  postsDir: string,
  relDir: string,
  nodes: CatalogNode[],
): void {
  if (!relDir) return;
  if (nodes.some((n) => n.type === 'article' || n.type === 'folder')) return;

  const readmeRel = `${relDir}/README.md`;
  const readmeAbs = path.join(postsDir, readmeRel);
  if (!fs.existsSync(readmeAbs)) return;

  const raw = fs.readFileSync(readmeAbs, 'utf-8');
  const fm = parseFrontmatter(raw);
  const postsRel = `posts/${readmeRel.replace(/\\/g, '/')}`;
  const relPath = relDir.replace(/\\/g, '/');
  const assetType = resolveAssetType(relPath, fm, raw);
  const title = String(fm.title ?? path.basename(relDir));

  nodes.push({
    id: filePathToId(postsRel),
    type: 'article',
    label: assetFileName(assetType, title),
    path: filePathToRoute(postsRel),
    assetType,
    meta: metaFromFm(fm, raw, true),
  });
}

function collectArticleIds(nodes: CatalogNode[]): string[] {
  const ids: string[] = [];
  const walk = (list: CatalogNode[]): void => {
    for (const node of list) {
      if (node.type === 'article') ids.push(node.id);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return ids.sort(compareNaturalNames);
}

export function buildUnityCatalog(docsDir: string): UnityCatalog {
  const postsDir = path.join(docsDir, 'posts');
  const children = scanDirectory(postsDir, '');

  const root: CatalogNode = {
    id: 'posts',
    type: 'folder',
    label: 'Assets',
    path: '/',
    assetType: 'scene',
    meta: { title: 'Assets', categories: [], tags: [] },
    children,
  };

  const articleIds = collectArticleIds(children);
  const defaultArticleId = articleIds[0];

  return {
    root,
    defaultArticleId,
  };
}

export function writeCatalogFile(
  docsDir: string,
  vuepressDir: string,
): UnityCatalog {
  const catalog = buildUnityCatalog(docsDir);
  const tempDir = path.join(vuepressDir, '.temp');
  fs.mkdirSync(tempDir, { recursive: true });
  fs.writeFileSync(
    path.join(tempDir, 'unity-catalog.json'),
    JSON.stringify(catalog, null, 2),
    'utf-8',
  );
  return catalog;
}
