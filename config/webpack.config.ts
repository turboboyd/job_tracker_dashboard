import path from "path";
import type { Configuration } from "webpack";
import type { BuildMode, BuildOptions } from "./webpack/types";
import { buildResolvers } from "./webpack/buildResolvers";
import { buildLoaders } from "./webpack/buildLoaders";
import { buildPlugins } from "./webpack/buildPlugins";
import { buildOptimization } from "./webpack/buildOptimization";
import { buildDevServer } from "./webpack/buildDevServer";

function getPublicPath(): string {
  const fromEnv = process.env.PUBLIC_URL?.trim();
  if (fromEnv) return `${fromEnv.replace(/\/$/, "")}/`;

  const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
  if (process.env.GITHUB_ACTIONS === "true" && repo) return `/${repo}/`;

  return "/";
}

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

  const publicPath = getPublicPath();

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
      publicPath,
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

    performance: isProd
      ? {
          // Calibrated after route/chunk optimization: keep warnings meaningful.
          hints: "warning",
          maxAssetSize: 350 * 1024,
          maxEntrypointSize: 500 * 1024,
          assetFilter: (assetFilename) =>
            assetFilename.endsWith(".js") || assetFilename.endsWith(".css"),
        }
      : false,

    ...(isDev ? { devServer: buildDevServer(options) } : {}),

    stats: "minimal",
  };
};
