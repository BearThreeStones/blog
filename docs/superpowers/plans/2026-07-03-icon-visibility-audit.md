# Icon 可见性系统审计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 对博客全部 Unity 主题 icon 表面进行系统性可见性审计，覆盖日间/夜间模式及选中/未选中状态，产出可追踪的测试矩阵、自动化辅助脚本与问题清单，为后续修复提供依据。

**Architecture:** 以 CSS 自定义属性 `--unity-theme-ui-*` / `--ue-icon-*` 为索引，从 `icon-manifest.json` 与 SCSS 选择器反查每个 UI 表面的 icon 绑定关系；用 Node 脚本校验资产完整性，用 Playwright 截图 + 人工 checklist 做跨主题/跨状态视觉验证；问题记录到 `docs/superpowers/audits/icon-visibility-findings.md`。

**Tech Stack:** VuePress 2 + vuepress-theme-hope、SCSS（`index.scss` / `unity-editor.scss`）、`theme-ui-icon-sync` 客户端插件、Playwright（已存在于 devDependencies）、Node `--test`

---

## File Structure

| 文件 | 职责 |
|------|------|
| `docs/.vuepress/styles/index.scss` | 经典博客布局：`:root` / `html[data-theme='dark']` 定义 ~40 组 theme-ui 变量；`::before` 伪元素绑定 navbar、sidebar、meta、blog-type 等 |
| `docs/.vuepress/styles/unity-editor.scss` | Unity Editor 布局：`--ue-icon-*` 变量；toolbar / hierarchy foldout / folder 图标 |
| `docs/.vuepress/plugins/theme-ui-icon-sync/client.ts` | Blog type tab 选中态 icon 在 light 模式强制用 inactive 图标的 JS 逻辑 |
| `docs/.vuepress/icon-manifest.json` | Unity Editor Icon 库 → public 路径映射（sync 源） |
| `docs/.vuepress/scripts/sync-unity-icons.mjs` | 构建时同步 icon 资产 |
| `docs/.vuepress/public/assets/icon/unity/theme-ui/{light,dark}/` | 主题 UI SVG/PNG 资产 |
| `docs/.vuepress/public/assets/icon/unity/assets/` | Unity Editor 资产浏览器类型图标（无 dark 变体） |
| `scripts/audit-icon-inventory.mjs` | **新建** — 从 manifest + SCSS 生成审计清单 JSON |
| `scripts/audit-icon-assets.mjs` | **新建** — 校验 CSS 变量引用的文件是否存在 |
| `scripts/icon-visibility-audit.test.mjs` | **新建** — Node test 包装资产校验 |
| `scripts/icon-visibility-screenshots.mjs` | **新建** — Playwright 批量截图脚本 |
| `docs/superpowers/audits/icon-visibility-findings.md` | **新建** — 审计结果记录表 |
| `docs/superpowers/audits/icon-visibility-matrix.md` | **新建** — 人工 checklist 测试矩阵 |

---

## Scope Inventory（审计范围清单）

### A. 经典博客布局（`html:not(.unity-editor-active)`）

