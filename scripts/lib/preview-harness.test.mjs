import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPreviewHarnessHtml } from './preview-harness.mjs';

describe('renderPreviewHarnessHtml', () => {
  test('includes canvas dimensions and unity config urls', () => {
    const html = renderPreviewHarnessHtml({
      width: 800,
      height: 450,
      loaderUrl: '/build.loader.js',
      dataUrl: '/build.data',
      frameworkUrl: '/build.framework.js',
      codeUrl: '/build.wasm',
      productName: 'strategy',
    });
    assert.match(html, /width="800"/);
    assert.match(html, /height="450"/);
    assert.match(html, /build\.loader\.js/);
    assert.match(html, /createUnityInstance/);
  });
});
