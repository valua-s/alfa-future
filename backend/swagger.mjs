import * as fs from "node:fs/promises";

await fs.mkdir("dist");
await Promise.all(
  [
    "swagger-ui-bundle.js",
    "swagger-ui.css",
    "swagger-ui-standalone-preset.js",
  ].map((file) =>
    fs.copyFile(`node_modules/swagger-ui-dist/${file}`, `dist/${file}`)
  )
);
