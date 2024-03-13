await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  target: "node",
  format: "esm",
  minify: true,
  external: ["@do-it-plz/client", "@do-it-plz/core", "next/server"],
});
