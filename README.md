# Feed2AI

[中文文档](./README.zh-CN.md)

A browser extension that helps you extract and clean web content for feeding to AI assistants.

## Features

- **Visual Selection Mode**: Click the extension icon to enter selection mode
- **Smart Content Extraction**: Extract HTML content from selected areas
- **Multi-Select Support**: Select multiple elements with keyboard modifiers
- **Range Selection**: Select a range of elements with Shift+click
- **Content Cleaning**: Uses [Mozilla Readability](https://github.com/mozilla/readability) to parse and clean content
- **One-Click Copy**: Automatically copies cleaned content to clipboard

## Tech Stack

- [WXT](https://wxt.dev/) - Next-gen Web Extension Framework
- React 19 + TypeScript
- [Mozilla Readability](https://github.com/mozilla/readability)

## Usage

1. Click the Feed2AI extension icon to enter selection mode
2. Select content using one of the following methods:

### Selection Methods

| Action | Description |
|--------|-------------|
| **Click** | Select single element, extract and copy immediately |
| **Cmd/Ctrl + Click** | Toggle element selection (add/remove from selection) |
| **Shift + Click** | Set range start point |
| **Shift + Click** (again) | Select all elements in range |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Enter** | Copy all selected content to clipboard |
| **ESC** | Cancel selection and exit selection mode |

3. Paste the cleaned content into your favorite AI assistant (ChatGPT, Claude, etc.)

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