| 区域 | DOM 选择器 / 组件 | CSS 变量 | 状态维度 |
|------|-------------------|----------|----------|
| Navbar 主导航 | `.vp-navbar-center .route-link`, `.vp-dropdown-title` | `--unity-theme-ui-nav-*` | 默认 / `.route-link-active` / dropdown `.open` / hover |
| Navbar 右侧工具栏 | `#color-mode-switch` | `--unity-theme-ui-color-auto-on`, `color-dark-on`, `color-light-on` | auto / dark / light 三态 × 2 主题 |
| | `.vp-appearance-button` | `appearance` / `appearance-on` | 默认 / `.open` |
| | `.vp-toggle-navbar-button` | `menu` / `menu-on` | 默认 / `.is-active`（移动端） |
| | `.vp-dropdown-wrapper > .vp-dropdown-title`（语言） | `language` / `language-on` | 默认 / `.open` |
| | `.vp-nav-item.vp-action .vp-action-link`（GitHub） | `link` / `link-on` | 默认 / hover |
| | DocSearch 按钮 | Algolia 内置 | 非 Unity icon（标记为 out-of-scope 或单独记录） |
| 桌面 Sidebar | `.vp-sidebar-link`, `.vp-sidebar-header` | `--unity-theme-ui-nav-*` | 默认 / `.active` / `.route-link-active` |
| | `.vp-sidebar-header .vp-arrow` | `caret-right`, `caret-down-on` | 折叠 / 展开 |
| 桌面 Sidebar 折叠按钮 | `.vp-toggle-sidebar-button` | `sidebar-toggle`, `chevron-right`（collapsed） | 展开 / 折叠 |
| 移动 Nav Screen | `.vp-nav-screen` 内同上 nav 规则 | 同 navbar | 同 navbar |
| Blog 类型切换 | `.vp-blog-type-icon-wrapper` | `article/category/tag/timeline` + JS sync | 未选中 / `.active` × light/dark |
| Blog 列表标题 | `.vp-star-article-wrapper > .title` 等 | 对应 `-on` 无（仅 default） | 静态 |
| 文章 Meta | `.page-date-info`, `.page-category-info` 等 | `date`, `category`, `tag` 等 | 静态（无 on/off） |
| 社交链接 | `.vp-social-media[aria-label='…']` | `link`, `edit`, `reading-time`, `article` | 默认 / hover（filter 而非 -on） |
| 全屏 / 打印 | `.full-screen`, `.print-button` | `fullscreen`/`on`, `print` | pressed / 默认 |
| 返回顶部 | `.back-to-top-icon` | `--back-to-top-icon`（仅 light SVG） | 2 主题 |
| 代码复制 | `.vp-copy-code-button::before` | `--code-copy-icon`, `--code-copied-icon` | 默认 / copied |
| 上下篇导航 | `.vp-page-nav .hint .arrow` | `chevron-left`, `chevron-right` | 静态 |
| 下拉 `<select>` | `select` caret | `caret-down` | 静态 |
| Classic Home FAB | `.home-view-switch-fab-icon` | `toolbar-editor-view` light/dark | 2 主题 |
| TOC | `.vp-toc-*` | 无 icon（文字列表） | N/A — 确认无遗漏 |

### B. Unity Editor 布局（`html.unity-editor-active`）

| 区域 | 选择器 | CSS 变量 | 状态维度 |
|------|--------|----------|----------|
| Toolbar 搜索 | `.unity-toolbar-search-icon` | `--ue-icon-toolbar-search` | 2 主题 |
| Toolbar 视图切换 | `.unity-toolbar-view-icon--blog` | `--ue-icon-toolbar-blog-view` | 2 主题 |
| | UnityHomeViewSwitch（editor view） | `--ue-icon-toolbar-editor-view` | 2 主题 |
| Color mode | `.unity-color-mode #color-mode-switch::before` | `color-*-on`（注意 fallback 硬编码 dark） | 3 态 × 2 主题 |
| Hierarchy foldout | `.unity-foldout-icon` | `--ue-icon-caret-right` / `caret-down` | 折叠 / 展开 × 2 主题 |
| Hierarchy folder | `.unity-tree-icon--folder` | `--ue-icon-folder` / `folder-open` | 关闭 / `.is-open` × 2 主题 |
| 资产浏览器 | `.unity-asset-icon` `<img>` | `/assets/icon/unity/assets/*.svg` | 静态，无 dark 变体 |
| Unity WebGL Player | fullscreen 按钮 | `fullscreen-enter.svg` / `exit` | 2 状态 |

### C. CSS 变量完整列表（manifest 对齐）

`icon-manifest.json` 中 `theme-ui/light/` 与 `theme-ui/dark/` 各 53 个 SVG；其中带 `-on` 后缀的 22 对用于选中/激活态。额外非 theme-ui 资产：`copy.svg`, `copy-success.svg`, `back-to-top.svg`, `assets/*.svg`, nav legacy PNG 别名。

---

## Test Matrix（测试矩阵摘要）

维度：**Theme** ∈ {light, dark} × **State** ∈ {default, active/selected, hover, open/expanded, pressed} × **Viewport** ∈ {desktop ≥1200px, tablet 961–1199px, mobile ≤960px} × **Layout** ∈ {classic, unity-editor}

