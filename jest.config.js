export default {
  // 测试文件匹配
  testMatch: ["**/tests/**/*.test.js", "**/*.test.js"],

  // 测试文件排除
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/app/",
    "/map_sdk/",
    "/jsbridge/",
  ],

  // 覆盖率配置
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/app/**",
    "!**/map_sdk/**",
    "!**/jsbridge/**",
    "!**/public/**",
    "!**/legacy/**",
  ],

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // 覆盖率报告
  coverageReporters: ["text", "lcov", "html"],

  // 模块别名映射
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@core/(.*)$": "<rootDir>/src/core/$1",
    "^@domain/(.*)$": "<rootDir>/src/domain/$1",
    "^@application/(.*)$": "<rootDir>/src/application/$1",
    "^@ui/(.*)$": "<rootDir>/src/ui/$1",
    "^@platform/(.*)$": "<rootDir>/src/platform/$1",
    "^@api/(.*)$": "<rootDir>/src/api/$1",
    "^@assets/(.*)$": "<rootDir>/src/assets/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@legacy/(.*)$": "<rootDir>/src/legacy/$1",
  },

  // 测试环境
  testEnvironment: "jsdom",

  // 测试设置
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // 超时设置
  testTimeout: 10000,

  // 详细输出
  verbose: true,

  // 颜色输出
  colors: true,

  // 缓存
  cache: true,

  // 模块文件扩展
  moduleFileExtensions: ["js", "json"],

  // 转换配置
  transform: {},

  // ES 模块支持
  transformIgnorePatterns: [
    "/node_modules/(?!(zepto|crypto-js)/)",
  ],
};
