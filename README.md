# Feed2AI

A browser extension that helps you extract and clean web content for feeding to AI assistants.

## Features

- **Visual Selection Mode**: Click the extension icon to enter selection mode
- **Smart Content Extraction**: Extract HTML content from selected areas
- **Content Cleaning**: Uses [Mozilla Readability](https://github.com/mozilla/readability) to parse and clean content
- **One-Click Copy**: Automatically copies cleaned content to clipboard

## Tech Stack

- [WXT](https://wxt.dev/) - Next-gen Web Extension Framework
- React 19 + TypeScript
- [Mozilla Readability](https://github.com/mozilla/readability)

## Usage

1. Click the Feed2AI extension icon
2. Hover and click on the content area you want to extract
3. Content is cleaned and copied to clipboard
4. Paste into your favorite AI assistant

## Development

```bash
pnpm install      # Install dependencies
pnpm dev          # Dev mode (Chrome)
pnpm dev:firefox  # Dev mode (Firefox)
pnpm build        # Production build
pnpm zip          # Package for distribution
```

## Project Structure

```
feed2ai/
├── entrypoints/
│   ├── background.ts      # Background service worker
│   ├── content.ts         # Content script
│   └── popup/             # Popup UI (React)
├── wxt.config.ts
└── package.json
```

## License

MIT

---

# Feed2AI (中文)

一个浏览器扩展，帮助你提取和清理网页内容，以便喂给 AI 助手。

## 功能特性

- **可视化选择模式**：点击扩展图标进入选择模式
- **智能内容提取**：从选定区域提取 HTML 内容
- **内容清理**：使用 [Mozilla Readability](https://github.com/mozilla/readability) 解析和清理内容，去除 HTML 标签和样式
- **一键复制**：自动将清理后的内容复制到剪贴板

## 使用方法

1. 点击浏览器工具栏中的 Feed2AI 扩展图标
2. 页面进入选择模式，悬停并点击要提取的内容区域
3. 内容自动清理并复制到剪贴板
4. 粘贴到你喜欢的 AI 助手中使用（ChatGPT、Claude 等）

## 开发

```bash
pnpm install      # 安装依赖
pnpm dev          # 开发模式 (Chrome)
pnpm dev:firefox  # 开发模式 (Firefox)
pnpm build        # 生产构建
pnpm zip          # 打包发布
```