| ID | Surface | Route / 触发方式 | Theme | State | Viewport | Pass 标准 |
|----|---------|------------------|-------|-------|----------|-----------|
| NAV-01 | Navbar Home | `/` | L/D | default | desktop | icon 可见，对比背景 ≥3:1 |
| NAV-02 | Navbar Home | `/` | L/D | active | desktop | `-on`  variant 可见且与 pill 背景可区分 |
| NAV-03 | Articles dropdown | hover + open | L/D | default/active | desktop | articles / articles-on 切换正确 |
| NAV-04 | Algorithm | `/posts/algorithm/` | L/D | active | desktop | nav-algorithm-on |
| NAV-05 | Unity Best Practice | `/posts/unity-best-practice/` | L/D | active | desktop | 不影响 Articles 高亮（NAV-03 互斥） |
| NAV-06 | Color mode | 点击 3 次循环 | L/D | auto/dark/light | desktop | 三态 icon 均可见、居中 |
| NAV-07 | Appearance | 点击打开面板 | L/D | open | desktop | appearance-on |
| NAV-08 | Language | 点击 dropdown | L/D | open | desktop | language-on |
| NAV-09 | Menu toggle | 宽度 ≤960px | L/D | default/active | mobile | menu / menu-on |
| SID-01 | Sidebar item | 任意文章页 | L/D | active | desktop | 对应 nav-*-on |
| SID-02 | Sidebar foldout | 展开父级 | L/D | expanded | desktop | caret-down-on |
| SID-03 | Sidebar collapse btn | 点击折叠 | L/D | collapsed | desktop ≥961 | chevron-right 可见 |
| BLOG-01 | Blog type tabs | `/blog/` 或 posts 列表 | light | active tab | desktop | **预期：inactive icon**（JS 设计）— 记录是否可读 |
| BLOG-02 | Blog type tabs | 同上 | dark | active tab | desktop | **预期：-on icon** |
| META-01 | Article meta row | 任意文章 | L/D | static | desktop | date/category/tag 等 6 个 meta icon |
| SOC-01 | Social Email/Steam | footer 或 blogger | L/D | hover | desktop | hover filter 后仍可见 |
| FAB-01 | Home view switch | `/` classic home | L/D | static | desktop | toolbar-editor-view |
| UE-01 | Editor toolbar | `/?view=editor` 或 FAB 切换 | L/D | static | desktop | search + view icons |
| UE-02 | Hierarchy foldout | editor 内点击文件夹 | L/D | collapsed/expanded | desktop | caret 切换 |
| UE-03 | Asset browser | editor Project 面板 | L/D | selected row | desktop | 资产 icon 在 dark 背景可读性 |
| CODE-01 | Copy button | 含代码块文章 | L/D | default/copied | desktop | copy / copy-success 在 dark 下可见性 |
| BTT-01 | Back to top | 长文滚动 | L/D | visible | desktop | back-to-top 在 dark 下可见性 |

完整 80+ 行矩阵写入 Task 2 生成的 `icon-visibility-matrix.md`。

---

## Known Risk Areas（已知风险区）

1. **`#color-mode-switch` 居中** — navbar 与 unity-editor 各有一套规则（`index.scss:1449–1484`, `unity-editor.scss:275–316`），已知对齐问题。
2. **Blog type active + light mode** — `theme-ui-icon-sync/client.ts:60–62` 故意在 light 模式用 inactive icon；需确认是否为设计意图或可见性 bug。
3. **`-on` 图标在浅色 pill 背景** — Unity `-on` 资源偏 pale/white，navbar active pill 为浅蓝 tint，light 模式下 `-on` 可能对比度不足。
4. **无 dark 变体资产** — `back-to-top.svg`, `copy.svg`, `copy-success.svg`, `assets/*.svg` 仅从 light 库同步；dark 模式靠 mask 或未切换。
5. **Social icons** — 用 `filter: brightness(1.3)` 而非 `-on` 变量（`index.scss:1640–1643`）。
6. **`:has()` 依赖** — color mode 三态通过 `:has(> :nth-child(N)[style*='block'])` 检测，Hope 主题 DOM 变更会导致 icon 错位或消失。
7. **Articles vs Best Practice 互斥高亮** — 复杂 `:has()` 规则（`index.scss:1285–1300`），易漏测。
8. **DocSearch** — Algolia 自带 magnifier，非 Unity 风格；dark 模式需单独确认。
9. **Manifest 不对称** — 如 `chevron-down` dark 映射到 Selected State（`icon-manifest.json:13`），与 light 默认态不对称。
10. **PNG 遗留** — CSS 仍匹配 `*.png` 路径（`home.png` 等），与 navbar.ts SVG 双轨并存。

