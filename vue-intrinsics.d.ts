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

// Vue SFC template type-checking uses the runtime-dom JSX intrinsic elements
// as a baseline. Since open-vui is not running in a DOM renderer context, we
// override the colliding built-in tags (select/textarea/etc) to our props.
declare module "@vue/runtime-dom" {
  export interface IntrinsicElementAttributes {
    box: BoxProps;
    text: TextProps;
    input: InputProps;
    select: SelectProps;
    textarea: TextareaProps;
    ascii_font: AsciiFontProps;
    tab_select: TabSelectProps;
    scrollbox: ScrollBoxProps;
    code: CodeProps;

    span: SpanProps;
    strong: SpanProps;
    b: SpanProps;
    em: SpanProps;
    i: SpanProps;
    u: SpanProps;
    br: {};
    a: LinkProps;

    diff: Record<string, any>;
    line_number: Record<string, any>;
  }
}

export {};
