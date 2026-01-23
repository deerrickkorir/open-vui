import {
  engine,
  PasteEvent,
  Selection,
  Timeline,
  type CliRenderer,
  type KeyEvent,
  type TimelineOptions,
} from "@opentui/core"
import { inject, onMounted, onUnmounted, ref, type InjectionKey, type Ref } from "vue"

export const RendererKey: InjectionKey<CliRenderer> = Symbol("open-vui-renderer") as any

export const useRenderer = () => {
  const renderer = inject(RendererKey, null)

  if (!renderer) {
    throw new Error("No renderer found")
  }

  return renderer
}

export const onResize = (callback: (width: number, height: number) => void) => {
  const renderer = useRenderer()

  onMounted(() => {
    renderer.on("resize", callback)
  })

  onUnmounted(() => {
    renderer.off("resize", callback)
  })
}

export const useTerminalDimensions = (): Ref<{ width: number; height: number }> => {
  const renderer = useRenderer()
  const terminalDimensions = ref({ width: renderer.width, height: renderer.height })

  const callback = (width: number, height: number) => {
    terminalDimensions.value = { width, height }
  }

  onResize(callback)

  return terminalDimensions
}

export interface UseKeyboardOptions {
  /** Include release events - callback receives events with eventType: "release" */
  release?: boolean
}

/**
 * Subscribe to keyboard events.
 *
 * By default, only receives press events (including key repeats with `repeated: true`).
 * Use `options.release` to also receive release events.
 *
 * @example
 * // Basic press handling (includes repeats)
 * useKeyboard((e) => console.log(e.name, e.repeated ? "(repeat)" : ""))
 *
 * // With release events
 * useKeyboard((e) => {
 *   if (e.eventType === "release") keys.delete(e.name)
 *   else keys.add(e.name)
 * }, { release: true })
 */
export const useKeyboard = (callback: (key: KeyEvent) => void, options?: UseKeyboardOptions) => {
  const renderer = useRenderer()
  const keyHandler = renderer.keyInput
  onMounted(() => {
    keyHandler.on("keypress", callback)
    if (options?.release) {
      keyHandler.on("keyrelease", callback)
    }
  })

  onUnmounted(() => {
    keyHandler.off("keypress", callback)
    if (options?.release) {
      keyHandler.off("keyrelease", callback)
    }
  })
}

export const usePaste = (callback: (event: PasteEvent) => void) => {
  const renderer = useRenderer()
  const keyHandler = renderer.keyInput
  onMounted(() => {
    keyHandler.on("paste", callback)
  })

  onUnmounted(() => {
    keyHandler.off("paste", callback)
  })
}

/**
 * @deprecated renamed to useKeyboard
 */
export const useKeyHandler = useKeyboard

export const useSelectionHandler = (callback: (selection: Selection) => void) => {
  const renderer = useRenderer()

  onMounted(() => {
    renderer.on("selection", callback)
  })

  onUnmounted(() => {
    renderer.off("selection", callback)
  })
}

export const useTimeline = (options: TimelineOptions = {}): Timeline => {
  const timeline = new Timeline(options)

  onMounted(() => {
    if (options.autoplay !== false) {
      timeline.play()
    }
    engine.register(timeline)
  })

  onUnmounted(() => {
    timeline.pause()
    engine.unregister(timeline)
  })

  return timeline
}