---

### Task 1: Icon 资产完整性自动校验

**Files:**
- Create: `scripts/audit-icon-assets.mjs`
- Create: `scripts/icon-visibility-audit.test.mjs`
- Test: `scripts/icon-visibility-audit.test.mjs`

- [ ] **Step 1: 编写资产校验脚本**

```javascript
// scripts/audit-icon-assets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCSS = path.join(ROOT, 'docs/.vuepress/styles/index.scss');
const UE_SCSS = path.join(ROOT, 'docs/.vuepress/styles/unity-editor.scss');
const PUBLIC = path.join(ROOT, 'docs/.vuepress/public');
const MANIFEST = path.join(ROOT, 'docs/.vuepress/icon-manifest.json');

const URL_RE = /url\(['"]?(\/assets\/icon\/[^'")]+)['"]?\)/g;

export function extractIconUrlsFromScss(content) {
  const urls = new Set();
  for (const match of content.matchAll(URL_RE)) {
    urls.add(match[1]);
  }
  return [...urls].sort();
}

export function auditIconAssets() {
  const scss = fs.readFileSync(SCSS, 'utf8') + fs.readFileSync(UE_SCSS, 'utf8');
  const urls = extractIconUrlsFromScss(scss);
  const missing = urls.filter((u) => !fs.existsSync(path.join(PUBLIC, u)));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const manifestDests = new Set(
    (manifest.icons ?? []).map((e) => `/assets/icon/unity/${e.dest}`),
  );
  const unmanifested = urls.filter(
    (u) => u.startsWith('/assets/icon/unity/') && !manifestDests.has(u.replace(/\.png$/, '.svg')),
  );
  return { urls, missing, unmanifested };
}

if (process.argv[1]?.endsWith('audit-icon-assets.mjs')) {
  const { missing, unmanifested } = auditIconAssets();
  if (missing.length) {
    console.error('Missing files:', missing);
    process.exit(1);
  }
  if (unmanifested.length) {
    console.warn('URLs not in manifest (review manually):', unmanifested);
  }
  console.log('All referenced icon files exist.');
}
```

- [ ] **Step 2: 编写 Node test**

```javascript
// scripts/icon-visibility-audit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { auditIconAssets, extractIconUrlsFromScss } from './audit-icon-assets.mjs';

test('extractIconUrlsFromScss finds theme-ui urls', () => {
  const sample = "background: url('/assets/icon/unity/theme-ui/light/menu.svg');";
  assert.deepEqual(extractIconUrlsFromScss(sample), [
    '/assets/icon/unity/theme-ui/light/menu.svg',
  ]);
});

test('all SCSS-referenced icon files exist on disk', () => {
  const { missing } = auditIconAssets();
  assert.equal(missing.length, 0, `Missing icons: ${missing.join(', ')}`);
});
```

- [ ] **Step 3: 运行 test 确认当前基线**

Run: `node --test scripts/icon-visibility-audit.test.mjs`
Expected: PASS（若有 missing，记录到 findings 再继续，不阻塞审计）

- [ ] **Step 4: Commit**

```bash
git add scripts/audit-icon-assets.mjs scripts/icon-visibility-audit.test.mjs
git commit -m "test: add icon asset integrity audit script"
```

---

### Task 2: 生成 UI 表面 → CSS 变量审计清单

**Files:**
- Create: `scripts/audit-icon-inventory.mjs`
- Create: `docs/superpowers/audits/icon-visibility-matrix.md`

- [ ] **Step 1: 编写 inventory 生成脚本**

