const { merge } = require("webpack-merge");
const common = require("./webpack.common");

module.exports = merge(common, {
  mode: "development",
  devtool: "eval-source-map",
  devServer: {
    port: 3000,
    historyApiFallback: true,
    hot: true,
    open: true,
    client: {
      overlay: true
    }
  }
});
