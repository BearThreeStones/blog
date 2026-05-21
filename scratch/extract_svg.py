import re

with open(r'E:\Dev\Unity Text Styles\. Type Scale.svg', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all unique fill colors
fills = set(re.findall(r'fill="(#[0-9A-Fa-f]+)"', content))
print('Colors found:', fills)

# Find rects (background panels)
rects = re.findall(r'<rect[^/>]*/?>', content)
for r in rects[:10]:
    print('Rect:', r)

# Find text elements  
texts = re.findall(r'<text[^>]*>(.*?)</text>', content)
print('Text elements:', len(texts))
for t in texts[:20]:
    print('  Text:', t[:100])

# Find tspan elements with font info
tspans = re.findall(r'<tspan[^>]*>([^<]*)</tspan>', content)
print('\nTspan count:', len(tspans))
for t in tspans[:30]:
    if t.strip():
        print('  Tspan:', t[:100])

# Look for font-size info
font_sizes = re.findall(r'font-size[=:]["\']*(\d+)', content)
print('\nFont sizes:', set(font_sizes))

# Look for image references
images = re.findall(r'<image[^>]*href="([^"]*)"', content)
print('\nImages:', len(images))
for img in images[:5]:
    print('  Image:', img[:100])
