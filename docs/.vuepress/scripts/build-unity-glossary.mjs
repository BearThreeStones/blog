import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vuepressDir = path.resolve(__dirname, '..');
const sourcePath = path.join(vuepressDir, 'data', 'unity-glossary-source.html');
const outPath = path.join(vuepressDir, 'i18n', 'unity-glossary.json');
const overridesPath = path.join(vuepressDir, 'i18n', 'unity-glossary-overrides.json');

const TERM_RE = /####\s+(.+?)\s+\(([^)]+)\)\*?\s*[：:]/g;

function normalizeEn(term) {
  return term.replace(/\*+$/, '').trim();
}

function normalizeZh(term) {
  return term.replace(/\*+$/, '').trim();
}

function parseGlossary(html) {
  const byEn = {};
  let match;
  while ((match = TERM_RE.exec(html)) !== null) {
    const zh = normalizeZh(match[1]);
    const en = normalizeEn(match[2]);
    if (!en || !zh) continue;
    byEn[en] = zh;
  }
  return byEn;
}

function main() {
  if (!fs.existsSync(sourcePath)) {
    console.warn(`[build-unity-glossary] Missing source: ${sourcePath}`);
    process.exit(0);
  }

  const html = fs.readFileSync(sourcePath, 'utf-8');
  const parsed = parseGlossary(html);
  const overrides = fs.existsSync(overridesPath)
    ? JSON.parse(fs.readFileSync(overridesPath, 'utf-8'))
    : {};

  const merged = { ...parsed, ...overrides };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf-8');
  console.log(
    `[build-unity-glossary] Wrote ${Object.keys(merged).length} terms to ${path.relative(process.cwd(), outPath)}`,
  );
}

main();
