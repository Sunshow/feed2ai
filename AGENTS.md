# AGENTS.md

Guidance for AI coding agents working on this project.

## Project Overview

Feed2AI is a WXT + React browser extension for extracting clean web content to feed AI assistants.

## Tech Stack

- **Framework**: WXT (https://wxt.dev/)
- **UI**: React 19 + TypeScript
- **Content Parsing**: Mozilla Readability
- **Package Manager**: pnpm

## Architecture

- `entrypoints/background.ts` - Background service worker
- `entrypoints/content.ts` - Content script for DOM selection
- `entrypoints/popup/` - React popup UI

## Core Workflow

1. User clicks extension → triggers selection mode
2. Content script adds hover highlighting
3. User clicks element → extract HTML
4. Process through Readability → clean text
5. Copy to clipboard

## Development

```bash
pnpm compile    # Type check
pnpm dev        # Dev with HMR
pnpm build      # Production build
```

## Conventions

- Use `defineBackground()` / `defineContentScript()` for entry points
- TypeScript strict mode
- React functional components with hooks
