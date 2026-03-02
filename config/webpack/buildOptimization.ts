import type { Configuration } from "webpack";

export function buildOptimization(): NonNullable<Configuration["optimization"]> {
  return {
    splitChunks: {
      chunks: "all",
    },
    runtimeChunk: "single",
  };
}
