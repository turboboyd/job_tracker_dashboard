import type { Configuration } from "webpack";

export function buildOptimization(): Configuration["optimization"] {
  return {
    splitChunks: {
      chunks: "all",
    },
    runtimeChunk: "single",
  };
}
