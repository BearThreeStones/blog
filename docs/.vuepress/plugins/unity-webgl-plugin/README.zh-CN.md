# 适用于 VuePress 的 Unity WebGL 插件

一个 VuePress 插件，通过类似图片的简洁语法在 Markdown 中嵌入 Unity WebGL 游戏。

## 功能

- 🎮 **简单语法**：使用 `![game](path)` 嵌入 Unity 游戏
- 📦 **支持 Unity 2022 与 Unity 6**：兼容现代 Unity WebGL 构建
- ⚡ **点击加载**：手动触发以提升性能
- 📊 **进度跟踪**：加载过程中显示可视化进度条
- 🖥️ **全屏支持**：内置全屏按钮
- 🎨 **可定制**：可通过查询参数设置宽高与颜色
- 📱 **移动端适配**：在移动设备显示提示
- 🛡️ **错误处理**：缺失构建时优雅降级
- 🎯 **多游戏支持**：同一页面可嵌入多个游戏

## 安装

该插件已安装在你的 VuePress 项目中，并在 `docs/.vuepress/config.ts` 中注册。

## 用法

### 基本语法

在 Markdown 中嵌入 Unity 游戏：

```markdown
![game](test-game)
```

该插件会在 `/games/test-game/Build/` 下查找游戏（文件应放在 `docs/.vuepress/public/games/` 目录内）。

插件同时支持自定义导出名（例如 `test-game.loader.js`）以及 Unity 的默认导出命名（例如 `Build/build.loader.js`）。

### 自定义尺寸

```markdown
![game](test-game?width=1024&height=768)
```

### 全部选项

```markdown
![game](test-game?width=800&height=600&fullscreen=true&primaryColor=#667eea&backgroundColor=#000000)
```

### 标准 Unity 导出（`build.*` + `.gz`）

```markdown
![game](solid)
```

这适用于 Unity 的默认 WebGL 导出文件，例如 `Build/build.loader.js`、`Build/build.data.gz`、`Build/build.framework.js.gz` 和 `Build/build.wasm.gz`。

### 多游戏

```markdown
## Game 1
![game](game1)

## Game 2
![game](game2?width=640&height=480)
```

## 配置选项

所有选项通过 markdown 语法中的查询参数传入。

| 参数 | 类型 | 默认 | 范围/格式 | 说明 |
|------|------|------|-----------|------|
| `width` | number | 800 | 200-4096 | 游戏容器宽度（像素） |
| `height` | number | 450 | 200-4096 | 游戏容器高度（像素） |
| `fullscreen` | boolean | true | true/false | 是否显示全屏按钮 |
| `primaryColor` | string | - | #RRGGBB | UI 主题色（十六进制） |
| `backgroundColor` | string | #231F20 | #RRGGBB | 画布背景颜色 |

**注意**：未知参数将被静默忽略（严格白名单）。

## Unity 构建结构

将 Unity WebGL 构建放到 `docs/.vuepress/public/games/`，结构示例：

```text
docs/.vuepress/public/games/
└── your-game/
    └── Build/
    ├── your-game.loader.js
    ├── your-game.framework.js
    ├── your-game.data
    └── your-game.wasm
```

Unity 的默认导出命名也受支持：

```text
docs/.vuepress/public/games/
└── your-game/
  └── Build/
    ├── build.loader.js
    ├── build.framework.js.gz
    ├── build.data.gz
    └── build.wasm.gz
```

### 支持的结构（按尝试顺序）

1. **命名的 Build 目录**：`/games/{name}/Build/{name}.loader.js`
2. **Unity 默认的 Build 目录**：`/games/{name}/Build/build.loader.js`
3. **命名的平铺导出**：`/games/{name}/{name}.loader.js`
4. **Unity 默认的平铺导出**：`/games/{name}/build.loader.js`

### 构建要求

