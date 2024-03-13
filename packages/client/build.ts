await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  target: "node",
  format: "esm",
  minify: false,
  external: ["@do-it-plz/core", "@paralleldrive/cuid2", "zod"],
});
