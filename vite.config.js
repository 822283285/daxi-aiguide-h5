import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import { resolve } from "path";

export default defineConfig({
  // 基础路径
  base: "./",

  // 公共目录
  publicDir: "public",

  // 路径别名
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@core": resolve(__dirname, "src/core"),
      "@domain": resolve(__dirname, "src/domain"),
      "@application": resolve(__dirname, "src/application"),
      "@ui": resolve(__dirname, "src/ui"),
      "@platform": resolve(__dirname, "src/platform"),
      "@api": resolve(__dirname, "src/api"),
      "@assets": resolve(__dirname, "src/assets"),
      "@config": resolve(__dirname, "src/config"),
      "@utils": resolve(__dirname, "src/utils"),
      "@legacy": resolve(__dirname, "src/legacy"),
      "@map_sdk": resolve(__dirname, "map_sdk"),
      "@jsbridge": resolve(__dirname, "jsbridge"),
    },
  },

  // 开发服务器
  server: {
    port: 3000,
    host: true,
    open: "/index.html",
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },

  // 构建配置
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      output: {
        manualChunks: {
          "vendor-core": ["zepto", "crypto-js"],
        },
      },
    },
  },

  // 旧浏览器兼容
  plugins: [
    legacy({
      targets: ["defaults", "not IE 11", "iOS >= 10", "Android >= 5"],
    }),
  ],

  // CSS 配置
  css: {
    preprocessorOptions: {
      // 如后续需要 less/sass，在此配置
    },
  },

  // 优化依赖预构建
  optimizeDeps: {
    include: ["zepto", "crypto-js"],
  },
});
