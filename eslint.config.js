import globals from "globals";

export default [
  {
    // 忽略的文件
    ignores: [
      "node_modules/",
      "dist/",
      "coverage/",
      "*.min.js",
      "public/libs/",
      "app/",
      "map_sdk/",
      "jsbridge/",
      "scripts/",
    ],
  },
  {
    // 全局配置
    languageOptions: {
      ecmaVersion: 2025,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2025,
        // 全局变量声明
        $: "readonly",
        Zepto: "readonly",
        CryptoJS: "readonly",
        // 应用全局变量
        appState: "writable",
        router: "writable",
        config: "readonly",
        // 遗留全局变量 (逐步消除)
        DXDomUtil: "writable",
        command: "writable",
        locWebSocketPostMessage: "writable",
      },
    },
    rules: {
      // 代码风格
      indent: ["error", 2],
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "comma-dangle": ["error", "only-multiline"],
      "no-trailing-spaces": "error",
      "eol-last": "error",

      // 最佳实践
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-console": "off",
      "no-debugger": "warn",
      "no-alert": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-return-await": "error",
      "require-await": "error",

      // ES6+ 规则
      "prefer-const": "error",
      "no-var": "error",
      "prefer-template": "error",
      "prefer-arrow-callback": "error",
      "arrow-spacing": "error",
      "arrow-parens": ["error", "always"],

      // 浏览器相关
      "no-implicit-globals": "error",
      "no-undef": "error",

      // 类型安全
      "no-implicit-coercion": "warn",

      // 代码质量
      "no-duplicate-imports": "error",
      "no-useless-rename": "error",
      "object-shorthand": "warn",

      // 注释
      "spaced-comment": ["error", "always"],

      // 特殊规则 (针对当前项目情况)
      "no-restricted-globals": [
        "error",
        {
          name: "window",
          message:
            "Use window adapter from @/legacy/window-adapter instead of direct window access.",
        },
      ],
    },
  },
  {
    // 针对旧代码的宽松配置
    files: ["src/legacy/**/*.js", "app/**/*.js"],
    rules: {
      "no-restricted-globals": "off",
      "no-var": "off",
      "no-implicit-globals": "off",
    },
  },
];
