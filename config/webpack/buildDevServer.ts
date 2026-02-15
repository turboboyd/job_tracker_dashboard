import type { Configuration as DevServerConfiguration } from "webpack-dev-server";
import type { BuildOptions } from "./types";

export function buildDevServer(options: BuildOptions): DevServerConfiguration {
  return {
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
    static: {
      directory: options.paths.public,
      publicPath: process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL.replace(/\/$/, "")}/` : "/",
      watch: true,
    },
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  };
}