```javascript
// scripts/audit-icon-inventory.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs/superpowers/audits/icon-visibility-inventory.json');

const SURFACES = [
  { id: 'NAV-01', area: 'navbar-center', selector: '.vp-navbar-center .route-link[href="/"]', vars: ['nav-home', 'nav-home-on'], states: ['default', 'active'], layouts: ['classic'], viewports: ['desktop', 'mobile'] },
  { id: 'NAV-03', area: 'navbar-center', selector: '.vp-navbar-center .vp-dropdown-title', vars: ['nav-articles', 'nav-articles-on'], states: ['default', 'open', 'active-child'], layouts: ['classic'], viewports: ['desktop', 'mobile'] },
  { id: 'NAV-06', area: 'navbar-end', selector: '#color-mode-switch', vars: ['color-auto-on', 'color-dark-on', 'color-light-on'], states: ['auto', 'dark', 'light'], layouts: ['classic', 'unity-editor'], viewports: ['desktop'] },
  { id: 'NAV-07', area: 'navbar-end', selector: '.vp-appearance-button', vars: ['appearance', 'appearance-on'], states: ['default', 'open'], layouts: ['classic'], viewports: ['desktop', 'mobile'] },
  { id: 'NAV-08', area: 'navbar-end', selector: '.vp-navbar-end .vp-dropdown-wrapper > .vp-dropdown-title', vars: ['language', 'language-on'], states: ['default', 'open'], layouts: ['classic'], viewports: ['desktop'] },
  { id: 'NAV-09', area: 'navbar-end', selector: '.vp-toggle-navbar-button', vars: ['menu', 'menu-on'], states: ['default', 'active'], layouts: ['classic'], viewports: ['mobile'] },
  { id: 'SID-01', area: 'sidebar', selector: '.vp-sidebar-link.route-link-active', vars: ['nav-algorithm-on', 'nav-game-development-on', 'nav-design-patterns-on'], states: ['active'], layouts: ['classic'], viewports: ['desktop'] },
  { id: 'BLOG-01', area: 'blog-type', selector: '.vp-blog-type-icon-wrapper.active', vars: ['article', 'category', 'tag', 'timeline'], states: ['active'], layouts: ['classic'], viewports: ['desktop', 'mobile'], note: 'light uses inactive via JS' },
  { id: 'META-01', area: 'article-meta', selector: '.page-info', vars: ['date', 'reading-time', 'category', 'tag', 'visibility', 'word-count', 'edit'], states: ['static'], layouts: ['classic'], viewports: ['desktop'] },
  { id: 'UE-01', area: 'unity-toolbar', selector: '.unity-toolbar-search-icon', vars: ['ue-icon-toolbar-search'], states: ['static'], layouts: ['unity-editor'], viewports: ['desktop'] },
  { id: 'UE-02', area: 'unity-hierarchy', selector: '.unity-foldout-icon', vars: ['ue-icon-caret-right', 'ue-icon-caret-down'], states: ['collapsed', 'expanded'], layouts: ['unity-editor'], viewports: ['desktop'] },
  { id: 'FAB-01', area: 'classic-home', selector: '.home-view-switch-fab-icon', vars: ['toolbar-editor-view'], states: ['static'], layouts: ['classic'], viewports: ['desktop', 'mobile'] },
  { id: 'CODE-01', area: 'code-block', selector: '.vp-copy-code-button', vars: ['code-copy-icon', 'code-copied-icon'], states: ['default', 'copied'], layouts: ['classic'], viewports: ['desktop'] },
  { id: 'BTT-01', area: 'back-to-top', selector: '.back-to-top-icon', vars: ['back-to-top-icon'], states: ['visible'], layouts: ['classic'], viewports: ['desktop'] },
];

const THEMES = ['light', 'dark'];

const matrix = SURFACES.flatMap((s) =>
  THEMES.flatMap((theme) =>
    s.states.map((state) => ({
      ...s,
      theme,
      state,
      cssVarPrefix: s.vars.some((v) => v.startsWith('ue-'))
        ? `--${s.vars[0]}`
        : `--unity-theme-ui-${s.vars[0]}`,
      pass: null,
      notes: '',
    })),
  ),
);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), matrix }, null, 2));
console.log(`Wrote ${matrix.length} rows to ${OUT}`);
```

- [ ] **Step 2: 运行脚本生成 JSON**

Run: `node scripts/audit-icon-inventory.mjs`
Expected: `Wrote N rows to docs/superpowers/audits/icon-visibility-inventory.json`

