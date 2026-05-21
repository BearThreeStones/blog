# Unity WebGL Plugin for VuePress

A VuePress plugin that enables embedding Unity WebGL games in markdown using simple image-like syntax.

## Features

- 🎮 **Simple Syntax**: Use `![game](path)` to embed Unity games
- 📦 **Unity 2022 & Unity 6 Support**: Works with modern Unity WebGL builds
- ⚡ **Click-to-Play Loading**: Manual trigger for better performance
- 📊 **Progress Tracking**: Visual progress bar during game loading
- 🖥️ **Fullscreen Support**: Built-in fullscreen button
- 🎨 **Customizable**: Width, height, colors via query parameters
- 📱 **Mobile-Aware**: Shows disclaimer for mobile devices
- 🛡️ **Error Handling**: Graceful failure for missing builds
- 🎯 **Multi-Game Support**: Multiple games on a single page

## Installation

The plugin is already installed in your VuePress project. It's registered in `docs/.vuepress/config.ts`.

## Usage

### Basic Syntax

Embed a Unity game in your markdown:

```markdown
![game](test-game)
```

This will look for the game at `/games/test-game/Build/` (files served from `docs/.vuepress/public/games/`).

The plugin supports both custom-named exports like `test-game.loader.js` and Unity's default export naming like `Build/build.loader.js`.

### Custom Dimensions

```markdown
![game](test-game?width=1024&height=768)
```

### All Options

```markdown
![game](test-game?width=800&height=600&fullscreen=true&primaryColor=#667eea&backgroundColor=#000000)
```

### Standard Unity Export (`build.*` + `.gz`)

```markdown
![game](solid)
```

This works with Unity's default WebGL export files such as `Build/build.loader.js`, `Build/build.data.gz`, `Build/build.framework.js.gz`, and `Build/build.wasm.gz`.

### Multiple Games

```markdown
## Game 1
![game](game1)

## Game 2
![game](game2?width=640&height=480)
```

## Configuration Options

All options are passed as query parameters in the markdown syntax.

| Parameter | Type | Default | Range/Format | Description |
|-----------|------|---------|--------------|-------------|
| `width` | number | 800 | 200-4096 | Game container width in pixels |
| `height` | number | 450 | 200-4096 | Game container height in pixels |
| `fullscreen` | boolean | true | true/false | Show fullscreen button |
| `primaryColor` | string | - | #RRGGBB | UI accent color (hex format) |
| `backgroundColor` | string | #231F20 | #RRGGBB | Canvas background color |

**Note**: Unknown parameters are silently ignored (strict whitelist).

## Unity Build Structure

Place your Unity WebGL builds in `docs/.vuepress/public/games/` with this structure:

```
docs/.vuepress/public/games/
└── your-game/
    └── Build/
    ├── your-game.loader.js
    ├── your-game.framework.js
    ├── your-game.data
    └── your-game.wasm
```

Unity's default export naming is also supported:

```
docs/.vuepress/public/games/
└── your-game/
  └── Build/
    ├── build.loader.js
    ├── build.framework.js.gz
    ├── build.data.gz
    └── build.wasm.gz
```

### Supported Structures

The plugin tries these paths in order:

1. **Named Build Directory**: `/games/{name}/Build/{name}.loader.js`
2. **Unity Default Build Directory**: `/games/{name}/Build/build.loader.js`
3. **Named Flat Export**: `/games/{name}/{name}.loader.js`
4. **Unity Default Flat Export**: `/games/{name}/build.loader.js`

### Build Requirements

- **Unity 2022.x** or **Unity 6** WebGL build
- Supported base names are `{game-name}` and Unity's default `build`
- Asset files may be uncompressed or use `.gz` / `.br` suffixes
- Compressed assets must be served with matching `Content-Encoding` headers

## How It Works

### Build Time (VuePress)

1. Markdown file is processed by markdown-it
2. Plugin intercepts `![game](path)` syntax before image parser
3. Parses path and validates query parameters
4. Transforms to Vue component: `<UnityPlayer :game-path="..." :width="..." />`
5. Wraps in `<ClientOnly>` to prevent SSR issues

### Runtime (Browser)

1. Component renders with "Load Game" button
2. User clicks → Shows mobile disclaimer if on mobile
3. Transitions to LOADING state
4. Dynamically loads Unity loader script
5. Calls `createUnityInstance()` with progress tracking
6. Shows progress bar (0-100%)
7. On success → LOADED state with interactive canvas
8. On error → ERROR state with message and retry button

## Component States

| State | What User Sees |
|-------|----------------|
| **INITIAL** | "Load Game" button + game name + mobile warning (if mobile) |
| **LOADING** | Progress bar with percentage (0-100%) |
| **LOADED** | Interactive Unity canvas + fullscreen button (if enabled) |
| **ERROR** | Error message + troubleshooting hints + retry button |

## Examples

### Responsive Game

```markdown
<!-- Scales down on mobile, maintains aspect ratio -->
![game](my-game?width=1920&height=1080)
```

### Custom Themed Game

```markdown
<!-- Purple theme with dark background -->
![game](my-game?primaryColor=#667eea&backgroundColor=#1a1a2e)
```

### Fullscreen Disabled

```markdown
<!-- No fullscreen button -->
![game](my-game?fullscreen=false)
```

