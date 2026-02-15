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
  const { isDev, isProd, paths } = options;

  const defineEnv = buildEnv(isProd);

  const plugins: webpack.WebpackPluginInstance[] = [
    new HtmlWebpackPlugin({
      template: path.resolve(paths.public, "index.html"),
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

    new ESLintWebpackPlugin({
      extensions: ["js", "jsx", "ts", "tsx"],
      failOnError: isProd,
      emitWarning: isDev,
      emitError: isProd,
    }),
  ];

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
