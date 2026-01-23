import {
  BaseRenderable,
  createTextAttributes,
  InputRenderable,
  InputRenderableEvents,
  isTextNodeRenderable,
  parseColor,
  Renderable,
  RootTextNodeRenderable,
  SelectRenderable,
  SelectRenderableEvents,
  TabSelectRenderable,
  TabSelectRenderableEvents,
  TextNodeRenderable,
  TextRenderable,
  type TextNodeOptions,
} from "@opentui/core";
import type { CliRenderer } from "@opentui/core";
import { createRenderer } from "@vue/runtime-core";
import { getComponentCatalogue } from "../elements";
import { LayoutSlotRenderable } from "../elements/slot";
import { getNextId } from "../utils/id-counter";

class OpenVuiTextNode extends TextNodeRenderable {
  public static override fromString(
    text: string,
    options: Partial<TextNodeOptions> = {}
  ): OpenVuiTextNode {
    const node = new OpenVuiTextNode(options);
    node.add(text);
    return node;
  }
}

type HostElement = BaseRenderable;

const PENDING_FOCUS = Symbol.for("open-vui:pending-focus");

class HostText {
  public readonly id: string;
  public text: string;
  public mounted: BaseRenderable | null = null;

  constructor(text: string) {
    this.id = getNextId("text-node");
    this.text = text;
  }
}

class HostComment {
  public readonly id: string;
  public mounted: BaseRenderable | null = null;

  constructor() {
    this.id = getNextId("comment-node");
  }
}

export type HostNode = BaseRenderable | HostText | HostComment;

const isTextParent = (node: BaseRenderable): boolean => {
  return node instanceof TextRenderable || isTextNodeRenderable(node);
};

const getNodeChildren = (node: BaseRenderable): BaseRenderable[] => {
  if (node instanceof TextRenderable) {
    return node.getTextChildren();
  }
  return node.getChildren();
};

const getParentNode = (node: BaseRenderable): BaseRenderable | null => {
  let parent = node.parent ?? null;
  if (parent instanceof RootTextNodeRenderable) {
    parent = parent.textParent ?? null;
  }
  return parent;
};

const setTextNodeValue = (node: TextNodeRenderable, text: string) => {
  // TextNodeRenderable stores chunks; replace the first chunk if possible.
  // When empty, fall back to add.
  try {
    node.replace(text, 0);
  } catch {
    node.add(text);
  }
};

const mountText = (host: HostText, parent: BaseRenderable): BaseRenderable => {
  if (isTextParent(parent)) {
    return OpenVuiTextNode.fromString(host.text, { id: host.id });
  }

  // Vue templates often include whitespace-only text nodes between elements.
  // Treat those as invisible layout placeholders.
  if (host.text.trim().length === 0) {
    return new LayoutSlotRenderable(`slot-layout-${host.id}`);
  }

  throw new Error(
    `Orphan text error: "${host.text}" must have a <text> as a parent (received parent: ${parent.id})`
  );
};

const mountComment = (
  _host: HostComment,
  parent: BaseRenderable
): BaseRenderable => {
  if (isTextParent(parent)) {
    // Anchor inside text flow; empty text chunk.
    return OpenVuiTextNode.fromString("", { id: _host.id });
  }
  return new LayoutSlotRenderable(`slot-layout-${_host.id}`);
};

const resolveDomNode = (
  node: HostNode,
  parent?: BaseRenderable
): BaseRenderable => {
  if (node instanceof BaseRenderable) return node;

  if (node instanceof HostText) {
    if (!parent) {
      if (!node.mounted) {
        throw new Error("HostText node is not mounted yet");
      }
      return node.mounted;
    }

    if (!node.mounted) {
      node.mounted = mountText(node, parent);
    }
    return node.mounted;
  }

  // HostComment
  if (!parent) {
    if (!node.mounted) {
      throw new Error("HostComment node is not mounted yet");
    }
    return node.mounted;
  }

  if (!node.mounted) {
    node.mounted = mountComment(node, parent);
  }
  return node.mounted;
};

const insertDomNode = (
  parent: BaseRenderable,
  child: BaseRenderable,
  anchor?: BaseRenderable | null
) => {
  if (!anchor) {
    parent.add(child);
    return;
  }

  const children = getNodeChildren(parent);
  const anchorIndex = children.findIndex((el) => el.id === anchor.id);
  parent.add(child, anchorIndex === -1 ? children.length : anchorIndex);
};

const removeDomNode = (child: BaseRenderable) => {
  const parent = getParentNode(child);
  if (!parent) return;
  parent.remove(child.id);

  process.nextTick(() => {
    if (child instanceof BaseRenderable && !child.parent) {
      child.destroyRecursively();
    }
  });
};

