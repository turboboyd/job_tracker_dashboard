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
  },

  js.configs.recommended,

  // Base rules for all TS/TSX
  {
    files: ["src/**/*.{ts,tsx}"],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    settings: {
      react: { version: "detect" },
      "import/resolver": {
        typescript: true,
      },
    },

    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      import: importPlugin,
      sonarjs: sonarjs,
    },

    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,

      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      "import/no-unresolved": "off",

      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='to'] Literal[value=/^\\/(?!\\/)/]",
          message:
            "Do not use string-based paths. Use RoutePath[AppRoutes.X] or buildPath(AppRoutes.X, params) instead.",
        },
        {
          selector:
            "CallExpression[callee.name='navigate'] > Literal[value=/^\\/(?!\\/)/]",
          message:
            "Do not use navigate('/...'). Use navigate(RoutePath[AppRoutes.X]) or navigate(buildPath(...)) instead.",
        },
        {
          selector: "ExportAllDeclaration",
          message: "Do not use export *. Use explicit public API exports.",
        },
      ],
    },
  },


 {
  files: [
    "src/entities/**/index.ts",
    "src/features/**/index.ts",
    "src/widgets/**/index.ts",
    "src/shared/**/index.ts",
  ],
  rules: {
    "no-restricted-syntax": "off",
  },
},


  // Allow internal deep imports inside the same layer (slice internals are fine)
  // entities/* can import entities/* internals, features/* can import features/* internals, etc.
  {
    files: [
      "src/entities/**/*.{ts,tsx}",
      "src/features/**/*.{ts,tsx}",
      "src/widgets/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },


];
