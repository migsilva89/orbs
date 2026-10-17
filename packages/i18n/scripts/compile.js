import { compile } from "@inlang/paraglide-js";
import { fileURLToPath } from "node:url";
import { i18nParaglideOptions } from "../src/entry.vite.ts";

await compile({
  project: fileURLToPath(new URL("../project.inlang", import.meta.url)),
  outdir: fileURLToPath(new URL("../src/paraglide", import.meta.url)),
  ...i18nParaglideOptions,
});