- **Unity 2022.x** 或 **Unity 6** WebGL 构建
- 支持的基本文件名为 `{game-name}` 或 Unity 的默认 `build`
- 资源文件可以为未压缩或使用 `.gz` / `.br` 后缀的压缩文件
- 压缩资源必须由服务端使用匹配的 `Content-Encoding` 头进行正确响应

## 工作原理

### 构建阶段（VuePress）

1. Markdown 文件由 `markdown-it` 处理
2. 插件在图片解析器之前拦截 `![game](path)` 语法
3. 解析路径并验证查询参数
4. 转换为 Vue 组件：`<UnityPlayer :game-path="..." :width="..." />`
5. 使用 `<ClientOnly>` 包裹以避免 SSR（服务端渲染）问题

### 运行时（浏览器）

1. 组件渲染并显示“Load Game”按钮
2. 用户点击 → 若在移动设备上显示免责声明
3. 切换到 `LOADING` 状态
4. 动态加载 Unity loader 脚本
5. 调用 `createUnityInstance()` 并进行进度跟踪
6. 显示进度条（0-100%）
7. 成功后 → 切换到 `LOADED` 状态并显示交互画布
8. 出错时 → 切换到 `ERROR` 状态并显示重试按钮

## 组件状态

| 状态 | 用户看到的内容 |
|------|----------------|
| **INITIAL** | 显示 “Load Game” 按钮 + 游戏名称 +（移动端时）移动提示 |
| **LOADING** | 带百分比的进度条（0-100%） |
| **LOADED** | 可交互的 Unity 画布 + （若启用）全屏按钮 |
| **ERROR** | 错误信息 + 故障排查提示 + 重试按钮 |

## 示例

### 响应式游戏

```markdown
<!-- 缩小到移动端，保持宽高比 -->
![game](my-game?width=1920&height=1080)
```

### 自定义主题游戏

```markdown
<!-- 紫色主题，深色背景 -->
![game](my-game?primaryColor=#667eea&backgroundColor=#1a1a2e)
```

### 禁用全屏

```markdown
<!-- 不显示全屏按钮 -->
![game](my-game?fullscreen=false)
```

### 竖屏布局

```markdown
<!-- 面向移动端的高画面 -->
![game](mobile-game?width=480&height=854)
```

## 故障排查

### 错误：“Game build not found”

**症状**：点击“Load Game”后出现错误信息

**解决办法**：
1. 检查文件结构：`docs/.vuepress/public/games/{name}/Build/`
2. 确认 loader 文件名为 `{name}.loader.js` 或 Unity 默认的 `build.loader.js`
3. 确认文件位于 `public` 目录（不是 `docs` 或 `.vuepress`）
4. 查看浏览器控制台中请求的具体路径
5. 同时尝试 `{name}/Build/` 与 `{name}/` 两种结构

### 错误：“Failed to initialize Unity”

**症状**：进度条达到 100% 但游戏未能运行

**解决办法**：
1. 查看浏览器控制台获取 Unity 的详细错误信息
2. 确认所有 Unity 构建文件存在（`.data`、`.framework.js`、`.wasm`）或相应的压缩变体（`.data.gz`、`.framework.js.gz`、`.wasm.gz`）
3. 确认构建目标为 WebGL（而非其他平台）
4. 若使用 CDN，检查是否存在 CORS 问题
5. 重新导出 Unity 项目并尝试最新的导出设置

### 进度条卡住

**症状**：加载进度停滞在某个百分比

**解决办法**：
1. 查看网络面板中是否有失败的请求
2. 确认文件扩展名与 Unity 构建类型匹配
3. 检查压缩（`.gz` / `.br`）相关问题
4. 确认服务器磁盘空间与缓存设置
5. 清除浏览器缓存并重试

### 移动端：游戏无法运行

**症状**：黑屏或控制无效

**说明**：Unity WebGL 在移动端支持有限（Unity 自身限制）

