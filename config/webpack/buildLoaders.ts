import type { RuleSetRule } from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import type { BuildOptions } from "./types";

export function buildLoaders(options: BuildOptions): RuleSetRule[] {
  const { isDev, isProd } = options;

  const tsRule: RuleSetRule = {
    test: /\.[jt]sx?$/,
    exclude: /node_modules/,
    use: {
      loader: "babel-loader",
      options: {
        cacheDirectory: true,
        plugins: [isDev && require.resolve("react-refresh/babel")].filter(Boolean),
      },
    },
  };

  const cssRule: RuleSetRule = {
    test: /\.css$/i,
    use: [
      isProd ? MiniCssExtractPlugin.loader : "style-loader",
      {
        loader: "css-loader",
        options: {
          importLoaders: 1,
          sourceMap: isDev,
        },
      },
      {
        loader: "postcss-loader",
        options: {
          sourceMap: isDev,
        },
      },
    ],
  };

  const imagesRule: RuleSetRule = {
    test: /\.(png|jpe?g|gif|svg|webp)$/i,
    type: "asset",
    parser: {
      dataUrlCondition: {
        maxSize: 10 * 1024,
      },
    },
    generator: {
      filename: "assets/img/[name].[contenthash:8][ext]",
    },
  };

  const fontsRule: RuleSetRule = {
    test: /\.(woff2?|eot|ttf|otf)$/i,
    type: "asset/resource",
    generator: {
      filename: "assets/fonts/[name].[contenthash:8][ext]",
    },
  };

  return [tsRule, cssRule, imagesRule, fontsRule];
}
