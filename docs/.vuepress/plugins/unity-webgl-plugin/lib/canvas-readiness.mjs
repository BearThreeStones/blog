const DEFAULT_OPTIONS = {
  regionRatio: 0.5,
  brightnessThreshold: 30,
  readyRatio: 0.05,
};

/**
 * @param {Uint8ClampedArray} pixels RGBA row-major
 * @param {number} width
 * @param {number} height
 * @param {Partial<typeof DEFAULT_OPTIONS>} [options]
 * @returns {boolean}
 */
export function isCanvasRegionReady(pixels, width, height, options = {}) {
  const { regionRatio, brightnessThreshold, readyRatio } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const regionW = Math.max(1, Math.floor(width * regionRatio));
  const regionH = Math.max(1, Math.floor(height * regionRatio));
  const x0 = Math.floor((width - regionW) / 2);
  const y0 = Math.floor((height - regionH) / 2);

  let bright = 0;
  let total = 0;

  for (let y = y0; y < y0 + regionH; y += 1) {
    for (let x = x0; x < x0 + regionW; x += 1) {
      const i = (y * width + x) * 4;
      const sum = pixels[i] + pixels[i + 1] + pixels[i + 2];
      if (sum > brightnessThreshold) {
        bright += 1;
      }
      total += 1;
    }
  }

  return bright / total >= readyRatio;
}
