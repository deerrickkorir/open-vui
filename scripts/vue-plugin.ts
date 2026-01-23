import { createHash } from "node:crypto"
import { compileScript, compileTemplate, parse, type SFCDescriptor } from "@vue/compiler-sfc"
import type { BunPlugin } from "bun"

const openVuiNativeTags = new Set([
  // Layout & display
  "box",
  "text",
  "scrollbox",
  "ascii_font",

  // Input
  "input",
  "textarea",
  "select",
  "tab_select",

  // Code / diff
  "code",
  "diff",
  "line_number",

  // Text modifiers (must appear inside <text>)
  "span",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "br",
  "a",
])

const isOpenVuiElementTag = (tag: string): boolean => {
  return openVuiNativeTags.has(tag)
}

const hashId = (input: string): string => {
  return createHash("sha256").update(input).digest("hex").slice(0, 8)
}

const compileSfcToModule = async (filename: string, source: string): Promise<string> => {
  const { descriptor, errors } = parse(source, { filename })
  if (errors.length > 0) {
    const message = errors
      .map((e: unknown) => (e instanceof Error ? e.message : String(e)))
      .join("\n")
    throw new Error(`Failed to parse SFC ${filename}:\n${message}`)
  }

  const id = hashId(filename + "\n" + source)
  const script = compileSfcScript(descriptor, id, filename)
  const template = compileSfcTemplate(descriptor, id, filename, script.bindings)

  const hasScopedStyles = descriptor.styles.some((s) => s.scoped)
  const scopeId = hasScopedStyles ? `data-v-${id}` : null

  // Note: We intentionally ignore <style> blocks for now. OpenTUI styling is
  // driven by component props rather than CSS.
  const jsModule = [
    script.content,
    template.code,
    "\nconst __sfc__ = (typeof __default__ === 'object' || typeof __default__ === 'function') ? __default__ : {}",
    "__sfc__.render = render",
    scopeId ? `__sfc__.__scopeId = ${JSON.stringify(scopeId)}` : "",
    `__sfc__.__file = ${JSON.stringify(filename)}`,
    "export { __sfc__ as default }",
    "",
  ]
    .filter(Boolean)
    .join("\n")

  // Bun's onLoad pipeline will execute the returned code as JS.
  // If the SFC uses `<script setup lang=\"ts\">`, compiler-sfc will preserve TS
  // syntax (types, interfaces) in the output unless we transpile.
  //
  // Transpile to plain JS here so apps can use script setup + TS naturally.
  // Transpile TS -> JS. `Bun.Transpiler` API differs across Bun versions;
  // construct an instance and call `.transform()`.
  const transpiler = new Bun.Transpiler({
    loader: "ts",
    target: "bun",
  })

  // Important: preserve ESM `export type` as type-only so it doesn't become a
  // runtime export (which would make `import { Theme }` throw).
  return transpiler.transformSync(jsModule, { exports: "auto" })
}

const compileSfcScript = (descriptor: SFCDescriptor, id: string, filename: string) => {
  if (descriptor.scriptSetup) {
    const compiled = compileScript(descriptor, {
      id,
      // `filename` is not in the public type in some compiler-sfc versions.
      // It is still supported at runtime.
      ...(filename ? { filename } : {}),
      inlineTemplate: false,
    } as any)
    // compiler-sfc returns code that defines `const __default__ = ...` (or similar)
    // depending on the script content.
    // compileScript returns a module that exports default. We rewrite that
    // export into a stable `const __default__ = ...` so we can attach `render`.
    const content = compiled.content.replace(/\bexport\s+default\b/, "const __default__ =")
    return { content, bindings: compiled.bindings }
  }

  if (descriptor.script) {
    // If user uses a plain <script>, we rewrite `export default` into `const __default__ =`.
    // This is a minimal transform suitable for common SFC patterns.
    const raw = descriptor.script.content
    const rewritten = raw.replace(/\bexport\s+default\b/, "const __default__ =")
    return { content: rewritten, bindings: {} as any }
  }

  return { content: "const __default__ = {}", bindings: {} as any }
}

const compileSfcTemplate = (
  descriptor: SFCDescriptor,
  id: string,
  filename: string,
  bindingMetadata: any,
): { code: string } => {
  const source = descriptor.template?.content ?? ""
  const hasScopedStyles = descriptor.styles.some((s) => s.scoped)

  const result = compileTemplate({
    source,
    filename,
    id,
    scoped: hasScopedStyles,
    compilerOptions: {
      bindingMetadata,
      isCustomElement: (tag) => isOpenVuiElementTag(tag),
      whitespace: "condense",
    },
  })

  if (result.errors.length > 0) {
    const message = result.errors
      .map((e: unknown) => (e instanceof Error ? e.message : String(e)))
      .join("\n")
    throw new Error(`Failed to compile template for ${filename}:\n${message}`)
  }

  return { code: result.code }
}

const vueTransformPlugin: BunPlugin = {
  name: "bun-plugin-vue-sfc",
  setup: (build) => {
    build.onLoad({ filter: /\.vue$/ }, async (args) => {
      const file = Bun.file(args.path)
      const source = await file.text()
      const code = await compileSfcToModule(args.path, source)
      return { contents: code, loader: "js" }
    })
  },
}

export default vueTransformPlugin