export const createOpenVuiRenderer = (ctx: CliRenderer) => {
  return createRenderer<HostNode, HostElement>({
    patchProp(el, key, prevValue, nextValue) {
      // Special cases / OpenTUI semantics
      if (key === "focused" || key === "autofocus") {
        if (!(el instanceof Renderable)) return;
        const shouldFocus =
          nextValue !== null && nextValue !== undefined && nextValue !== false;
        if (shouldFocus) {
          // Vue can set props before insertion; defer focus until inserted.
          if (el.parent) el.focus();
          else (el as any)[PENDING_FOCUS] = true;
        } else {
          el.blur();
        }
        return;
      }

      if (key === "style") {
        // Text nodes use OpenTUI's text attribute encoding.
        if (isTextNodeRenderable(el)) {
          const next = nextValue || {};
          el.attributes = createTextAttributes(next);
          if (next.fg) el.fg = parseColor(next.fg);
          if (next.bg) el.bg = parseColor(next.bg);
          return;
        }

        const next = nextValue || {};
        const prev = prevValue || {};
        for (const prop in next) {
          if (prev[prop] === next[prop]) continue;
          // @ts-expect-error OpenTUI style props are dynamic
          el[prop] = next[prop];
        }
        return;
      }

      // Text-node specific props (e.g. <a href="...">)
      if (isTextNodeRenderable(el) && key === "href") {
        el.link = nextValue ? { url: nextValue } : undefined;
        return;
      }

      // OpenTUI input/select event shims
      if (key === "onChange") {
        let event: string | undefined;
        if (el instanceof SelectRenderable)
          event = SelectRenderableEvents.SELECTION_CHANGED;
        else if (el instanceof TabSelectRenderable)
          event = TabSelectRenderableEvents.SELECTION_CHANGED;
        else if (el instanceof InputRenderable)
          event = InputRenderableEvents.CHANGE;

        if (event) {
          if (prevValue) el.off(event, prevValue);
          if (nextValue) el.on(event, nextValue);
          return;
        }
      }

      if (key === "onInput" && el instanceof InputRenderable) {
        if (prevValue) el.off(InputRenderableEvents.INPUT, prevValue);
        if (nextValue) el.on(InputRenderableEvents.INPUT, nextValue);
        return;
      }

      if (key === "onSubmit" && el instanceof InputRenderable) {
        if (prevValue) el.off(InputRenderableEvents.ENTER, prevValue);
        if (nextValue) el.on(InputRenderableEvents.ENTER, nextValue);
        return;
      }

      if (key === "onSelect") {
        if (el instanceof SelectRenderable) {
          if (prevValue)
            el.off(SelectRenderableEvents.ITEM_SELECTED, prevValue);
          if (nextValue) el.on(SelectRenderableEvents.ITEM_SELECTED, nextValue);
          return;
        }

        if (el instanceof TabSelectRenderable) {
          if (prevValue)
            el.off(TabSelectRenderableEvents.ITEM_SELECTED, prevValue);
          if (nextValue)
            el.on(TabSelectRenderableEvents.ITEM_SELECTED, nextValue);
          return;
        }
      }

      // Generic Vue event listeners: @resize -> onResize
      if (/^on[A-Z]/.test(key) && typeof nextValue === "function") {
        const raw = key.slice(2);
        const eventName = raw ? raw[0]!.toLowerCase() + raw.slice(1) : raw;
        if (prevValue) el.off(eventName, prevValue);
        if (nextValue) el.on(eventName, nextValue);
        return;
      }

      // Fallback: assign property
      // @ts-expect-error OpenTUI renderables use dynamic props
      el[key] = nextValue;
    },

    insert(child, parent, anchor) {
      const parentEl = parent;
      const domChild = resolveDomNode(child, parentEl);
      const domAnchor = anchor ? resolveDomNode(anchor, parentEl) : null;
      insertDomNode(parentEl, domChild, domAnchor);

      if (domChild instanceof Renderable && (domChild as any)[PENDING_FOCUS]) {
        (domChild as any)[PENDING_FOCUS] = false;
        domChild.focus();
      }
    },

    remove(child) {
      if (!child) return;
      const domChild = resolveDomNode(child);
      removeDomNode(domChild);
    },

    createElement(type) {
      const id = getNextId(type);
      const catalogue = getComponentCatalogue();
      const Ctor = catalogue[type];
      if (!Ctor) {
        throw new Error(`[open-vui] Unknown element type: ${type}`);
      }
      return new Ctor(ctx, { id });
    },

    createText(text) {
      return new HostText(String(text));
    },

    createComment(_text) {
      return new HostComment();
    },

    setText(node, text) {
      const domNode = resolveDomNode(node);
      if (domNode instanceof TextNodeRenderable) {
        setTextNodeValue(domNode, String(text));
      }

      if (node instanceof HostText) {
        node.text = String(text);
      }
    },

    setElementText(node, text) {
      const value = String(text);
      if (value.trim().length === 0) {
        // Ignore whitespace-only.
        return;
      }

      if (node instanceof TextRenderable) {
        node.content = value;
        return;
      }

      if (node instanceof TextNodeRenderable) {
        setTextNodeValue(node, value);
        return;
      }

      throw new Error(
        `Orphan text error: "${value}" must have a <text> as a parent (received parent: ${node.id})`
      );
    },

    parentNode(node) {
      if (!node) return null;
      const domNode = resolveDomNode(node);
      return getParentNode(domNode);
    },

    nextSibling(node) {
      if (!node) return null;
      const domNode = resolveDomNode(node);
      const parent = getParentNode(domNode);
      if (!parent) return null;
      const siblings = getNodeChildren(parent);
      const index = siblings.findIndex((el) => el.id === domNode.id);
      return index === -1 || index === siblings.length - 1
        ? null
        : siblings[index + 1]!;
    },

    setScopeId(_el, _id) {
      // OpenTUI doesn't use CSS; ignore.
    },
  });
};
