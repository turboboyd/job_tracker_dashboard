import type { ResolveOptions } from "webpack";
import type { BuildOptions } from "./types";

export function buildResolvers(options: BuildOptions): ResolveOptions {
  return {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    alias: {
      src: options.paths.src,
    },
  };
}
