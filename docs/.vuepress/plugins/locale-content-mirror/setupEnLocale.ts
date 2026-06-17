import fs from 'node:fs';
import path from 'node:path';

const EN_LOCALE = 'en';

export function setupEnLocaleMirror(docsDir: string): void {
  const enDir = path.join(docsDir, EN_LOCALE);
  const srcReadme = path.join(docsDir, 'README.md');
  const enReadme = path.join(enDir, 'README.md');
  const srcPosts = path.join(docsDir, 'posts');
  const enPosts = path.join(enDir, 'posts');

  fs.mkdirSync(enDir, { recursive: true });

  if (fs.existsSync(srcReadme)) {
    fs.copyFileSync(srcReadme, enReadme);
  }

  if (!fs.existsSync(srcPosts)) {
    return;
  }

  if (fs.existsSync(enPosts)) {
    const stat = fs.lstatSync(enPosts);
    if (stat.isSymbolicLink() || stat.isDirectory()) {
      return;
    }
    fs.rmSync(enPosts, { recursive: true, force: true });
  }

  const relativePosts = path.relative(enDir, srcPosts);
  try {
    fs.symlinkSync(relativePosts, enPosts, 'junction');
  } catch {
    try {
      fs.symlinkSync(relativePosts, enPosts, 'dir');
    } catch (err) {
      console.warn(
        '[locale-content-mirror] Could not symlink docs/en/posts; copy posts manually.',
        err,
      );
    }
  }
}
