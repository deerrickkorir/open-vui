import vuePlugin from "../../scripts/vue-plugin";

await Bun.build({
  entrypoints: ["./index.ts"],
  target: "bun",
  outdir: "./build",
  plugins: [vuePlugin],
  compile: {
    target: "bun-darwin-arm64",
    outfile: "app-macos",
  },
});
