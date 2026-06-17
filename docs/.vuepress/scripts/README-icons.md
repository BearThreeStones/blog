# Unity icon sync

Icons are copied from **Unity Editor Icon Library (Community)** (Figma Community) into `docs/.vuepress/public/assets/icon/unity/`.

```bash
npm run build:icons
```

Override the source folder:

```bash
UNITY_ICON_LIBRARY="D:/path/to/Unity Editor Icon Library (Community)" npm run build:icons
```

Mappings live in [`../icon-manifest.json`](../icon-manifest.json). After changing the library or manifest, run `build:icons` and commit the updated PNGs so CI does not require the external folder.
