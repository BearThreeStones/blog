import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { getGamePreviewUrl, getGamePreviewFilePath } from './preview.mjs';

describe('getGamePreviewUrl', () => {
  test('returns preview URL under games root', () => {
    assert.equal(getGamePreviewUrl('strategy'), '/games/strategy/Build/preview.webp');
  });

  test('handles nested game paths', () => {
    assert.equal(getGamePreviewUrl('demos/foo'), '/games/demos/foo/Build/preview.webp');
  });
});

describe('getGamePreviewFilePath', () => {
  test('joins games root with slug and preview filename', () => {
    const path = getGamePreviewFilePath('/repo/docs/.vuepress/public/games', 'strategy');
    assert.match(path, /strategy[\\/]Build[\\/]preview\.webp$/);
  });
});
