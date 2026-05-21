import { readFileSync } from 'fs';

const content = readFileSync('E:\\Dev\\Unity Text Styles\\. Type Scale.svg', 'utf-8');

// Find all unique fill colors
const fills = new Set(content.match(/fill="(#[0-9A-Fa-f]+)"/g) || []);
console.log('Colors found:', [...fills]);

// Check for image/pattern references
const images = content.match(/<image[^>]*href="([^"]*)"[^>]*/g) || [];
console.log('\nImages:', images.length);
images.slice(0, 5).forEach(img => console.log('  Image:', img.slice(0, 200)));

// Check for filter/defs
const filters = content.match(/<filter[^>]*id="([^"]*)"/g) || [];
console.log('\nFilters:', filters);

// Check for clip-paths
const clips = content.match(/<clipPath[^>]*id="([^"]*)"/g) || [];
console.log('\nClips:', clips);

// Look for embedded raster images (base64)
const base64 = content.match(/xlink:href="data:image[^"]{0,50}/g) || [];
console.log('\nBase64 images:', base64.length);
base64.slice(0, 3).forEach(b => console.log('  ', b));

// Count path elements by fill color
const paths = content.match(/<path[^>]*fill="([^"]*)"[^>]*\/>/g) || [];
const pathsByColor = {};
paths.forEach(p => {
    const m = p.match(/fill="([^"]*)"/);
    if (m) {
        pathsByColor[m[1]] = (pathsByColor[m[1]] || 0) + 1;
    }
});
console.log('\nPaths by color:', pathsByColor);

// Find rect elements
const rects = content.match(/<rect[^>]*>/g) || [];
console.log('\nRects:', rects.length);
rects.forEach(r => console.log('  ', r.slice(0, 200)));
