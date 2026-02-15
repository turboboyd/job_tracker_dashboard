import path from "path";
import type { Configuration } from "webpack";
import type { BuildMode, BuildOptions } from "./webpack/types";
import { buildResolvers } from "./webpack/buildResolvers";
import { buildLoaders } from "./webpack/buildLoaders";
import { buildPlugins } from "./webpack/buildPlugins";
import { buildOptimization } from "./webpack/buildOptimization";
import { buildDevServer } from "./webpack/buildDevServer";

export default (_env: unknown, argv: { mode?: BuildMode }): Configuration => {
  const mode: BuildMode = argv.mode ?? "development";
  const isProd = mode === "production";
  const isDev = !isProd;

  const options: BuildOptions = {
    mode,
    isProd,
    isDev,
    paths: {
      src: path.resolve(__dirname, "..", "src"),
      dist: path.resolve(__dirname, "..", "dist"),
      public: path.resolve(__dirname, "..", "public"),
    },
  };

  return {
    mode,

    entry: path.resolve(options.paths.src, "main.tsx"),

    output: {
      path: options.paths.dist,
      filename: isProd
        ? "assets/js/[name].[contenthash:8].js"
        : "assets/js/[name].js",
      chunkFilename: isProd
        ? "assets/js/[name].[contenthash:8].chunk.js"
        : "assets/js/[name].chunk.js",
      publicPath: process.env.PUBLIC_URL
        ? `${process.env.PUBLIC_URL.replace(/\/$/, "")}/`
        : "/",
      clean: true,
    },

    devtool: isProd ? "source-map" : "eval-cheap-module-source-map",

    cache: {
      type: "filesystem",
      buildDependencies: {
        config: [__filename],
      },
    },

    resolve: buildResolvers(options),

    module: {
      rules: buildLoaders(options),
    },

    plugins: buildPlugins(options),

    optimization: buildOptimization(),

    devServer: isDev ? buildDevServer(options) : undefined,

    stats: "minimal",
  };
};
