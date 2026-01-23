# open-vui

Vue Adapter for [OpenTUI](https://github.com/anomalyco/opentui).

Adapted from the [Solid Adapter](https://github.com/anomalyco/opentui/tree/main/packages/solid).

> WIP
> This is a work in progress, some features may not work as expected.

See the [OpenTUI Docs](https://github.com/anomalyco/opentui/blob/main/packages/core/docs/getting-started.md) for more details.

## Installation

```bash
bun install open-vui
```

## Usage

1. Add preload script to `bunfig.toml` (enables `.vue` imports):

```toml
preload = ["open-vui/preload"]
```

2. Create an `App.vue` file with a Vue SFC using OpenTUI tags:

```vue
<template>
  <box border :style="{ width: 30, height: 7 }">
    <text>Hello from Vue</text>
  </box>
</template>
```

3. Render it:

```ts
import { render } from "open-vui";
import App from "./App.vue";

await render(App);
```

4. Run with `bun index.ts`.

## Notes

- Visible text must be inside a `<text>` element. (Whitespace-only nodes between elements are ignored.)

## Table of Contents

- [Core Concepts](#core-concepts)
  - [Components](#components)
- [API Reference](#api-reference)
  - [render(node, rendererOrConfig?)](#rendernode-rendererorconfig)
  - [testRender(node, options?)](#testrendernode-options)
  - [extend(components)](#extendcomponents)
  - [getComponentCatalogue()](#getcomponentcatalogue)
  - [Hooks](#hooks)
  - [Portal](#portal)
  - [Dynamic](#dynamic)
- [Components](#components-1)
  - [Layout & Display](#layout--display)
  - [Input](#input)
  - [Code & Diff](#code--diff)
  - [Text Modifiers](#text-modifiers)

## Core Concepts

### Components

open-vui exposes Vue template elements that map to OpenTUI renderables:

See the [OpenTUI Components](https://github.com/anomalyco/opentui/blob/main/packages/core/docs/getting-started.md) documentation for more details.

- **Layout & Display:** `text`, `box`, `scrollbox`, `ascii_font`
- **Input:** `input`, `textarea`, `select`, `tab_select`
- **Code & Diff:** `code`, `line_number`, `diff`
- **Text Modifiers:** `span`, `strong`, `b`, `em`, `i`, `u`, `br`, `a`

## API Reference

### `render(node, rendererOrConfig?)`

Render a Vue component tree into a CLI renderer. If `rendererOrConfig` is omitted, a renderer is created with default options.

**Parameters:**

- `node`: Vue component.
- `rendererOrConfig?`: `CliRenderer` instance or `CliRendererConfig`.

### `testRender(node, options?)`

Create a test renderer for snapshots and interaction tests.

Create a test renderer for snapshots and interaction tests.

### `extend(components)`

Register custom renderables as template elements.

`extend({ customBox: CustomBoxRenderable })`

### `getComponentCatalogue()`

Returns the current component catalogue that powers JSX tag lookup.

### Hooks

- `useRenderer()`
- `onResize(callback)`
- `useTerminalDimensions()`
- `useKeyboard(handler, options?)`
- `usePaste(handler)`
- `useSelectionHandler(handler)`
- `useTimeline(options?)`

## Components

### Layout & Display

- `text`: styled text container
- `box`: layout container with borders, padding, and flex settings
- `scrollbox`: scrollable container
- `ascii_font`: ASCII art text renderer

### Input

- `input`: single-line text input
- `textarea`: multi-line text input
- `select`: list selection
- `tab_select`: tab-based selection

### Code & Diff

- `code`: syntax-highlighted code blocks
- `line_number`: line-numbered code display with diff/diagnostic helpers
- `diff`: unified or split diff viewer

### Text Modifiers

These must appear inside a `text` component:

- `span`: inline styled text
- `strong`/`b`: bold text
- `em`/`i`: italic text
- `u`: underline text
- `br`: line break
- `a`: link text with `href`
