import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HERO_STAGGER_MS,
  CARD_STAGGER_MS,
  getHeroDelayMs,
  getCardRevealDelayMs,
} from './classic-motion-presets.mjs';

describe('classic-motion-presets', () => {
  test('hero delays follow title → tagline → actions order', () => {
    assert.equal(getHeroDelayMs('title', false), 0);
    assert.equal(getHeroDelayMs('tagline', false), HERO_STAGGER_MS);
    assert.equal(getHeroDelayMs('actions', false), HERO_STAGGER_MS * 2);
  });

  test('hero delays are zero when reduced motion is enabled', () => {
    assert.equal(getHeroDelayMs('actions', true), 0);
  });

  test('card reveal delay scales by index unless reduced motion', () => {
    assert.equal(getCardRevealDelayMs(0, false), 0);
    assert.equal(getCardRevealDelayMs(3, false), CARD_STAGGER_MS * 3);
    assert.equal(getCardRevealDelayMs(3, true), 0);
  });
});
