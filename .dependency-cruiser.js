// .dependency-cruiser.js
/* eslint-disable */
module.exports = {
  forbidden: [
    /**
     * 1) Cycles
     */
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },

    /**
     * 2) FSD layers: forbid "upward" dependencies
     * Allowed direction:
     * app -> pages -> widgets -> features -> entities -> shared
     */
    {
      name: "no-shared-dep-on-higher",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/(entities|features|widgets|pages|app)/" },
    },
    {
      name: "no-entities-dep-on-higher",
      severity: "error",
      from: { path: "^src/entities/" },
      to: { path: "^src/(features|widgets|pages|app)/" },
    },
    {
      name: "no-features-dep-on-higher",
      severity: "error",
      from: { path: "^src/features/" },
      to: { path: "^src/(widgets|pages|app)/" },
    },
    {
      name: "no-widgets-dep-on-higher",
      severity: "error",
      from: { path: "^src/widgets/" },
      to: { path: "^src/(pages|app)/" },
    },
    {
      name: "no-pages-dep-on-app",
      severity: "error",
      from: { path: "^src/pages/" },
      to: { path: "^src/app/" },
    },

    /**
     * 3) Public API rules (external layers must import only from slice index.ts/tsx)
     *
     * IMPORTANT:
     * - Эти правила применяются ТОЛЬКО к "внешним" слоям.
     * - Внутри самого слайса (например, pages/MatchesPage/*) разрешены внутренние импорты.
     */

    // --- FEATURES: only via src/features/<slice>/index.ts(x) for higher layers
    {
      name: "features-public-api-only",
      severity: "error",
      from: { path: "^src/(app|pages|widgets)/" },
      to: {
        path: "^src/features/[^/]+/.+",
        pathNot: "^src/features/[^/]+/index\\.(ts|tsx)$",
      },
    },

    // --- ENTITIES: only via src/entities/<slice>/index.ts(x) for higher layers
    {
      name: "entities-public-api-only",
      severity: "error",
      from: { path: "^src/(app|pages|widgets|features)/" },
      to: {
        path: "^src/entities/[^/]+/.+",
        pathNot: "^src/entities/[^/]+/index\\.(ts|tsx)$",
      },
    },

    // --- WIDGETS: only via src/widgets/<slice>/index.ts(x) for higher layers
    {
      name: "widgets-public-api-only",
      severity: "error",
      from: { path: "^src/(app|pages)/" },
      to: {
        path: "^src/widgets/[^/]+/.+",
        pathNot: "^src/widgets/[^/]+/index\\.(ts|tsx)$",
      },
    },

    // --- PAGES: only via src/pages/<slice>/index.ts(x) for app and other lower layers
    {
      name: "pages-public-api-only",
      severity: "error",
      from: { path: "^src/app/" },
      to: {
        path: "^src/pages/[^/]+/.+",
        pathNot: "^src/pages/[^/]+/index\\.(ts|tsx)$",
      },
    },
  ],

  options: {
    tsPreCompilationDeps: true,
    doNotFollow: {
      path: "node_modules",
    },
    enhancedResolveOptions: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+",
      },
    },
    tsConfig: {
      fileName: "tsconfig.json",
    },
  },
};
