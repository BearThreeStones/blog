import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { isCanvasRegionReady } from './canvas-readiness.mjs';

function fillRegion(data, width, x0, y0, w, h, r, g, b) {
  for (let y = y0; y < y0 + h; y += 1) {
    for (let x = x0; x < x0 + w; x += 1) {
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
}

describe('isCanvasRegionReady', () => {
  test('returns false when center region is entirely black', () => {
    const width = 100;
    const height = 100;
    const data = new Uint8ClampedArray(width * height * 4);
    assert.equal(isCanvasRegionReady(data, width, height), false);
  });

  test('returns true when enough center pixels exceed brightness threshold', () => {
    const width = 100;
    const height = 100;
    const data = new Uint8ClampedArray(width * height * 4);
    fillRegion(data, width, 40, 40, 20, 20, 200, 200, 200);
    assert.equal(isCanvasRegionReady(data, width, height), true);
  });

  test('returns false when only a few scattered pixels are bright', () => {
    const width = 100;
    const height = 100;
    const data = new Uint8ClampedArray(width * height * 4);
    data[((50 * width) + 50) * 4] = 255;
    assert.equal(isCanvasRegionReady(data, width, height), false);
  });
});
