# Feed2AI

[English](./README.md)

一个浏览器扩展，帮助你提取和清理网页内容，以便喂给 AI 助手。

## 功能特性

- **可视化选择模式**：点击扩展图标进入选择模式
- **智能内容提取**：从选定区域提取 HTML 内容
- **多选支持**：使用键盘修饰键选择多个元素
- **范围选择**：使用 Shift+点击 选择一系列元素
- **内容清理**：使用 [Mozilla Readability](https://github.com/mozilla/readability) 解析和清理内容，去除 HTML 标签和样式
- **一键复制**：自动将清理后的内容复制到剪贴板

## 技术栈

- [WXT](https://wxt.dev/) - 新一代浏览器扩展框架
- React 19 + TypeScript
- [Mozilla Readability](https://github.com/mozilla/readability)

## 使用方法

1. 点击浏览器工具栏中的 Feed2AI 扩展图标进入选择模式
2. 使用以下方式选择内容：

### 选择方式

| 操作 | 说明 |
|------|------|
| **点击** | 选择单个元素，立即提取并复制 |
| **Cmd/Ctrl + 点击** | 切换元素选中状态（添加/移除） |
| **Shift + 点击** | 设置范围起点 |
| **Shift + 点击**（再次） | 选择范围内所有元素 |

### 快捷键

| 按键 | 功能 |
|------|------|
| **Enter** | 复制所有选中内容到剪贴板 |
| **ESC** | 取消选择并退出选择模式 |

3. 将清理后的内容粘贴到你喜欢的 AI 助手中使用（ChatGPT、Claude 等）

## 开发

```bash
pnpm install      # 安装依赖
pnpm dev          # 开发模式 (Chrome)
pnpm dev:firefox  # 开发模式 (Firefox)
pnpm build        # 生产构建
pnpm zip          # 打包发布
```

## 项目结构

```
feed2ai/
├── entrypoints/
│   ├── background.ts      # 后台服务
│   ├── content.ts         # 内容脚本
│   └── popup/             # 弹出界面 (React)
├── wxt.config.ts
└── package.json
```

## 许可证

MIT