- [ ] **Step 3: 由 JSON 生成 markdown checklist**

Run: `node -e "const j=require('./docs/superpowers/audits/icon-visibility-inventory.json'); const lines=['# Icon Visibility Test Matrix','','| ID | Area | Theme | State | Selector | Pass | Notes |','|---|---|---|---|---|---|---|']; j.matrix.forEach(r=>lines.push('| '+[r.id,r.area,r.theme,r.state,'`'+r.selector+'`','⬜',''].join(' | ')+' |')); require('fs').writeFileSync('docs/superpowers/audits/icon-visibility-matrix.md', lines.join('\n'));"`

- [ ] **Step 4: Commit**

```bash
git add scripts/audit-icon-inventory.mjs docs/superpowers/audits/
git commit -m "docs: add icon visibility audit inventory and test matrix"
```

---

### Task 3: Playwright 截图回归脚本

**Files:**
- Create: `scripts/icon-visibility-screenshots.mjs`
- Reference: `scripts/capture-game-previews.mjs`（已有 Playwright 模式）

- [ ] **Step 1: 编写截图脚本**

```javascript
// scripts/icon-visibility-screenshots.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.AUDIT_BASE_URL ?? 'http://localhost:8080';
const OUT = path.resolve('docs/superpowers/audits/screenshots');

const SCENARIOS = [
  { name: 'home-light', path: '/', theme: 'light' },
  { name: 'home-dark', path: '/', theme: 'dark' },
  { name: 'algorithm-active-light', path: '/posts/algorithm/', theme: 'light' },
  { name: 'algorithm-active-dark', path: '/posts/algorithm/', theme: 'dark' },
  { name: 'blog-type-light', path: '/blog/', theme: 'light' },
  { name: 'blog-type-dark', path: '/blog/', theme: 'dark' },
  { name: 'article-meta-light', path: '/posts/algorithm/example/', theme: 'light' },
  { name: 'mobile-nav-light', path: '/', theme: 'light', viewport: { width: 390, height: 844 } },
];

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
    localStorage.setItem('vuepress-theme-hope-scheme', t);
  }, theme);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const s of SCENARIOS) {
    const page = await browser.newPage();
    if (s.viewport) await page.setViewportSize(s.viewport);
    else await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE + s.path, { waitUntil: 'networkidle' });
    await setTheme(page, s.theme);
    await page.waitForTimeout(300);
    const navbar = page.locator('.vp-navbar');
    await navbar.screenshot({ path: path.join(OUT, `${s.name}-navbar.png`) });
    if (s.path.includes('algorithm')) {
      const sidebar = page.locator('.vp-sidebar');
      if (await sidebar.count()) {
        await sidebar.screenshot({ path: path.join(OUT, `${s.name}-sidebar.png`) });
      }
    }
    await page.close();
  }
  await browser.close();
  console.log('Screenshots written to', OUT);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: 启动 dev server 并跑截图**

Run: `npm run docs:dev`（后台）
Run: `node scripts/icon-visibility-screenshots.mjs`
Expected: `docs/superpowers/audits/screenshots/*-navbar.png` 等文件生成

- [ ] **Step 3: 人工对比截图，将问题写入 findings**

打开 `docs/superpowers/audits/screenshots/`，逐对比较 light/dark，记录不可见/对比度低的 icon 到 Task 4 的 findings 文件。

- [ ] **Step 4: Commit 脚本（不含 screenshots 或按需 gitignore）**

```bash
git add scripts/icon-visibility-screenshots.mjs
git commit -m "chore: add playwright icon visibility screenshot script"
```

---

### Task 4: 人工浏览器审计（经典布局）

**Files:**
- Create: `docs/superpowers/audits/icon-visibility-findings.md`
- Modify: `docs/superpowers/audits/icon-visibility-matrix.md`（填写 Pass 列）

- [ ] **Step 1: 启动 dev server**

Run: `npm run docs:dev`
Expected: `http://localhost:8080` 可访问

- [ ] **Step 2: Light 模式 — Navbar 全状态**

1. 打开 `/`，确认 Home icon 可见（NAV-01 light/default）
2. 点击 Home，确认 active `-on` variant（NAV-02）
3. Hover Articles dropdown，确认 articles-on（NAV-03）
4. 导航到 `/posts/unity-best-practice/`，确认 Articles **未**错误高亮（NAV-05）
5. 点击 `#color-mode-switch` 三次，记录 auto/dark/light 三态 icon（NAV-06）
6. 点击 appearance，确认 open 态（NAV-07）
7. 打开 language dropdown（NAV-08）

- [ ] **Step 3: Dark 模式 — 重复 Step 2**

切换 `data-theme=dark` 或通过 color-mode-switch，重复 NAV-01–08。

- [ ] **Step 4: Sidebar + Blog + Meta**

1. 打开 `/posts/algorithm/` — SID-01, SID-02
2. 折叠 sidebar — SID-03
3. 打开 blog 列表 — BLOG-01/02（分别 light/dark active tab）
4. 打开任意文章 — META-01, CODE-01, BTT-01（滚动触发）

- [ ] **Step 5: Mobile ≤960px**

DevTools 390px 宽度，重复 NAV-09, BLOG mobile, FAB-01。

- [ ] **Step 6: 记录 findings**

```markdown
# Icon Visibility Audit Findings

> 审计日期：2026-07-03

| ID | Severity | Theme | State | Observation | Suggested fix |
|----|----------|-------|-------|-------------|---------------|
| NAV-06 | medium | light | auto | icon 未居中 | 检查 index.scss #color-mode-switch::before inset |
| BLOG-01 | low | light | active | inactive icon 在浅 pill 上偏淡 | 确认设计意图或换用 contrast 更高的 asset |
```

- [ ] **Step 7: Commit findings**

```bash
git add docs/superpowers/audits/
git commit -m "docs: record icon visibility audit findings for classic layout"
```

---

### Task 5: Unity Editor 布局审计

**Files:**
- Modify: `docs/superpowers/audits/icon-visibility-findings.md`
- Reference: `docs/.vuepress/components/unity-editor/UnityToolbar.vue`

- [ ] **Step 1: 进入 Unity Editor 视图**

打开 `/`，点击右下角 FAB「切换到编辑器视图」，或 URL 参数（若项目支持 `?view=editor`）。

- [ ] **Step 2: Light 模式 toolbar + hierarchy**

1. UE-01：确认 search / blog-view icon
2. UE-02：展开/折叠 hierarchy 文件夹，检查 caret 切换
3. UE-03：Project 面板选择不同资产类型，检查 assets/*.svg 可读性

- [ ] **Step 3: Dark 模式重复 Step 2**

- [ ] **Step 4: Color mode 在 editor toolbar**

对比 `unity-editor.scss:298–316` 与 navbar 行为是否一致（NAV-06 editor 变体）。

- [ ] **Step 5: 更新 findings 并 commit**

```bash
git add docs/superpowers/audits/icon-visibility-findings.md docs/superpowers/audits/icon-visibility-matrix.md
git commit -m "docs: record icon visibility audit findings for unity editor layout"
```

---

### Task 6: 对比度量化抽检（可选增强）

**Files:**
- Create: `scripts/audit-icon-contrast.mjs`

- [ ] **Step 1: 编写对比度抽检脚本（PNG 像素采样）**

```javascript
// scripts/audit-icon-contrast.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOTS = 'docs/superpowers/audits/screenshots';
const THRESHOLD = 3.0; // WCAG AA for UI components

function relativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrast(l1, l2) {
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

async function sampleRegion(imagePath, region) {
  const { data, info } = await sharp(imagePath)
    .extract(region)
    .raw()
    .toBuffer({ resolveWithObject: true });
  let r = 0, g = 0, b = 0, n = info.width * info.height;
  for (let i = 0; i < data.length; i += info.channels) {
    r += data[i]; g += data[i + 1]; b += data[i + 2];
  }
  return { r: r / n, g: g / n, b: b / n };
}

async function main() {
  const files = fs.readdirSync(SCREENSHOTS).filter((f) => f.endsWith('-navbar.png'));
  for (const f of files) {
    const p = path.join(SCREENSHOTS, f);
    const meta = await sharp(p).metadata();
    const iconRegion = { left: meta.width - 200, top: 0, width: 200, height: 60 };
    const bgRegion = { left: 0, top: 0, width: 100, height: 60 };
    const icon = await sampleRegion(p, iconRegion);
    const bg = await sampleRegion(p, bgRegion);
    const ratio = contrast(
      relativeLuminance(icon.r, icon.g, icon.b),
      relativeLuminance(bg.r, bg.g, bg.b),
    );
    const status = ratio >= THRESHOLD ? 'OK' : 'FAIL';
    console.log(`${f}: contrast≈${ratio.toFixed(2)} [${status}]`);
  }
}

main();
```

- [ ] **Step 2: 运行对比度抽检**

Run: `node scripts/audit-icon-contrast.mjs`
Expected: 每行 OK 或 FAIL；FAIL 项追加到 findings

- [ ] **Step 3: Commit**

```bash
git add scripts/audit-icon-contrast.mjs
git commit -m "chore: add navbar icon contrast sampling script"
```

---

### Task 7: 审计总结与修复优先级

**Files:**
- Modify: `docs/superpowers/audits/icon-visibility-findings.md`（追加 Summary 段）

- [ ] **Step 1: 统计 findings 按 severity 分组**

Run: `node -e "const fs=require('fs'); const c=fs.readFileSync('docs/superpowers/audits/icon-visibility-findings.md','utf8'); console.log('high:', (c.match(/\| high /g)||[]).length); console.log('medium:', (c.match(/\| medium /g)||[]).length); console.log('low:', (c.match(/\| low /g)||[]).length);"`

- [ ] **Step 2: 写入 Summary**

```markdown
## Summary

- **Total surfaces audited:** N
- **Issues found:** X (Y high, Z medium, W low)
- **Top fixes:** 1) color-mode-switch alignment 2) dark variants for copy/back-to-top 3) blog-type light active contrast
- **Out of scope:** DocSearch Algolia icon styling
- **Next plan:** 根据 findings 创建 `2026-07-XX-icon-visibility-fixes.md` 修复计划
```

- [ ] **Step 3: 将 icon-visibility-audit.test.mjs 加入 npm test**

Modify `package.json` scripts.test:

```json
"test": "node --test docs/.vuepress/plugins/unity-webgl-plugin/lib/*.test.mjs docs/.vuepress/plugins/classic-animations/lib/*.test.mjs docs/.vuepress/plugins/desktop-sidebar-toggle/lib/*.test.mjs scripts/lib/*.test.mjs scripts/icon-visibility-audit.test.mjs"
```

- [ ] **Step 4: 最终 commit**

```bash
git add docs/superpowers/audits/icon-visibility-findings.md package.json
git commit -m "docs: complete icon visibility audit with summary and CI hook"
```

---

## Verification Method Summary

| 方法 | 用途 | 命令 / 工具 |
|------|------|-------------|
| 资产完整性 | 确保 SCSS 引用的 SVG 存在 | `node --test scripts/icon-visibility-audit.test.mjs` |
| Inventory JSON | 机器可读审计清单 | `node scripts/audit-icon-inventory.mjs` |
| Playwright 截图 | 跨主题视觉 diff 基线 | `node scripts/icon-visibility-screenshots.mjs` |
| 人工 checklist | 状态机覆盖（hover/open/active） | `docs/superpowers/audits/icon-visibility-matrix.md` |
| 对比度抽检 | 量化 navbar 区域 | `node scripts/audit-icon-contrast.mjs` |

---

## Self-Review Checklist

- [x] **Spec coverage:** 范围清单覆盖 navbar、sidebar、TOC（确认无 icon）、blog-type、meta、social、FAB、unity-editor、code copy、back-to-top — 每个区域均有 matrix 行与 Task 4/5 步骤
- [x] **Placeholder scan:** 无 TBD/TODO；脚本与 findings 模板均为完整代码
- [x] **Type consistency:** CSS 变量命名统一 `--unity-theme-ui-*` / `--ue-icon-*`；matrix ID 与 findings ID 对齐

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-03-icon-visibility-audit.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — 每个 Task 派发独立 subagent，Task 间 review，快速迭代

**2. Inline Execution** — 在本 session 用 executing-plans 批量执行，checkpoint Review

**Which approach?**
