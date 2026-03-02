// CJS wrapper so webpack-cli can load the TS config without ESM resolution issues.
// It relies on ts-node to transpile TypeScript on the fly.

require("ts-node/register");
require("tsconfig-paths/register");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cfg = require("./webpack.config.ts");

module.exports = cfg.default ?? cfg;
