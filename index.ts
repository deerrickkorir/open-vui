import {
  CliRenderer,
  createCliRenderer,
  engine,
  type CliRendererConfig,
} from "@opentui/core";
import {
  createTestRenderer,
  type TestRendererOptions,
} from "@opentui/core/testing";
import type { App as VueApp, Component } from "@vue/runtime-core";
import { RendererKey } from "./src/elements";
import { createOpenVuiRenderer } from "./src/renderer";

export const render = async (
  rootComponent: Component,
  rendererOrConfig: CliRenderer | CliRendererConfig = {}
): Promise<void> => {
  let app: VueApp | null = null;
  let isDisposed = false;

  const renderer =
    rendererOrConfig instanceof CliRenderer
      ? rendererOrConfig
      : await createCliRenderer({
          ...rendererOrConfig,
          onDestroy: () => {
            if (!isDisposed) {
              isDisposed = true;
              app?.unmount();
            }
            rendererOrConfig.onDestroy?.();
          },
        });

  if (rendererOrConfig instanceof CliRenderer) {
    renderer.on("destroy", () => {
      if (!isDisposed) {
        isDisposed = true;
        app?.unmount();
      }
    });
  }

  engine.attach(renderer);

  // The OpenTUI renderer only runs its render loop when explicitly started
  // (or when a timeline requests live rendering). For the common case where a
  // UI is mostly event-driven (keyboard/mouse) and has no active timelines,
  // we start the renderer and keep the process alive until it is destroyed.
  if (!renderer.isRunning) {
    renderer.start();
  }

  const { createApp } = createOpenVuiRenderer(renderer);
  app = createApp(rootComponent);
  app.provide(RendererKey, renderer);
  app.mount(renderer.root);

  await new Promise<void>((resolve) => {
    if (renderer.isDestroyed) return resolve();
    renderer.once("destroy", () => resolve());
  });
};

export const testRender = async (
  rootComponent: Component,
  renderConfig: TestRendererOptions = {}
) => {
  let app: VueApp | null = null;
  let isDisposed = false;

  const testSetup = await createTestRenderer({
    ...renderConfig,
    onDestroy: () => {
      if (!isDisposed) {
        isDisposed = true;
        app?.unmount();
      }
      renderConfig.onDestroy?.();
    },
  });

  engine.attach(testSetup.renderer);

  const { createApp } = createOpenVuiRenderer(testSetup.renderer);
  app = createApp(rootComponent);
  app.provide(RendererKey, testSetup.renderer);
  app.mount(testSetup.renderer.root);

  return testSetup;
};

export * from "./src/elements";
export * from "./src/types/elements";
