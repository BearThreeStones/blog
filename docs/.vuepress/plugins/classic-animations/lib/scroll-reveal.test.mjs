import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CLASSIC_ARTICLE_SELECTOR,
  shouldBindScrollReveal,
  collectUnrevealedArticles,
} from './scroll-reveal.mjs';

describe('scroll-reveal', () => {
  test('shouldBindScrollReveal is true only on classic home with animations class', () => {
    assert.equal(shouldBindScrollReveal('/classic/', true), true);
    assert.equal(shouldBindScrollReveal('/en/classic/', true), true);
    assert.equal(shouldBindScrollReveal('/classic/', false), false);
    assert.equal(shouldBindScrollReveal('/posts/foo/', true), false);
  });

  test('collectUnrevealedArticles skips items already marked revealed', () => {
    const root = {
      querySelectorAll(selector) {
        assert.equal(selector, CLASSIC_ARTICLE_SELECTOR);
        return [
          { classList: { contains: () => false }, style: {} },
          { classList: { contains: () => true }, style: {} },
        ];
      },
    };

    const items = collectUnrevealedArticles(root);
    assert.equal(items.length, 1);
  });
});
