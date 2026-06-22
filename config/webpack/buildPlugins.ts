import path from "path";
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import ESLintWebpackPlugin from "eslint-webpack-plugin";
import type { BuildOptions } from "./types";
import { buildEnv } from "./buildEnv";

export function buildPlugins(
  options: BuildOptions
): webpack.WebpackPluginInstance[] {
  const { isDev, isProd, paths, publicPath } = options;

  const defineEnv = buildEnv(isProd);
  const shouldRunWebpackLint = isDev || process.env.WEBPACK_LINT === "true";

  // CRA-style %PUBLIC_URL% tokens in public/index.html are not understood by
  // Webpack. Expose the serving base to the HTML template as an EJS parameter
  // (<%= PUBLIC_URL %>) instead. Strip the trailing slash so the template's own
  // "/manifest.json" separator is not doubled: "/" -> "", "/dashboard/" ->
  // "/dashboard". Empty base then yields a root-absolute "/manifest.json".
  const publicUrl = publicPath.replace(/\/$/, "");

  const plugins: webpack.WebpackPluginInstance[] = [
    new HtmlWebpackPlugin({
      template: path.resolve(paths.public, "index.html"),
      templateParameters: { PUBLIC_URL: publicUrl },
    }),

    new CopyWebpackPlugin({
      patterns: [
        {
          from: paths.public,
          to: paths.dist,
          globOptions: {
            ignore: ["**/index.html"],
          },
          noErrorOnMissing: true,
        },
      ],
    }),

    new webpack.DefinePlugin(defineEnv),

    new ForkTsCheckerWebpackPlugin(),
  ];

  if (shouldRunWebpackLint) {
    plugins.push(
      new ESLintWebpackPlugin({
        cache: false,
        extensions: ["js", "jsx", "ts", "tsx"],
        failOnError: isProd,
        emitWarning: isDev,
        emitError: isProd,
      })
    );
  }

  if (isDev) {
    plugins.push(new ReactRefreshWebpackPlugin());
  }

  if (isProd) {
    plugins.push(
      new MiniCssExtractPlugin({
        filename: "assets/css/[name].[contenthash:8].css",
        chunkFilename: "assets/css/[name].[contenthash:8].chunk.css",
      })
    );
  }

  return plugins;
}
