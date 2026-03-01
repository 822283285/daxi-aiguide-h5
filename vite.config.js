import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  // 根据模式确定基础路径
  const isProduction = mode === 'production';
  
  return {
    // 基础路径 - 生产环境使用子目录
    base: isProduction ? "/daxi/" : "./",

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
      minify: "terser",
      terserOptions: {
        compress: {
          // 生产环境才移除 console
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ["console.log", "console.info"] : [],
        },
      },
      sourcemap: !isProduction, // 开发环境保留 sourcemap
      reportCompressedSize: true,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
        },
        output: {
          sourcemap: !isProduction,
          // 生产环境使用哈希文件名
          entryFileNames: isProduction ? "assets/[name].[hash].js" : "assets/[name].js",
          chunkFileNames: isProduction ? "assets/[name].[hash].js" : "assets/[name].js",
          assetFileNames: isProduction ? "assets/[name].[hash].[ext]" : "assets/[name].[ext]",
          // 使用函数形式实现更灵活的代码分割
          manualChunks(id) {
            // 第三方依赖
            if (id.includes("node_modules")) {
              if (id.includes("zepto") || id.includes("crypto-js")) {
                return "vendor-core";
              }
              if (id.includes("core-js")) {
                return "vendor-polyfills";
              }
            }

            // 本地模块分割
            if (id.includes("/map_sdk/")) {
              return "map-sdk";
            }
            if (id.includes("/jsbridge/")) {
              return "jsbridge";
            }

            // 页面懒加载自动分割（每个页面一个 chunk）
            if (id.includes("/src/ui/pages/")) {
              // 提取页面名称
              const match = id.match(/\/pages\/([^/]+)/);
              if (match) {
                return `page-${match[1]}`;
              }
            }
          },
        },
      },
    },

    // 插件配置
    plugins: [
      legacy({
        targets: ["defaults", "not IE 11", "iOS >= 10", "Android >= 5"],
        modernPolyfills: true,
        renderLegacyChunks: true,
        polyfills: [
          "es.promise",
          "es.array.iterator",
          "es.object.entries",
        ],
      }),
      ViteImageOptimizer({
        test: /\.(jpe?g|png|svg)$/i,
        includePublic: false,
        logStats: true,
        ansiColors: true,
        png: { quality: 80 },
        jpeg: { quality: 75 },
        jpg: { quality: 75 },
        webp: { quality: 75, lossless: false }
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
  };
});