**解决办法**：
1. 这属于已知的 Unity 限制（非插件问题）
2. 在移动设备上会显示警告横幅
3. 考虑为移动端构建单独的优化版本
4. 导出时使用 Unity 的“Mobile”模板
5. 在真实设备上测试，不依赖模拟器或开发者工具

### 多游戏冲突

**症状**：第二个游戏加载失败或破坏第一个游戏

**解决办法**：
1. 该功能应当可用（已做命名空间隔离的测试）
2. 查看浏览器控制台中的 JavaScript 错误
3. 确保每个游戏的名称/路径唯一
4. 确认每个 loader 脚本都成功加载
5. 若问题持续，请提供详细信息反馈

### 生产构建：出现 404 错误

**症状**：开发模式下可用，但 `build` 后出现 404

**解决办法**：
1. 确认 `public` 目录位置正确
2. 检查 `dist` 文件夹下是否存在 `dist/games/{name}/`
3. 确认 VuePress 的 `base` 配置正确
4. 使用本地 HTTP 服务测试，而非 `file://` 协议
5. 注意 Windows 与 Linux 的大小写差异

## 限制

- **移动端支持有限**：Unity WebGL 在移动浏览器上的表现不稳定（Unity 限制）
- **文件体积大**：Unity 构建通常较大（50-200MB），会影响加载时间
- **浏览器支持**：需要支持 WebAssembly 的现代浏览器
- **不自动播放**：出于性能考虑，游戏仅在用户交互后加载
- **不保持状态**：页面导航后游戏状态不会持久保存
- **单页仅支持单一 Unity 版本**：同一页面无法混合使用 Unity 2022 与 Unity 6（可能存在命名空间冲突）

## 高级

### 文件结构

```text
docs/.vuepress/plugins/unity-webgl-plugin/
├── index.ts              # Plugin entry point
├── client.ts             # Client-side registration
├── types.ts              # TypeScript interfaces
├── markdown/
│   └── unityRule.ts      # Markdown-it parsing logic
└── components/
    └── UnityPlayer.vue   # Vue component
```

### 添加到已有项目

如果想把该插件加入到其他 VuePress 项目中：

1. 将 `unity-webgl-plugin` 目录复制到 `docs/.vuepress/plugins/`
2. 在 `config.ts` 中注册：

```typescript
import { unityWebGLPlugin } from "./plugins/unity-webgl-plugin/index.js";

export default defineUserConfig({
  plugins: [
    unityWebGLPlugin(),
  ],
});
```

3. 创建 `docs/.vuepress/public/games/` 目录
4. 添加你的 Unity WebGL 构建文件

### 自定义样式

组件使用了作用域（scoped）的 CSS。要覆盖样式，请在全局 CSS 中添加：

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

## 测试

测试页面位于 `/test-unity.html`，包含多个示例嵌入，演示所有功能。

当前本地测试夹具包括：
- `/games/test-game/` - 未压缩命名测试夹具
- `/games/solid/` - 使用 `build.*` 且带 gzip 的标准导出

## 支持

如需帮助或反馈：

1. 先查看本 README 的故障排查部分
2. 确保 Unity 构建在独立环境下可以运行（测试 Unity 导出的 `index.html`）
3. 查看浏览器控制台以获取详细错误信息
4. 确认使用的是 Unity 2022 或 Unity 6 WebGL 构建

## 许可证

该插件是 VuePress 博客项目的一部分。

---

**快速上手清单**：
- [ ] 将 Unity WebGL 构建放入 `docs/.vuepress/public/games/your-game/Build/`
- [ ] 确认存在 loader 文件：`your-game.loader.js` 或 `build.loader.js`
- [ ] 在 Markdown 中添加：`![game](your-game)`
- [ ] 运行 `npm run docs:dev` 进行测试
- [ ] 在浏览器中点击 “Load Game” 按钮
- [ ] 验证游戏能否成功加载并运行
