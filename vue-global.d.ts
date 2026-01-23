import type { DefineComponent } from "vue";

import type {
  AsciiFontProps,
  BoxProps,
  CodeProps,
  InputProps,
  LinkProps,
  ScrollBoxProps,
  SelectProps,
  SpanProps,
  TabSelectProps,
  TextProps,
  TextareaProps,
} from "./src/types/elements";

// Vue template type support (Volar): make OpenVUI tags known to templates.
declare module "vue" {
  export interface GlobalComponents {
    box: DefineComponent<BoxProps>;
    text: DefineComponent<TextProps>;
    input: DefineComponent<InputProps>;
    select: DefineComponent<SelectProps>;
    textarea: DefineComponent<TextareaProps>;
    ascii_font: DefineComponent<AsciiFontProps>;
    tab_select: DefineComponent<TabSelectProps>;
    scrollbox: DefineComponent<ScrollBoxProps>;
    code: DefineComponent<CodeProps>;

    // Text modifiers (must appear inside <text>)
    span: DefineComponent<SpanProps>;
    strong: DefineComponent<SpanProps>;
    b: DefineComponent<SpanProps>;
    em: DefineComponent<SpanProps>;
    i: DefineComponent<SpanProps>;
    u: DefineComponent<SpanProps>;
    br: DefineComponent<{}>;
    a: DefineComponent<LinkProps>;

    // Extras
    diff: DefineComponent<Record<string, any>>;
    line_number: DefineComponent<Record<string, any>>;
  }
}

export {};