### Portrait Orientation

```markdown
<!-- Tall game for mobile -->
![game](mobile-game?width=480&height=854)
```

## Troubleshooting

### Error: "Game build not found"

**Symptoms**: Error message appears when clicking "Load Game"

**Solutions**:
1. Check file structure: `docs/.vuepress/public/games/{name}/Build/`
2. Ensure loader filename is either `{name}.loader.js` or Unity's default `build.loader.js`
3. Verify files are in `public` directory (not `docs` or `.vuepress`)
4. Check browser console for exact path being requested
5. Try both structures: `{name}/Build/` or `{name}/` flat

### Error: "Failed to initialize Unity"

**Symptoms**: Progress bar reaches 100% but game doesn't load

**Solutions**:
1. Check browser console for detailed Unity errors
2. Verify all Unity build files exist (`.data`, `.framework.js`, `.wasm`) or compressed variants (`.data.gz`, `.framework.js.gz`, `.wasm.gz`)
3. Ensure Unity build is for WebGL platform (not other platforms)
4. Check for CORS issues if using CDN
5. Try building Unity project again with latest export settings

### Progress Bar Stuck

**Symptoms**: Loading progress stops at some percentage

**Solutions**:
1. Check network tab for failed file requests
2. Verify file extensions match Unity build type
3. Check for compression issues (`.gz` or `.br` files)
4. Ensure adequate disk space and browser cache
5. Try clearing browser cache and reloading

### Mobile: Game Doesn't Work

**Symptoms**: Black screen or controls don't work on mobile

**Expected**: Unity WebGL has limited mobile support

**Solutions**:
1. This is a known Unity limitation (not a plugin issue)
2. Warning banner should appear on mobile devices
3. Consider building a separate mobile-optimized version
4. Use Unity's "Mobile" template when exporting
5. Test on actual devices, not just browser devtools

### Multiple Games Conflict

**Symptoms**: Second game fails to load or breaks first game

**Solutions**:
1. This should work (namespace isolation tested)
2. Check browser console for JavaScript errors
3. Ensure each game has unique name/path
4. Verify both loader scripts load successfully
5. Report issue if problem persists (with details)

### Production Build: 404 Errors

**Symptoms**: Games work in dev mode but not after `build`

**Solutions**:
1. Verify `public` directory is in correct location
2. Check dist folder: `dist/games/{name}/` should exist
3. Ensure VuePress base path is configured correctly
4. Test with local HTTP server, not file:// protocol
5. Check for case-sensitivity issues (Windows vs Linux)

## Limitations

- **Mobile Support**: Unity WebGL has spotty mobile browser support (Unity limitation)
- **File Size**: Unity builds are large (50-200MB), affects loading time
- **Browser Support**: Requires modern browser with WebAssembly support
- **No Auto-Play**: Games load only on user interaction (performance design choice)
- **No State Persistence**: Game state doesn't persist across page navigation
- **Single Unity Version Per Build**: Can't mix Unity 2022 and Unity 6 builds in one page (namespace conflict risk)

## Advanced

### File Structure

```
docs/.vuepress/plugins/unity-webgl-plugin/
├── index.ts              # Plugin entry point
├── client.ts             # Client-side registration
├── types.ts              # TypeScript interfaces
├── markdown/
│   └── unityRule.ts      # Markdown-it parsing logic
└── components/
    └── UnityPlayer.vue   # Vue component
```

### Adding to Existing Project

If you want to add this plugin to another VuePress project:

1. Copy the `unity-webgl-plugin` directory to `docs/.vuepress/plugins/`
2. Register in `config.ts`:

```typescript
import { unityWebGLPlugin } from "./plugins/unity-webgl-plugin/index.js";

export default defineUserConfig({
  plugins: [
    unityWebGLPlugin(),
  ],
});
```

3. Create `docs/.vuepress/public/games/` directory
4. Add your Unity WebGL builds

### Customizing Styles

The component uses scoped CSS. To override styles, add to your global CSS:

```css
/* Change load button color */
.unity-load-button {
  background: linear-gradient(135deg, #your-color1 0%, #your-color2 100%) !important;
}

/* Change progress bar color */
.unity-progress-bar {
  background: linear-gradient(90deg, #your-color1 0%, #your-color2 100%) !important;
}
```

## Testing

A test page is available at `/test-unity.html` with multiple game embeds demonstrating all features.

Current local test fixtures include:
- `/games/test-game/` - Renamed uncompressed test fixture
- `/games/solid/` - Standard Unity export using `build.*` and gzip assets

## Support

For issues or questions:

1. Check this README's Troubleshooting section
2. Verify your Unity build works standalone (test index.html from Unity export)
3. Check browser console for detailed error messages
4. Ensure you're using Unity 2022 or Unity 6 WebGL builds

## License

This plugin is part of the VuePress blog project.

---

**Quick Start Checklist**:
- [ ] Place Unity WebGL build in `docs/.vuepress/public/games/your-game/Build/`
- [ ] Verify loader file exists: `your-game.loader.js` or `build.loader.js`
- [ ] Add to markdown: `![game](your-game)`
- [ ] Run `npm run docs:dev` to test
- [ ] Click "Load Game" button in browser
- [ ] Verify game loads and runs correctly
