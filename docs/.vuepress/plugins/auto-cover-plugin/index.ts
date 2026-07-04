import type { Plugin } from 'vuepress';
import { path } from 'vuepress/utils';
import * as fs from 'fs';

const copiedImages = new Set<string>();

export const autoCoverPlugin = (): Plugin => {
  return {
    name: 'vuepress-plugin-auto-cover',

    extendsPage(page, app) {
      // 1. Only process markdown pages
      if (!page.filePath || !page.filePath.endsWith('.md')) {
        return;
      }

      // 2. Ignore cover if already defined in frontmatter
      if (page.frontmatter.cover) {
        return;
      }

      const content = page.content || '';

      // 3. Extract the first image from page content
      // Regex matches ![alt](url) but NOT ![game](url) or ![unity:game](url)
      const markdownImgRegex = /!\[(?!game\b|unity:game\b)[^\]]*\]\(([^?\s)]+)(?:\?[^\s)]+)?(?:\s+["'][^"']*["'])?\)/;
      const mdMatch = content.match(markdownImgRegex);

      let imageUrl: string | null = null;
      if (mdMatch) {
        imageUrl = mdMatch[1];
      } else {
        // Try HTML img tag: <img src="url" />
        const htmlImgRegex = /<img\s+[^>]*?src=["']([^"']+)["']/;
        const htmlMatch = content.match(htmlImgRegex);
        if (htmlMatch) {
          imageUrl = htmlMatch[1];
        }
      }

      if (!imageUrl) {
        return;
      }

      const applyCover = (coverUrl: string) => {
        page.frontmatter.cover = coverUrl;
        // Blog plugin snapshots cover into routeMeta before this plugin runs.
        page.routeMeta = { ...page.routeMeta, cover: coverUrl };
      };

      // 4. Handle remote or absolute paths
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('//')) {
        applyCover(imageUrl);
        return;
      }

      if (imageUrl.startsWith('/')) {
        applyCover(imageUrl);
        return;
      }

      // 5. Handle local relative images (e.g. ./media/image.png or media/image.png)
      const mdDir = path.dirname(page.filePath);
      const absImgPath = path.resolve(mdDir, imageUrl);

      if (!fs.existsSync(absImgPath)) {
        return;
      }

      const sourceDir = app.dir.source();
      const relativeMdDir = path.relative(sourceDir, mdDir);
      const imgFilename = path.basename(absImgPath);

      const publicDir = path.resolve(sourceDir, '.vuepress/public');
      const destSubDir = path.resolve(publicDir, 'auto-covers', relativeMdDir);
      const destImgPath = path.resolve(destSubDir, imgFilename);

      const publicUrlPath = `/auto-covers/${relativeMdDir.replace(/\\/g, '/')}/${imgFilename}`;

      applyCover(publicUrlPath);

      if (!copiedImages.has(destImgPath)) {
        try {
          if (!fs.existsSync(destSubDir)) {
            fs.mkdirSync(destSubDir, { recursive: true });
          }
          fs.copyFileSync(absImgPath, destImgPath);
          copiedImages.add(destImgPath);
        } catch (err) {
          console.error(`[auto-cover-plugin] Failed to copy image ${absImgPath} to ${destImgPath}:`, err);
        }
      }
    }
  };
};

export default autoCoverPlugin;
