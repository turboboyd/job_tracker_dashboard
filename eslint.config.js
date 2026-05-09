// eslint.config.cjs
const js = require("@eslint/js");
const globals = require("globals");

const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");

const importPlugin = require("eslint-plugin-import");
const sonarjs = require("eslint-plugin-sonarjs");

module.exports = [
  {
    ignores: ["dist/**", "node_modules/**"],
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
  },

  js.configs.recommended,

  // TS/TSX
  {
    files: ["src/**/*.{ts,tsx}"],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },

        projectService: true,
        tsconfigRootDir: __dirname,
      },

      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    settings: {
      react: { version: "detect" },
      "import/resolver": {
        typescript: {
          project: ["./tsconfig.eslint.json"],
        },
      },
    },

    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      import: importPlugin,
      sonarjs,
    },

    rules: {
      // React
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // TS basic
      ...tsPlugin.configs.recommended.rules,

      // ✅ TS type-aware
      ...(tsPlugin.configs["recommended-type-checked"]
        ? tsPlugin.configs["recommended-type-checked"].rules
        : {}),
      ...(tsPlugin.configs["stylistic-type-checked"]
        ? tsPlugin.configs["stylistic-type-checked"].rules
        : {}),

      // Import
      ...(importPlugin.configs.recommended
        ? importPlugin.configs.recommended.rules
        : {}),
      ...(importPlugin.configs.typescript
        ? importPlugin.configs.typescript.rules
        : {}),

      // Sonar
      ...sonarjs.configs.recommended.rules,

      // React 17+
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",

      // TS: чище импорты типов
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],

      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Promises
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      // Too noisy for this codebase right now; keep as warning.
      "@typescript-eslint/no-floating-promises": "warn",

      "@typescript-eslint/require-await": "off",

      // Imports ordering
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      // алиасы через tsconfig paths
      "import/no-unresolved": "off",

      // SonarJS — меньше шума
      "sonarjs/cognitive-complexity": "warn",
      "sonarjs/no-duplicate-string": "warn",
      "sonarjs/deprecation": "warn",

      // SonarJS rules that produce lots of false-positives in TS/React projects
      "sonarjs/prefer-read-only-props": "off",
      "sonarjs/unused-import": "off",
      "sonarjs/different-types-comparison": "off",

      // Type-aware rules — relax to warnings to avoid blocking dev flow
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-base-to-string": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/unbound-method": "warn",
      "@typescript-eslint/no-redundant-type-constituents": "warn",

      // Архитектурные запреты -> warn
      "no-restricted-syntax": [
        "warn",
        {
          selector: "JSXAttribute[name.name='to'] Literal[value=/^\\/(?!\\/)/]",
          message:
            "Do not use string-based paths. Prefer RoutePath[AppRoutes.X] or buildPath(AppRoutes.X, params).",
        },
        {
          selector:
            "CallExpression[callee.name='navigate'] > Literal[value=/^\\/(?!\\/)/]",
          message:
            "Do not use navigate('/...'). Prefer navigate(RoutePath[AppRoutes.X]) or navigate(buildPath(...)).",
        },
        {
          selector: "ExportAllDeclaration",
          message: "Avoid `export *`. Prefer explicit public API exports.",
        },
      ],
    },
  },

  // Barrel indexes — allow export*
  {
    files: [
      "src/entities/**/index.ts",
      "src/features/**/index.ts",
      "src/widgets/**/index.ts",
      "src/shared/**/index.ts",
      "src/pages/**/index.ts",
      "src/app/**/index.ts",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },

  // Allow internal deep imports inside same layer
  {
    files: [
      "src/entities/**/*.{ts,tsx}",
      "src/features/**/*.{ts,tsx}",
      "src/widgets/**/*.{ts,tsx}",
      "src/pages/**/*.{ts,tsx}",
      "src/app/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },

  // Tests
  {
    files: ["src/**/*.{test,spec}.{ts,tsx}", "src/**/__tests__/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
];
