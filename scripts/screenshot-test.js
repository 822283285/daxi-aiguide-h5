import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

const URL =
  "https://html.qkbyte.cn/daxi/?token=806bc162812065750b3d3958f9056008&buildingId=S10000008&userId=ot5qm6-uO9a_wfMf_fkRab5q3pgw&testLocWs=true&appId=wxd006a15115585c6&device=SW_android_HUAWEI_NAM-AL00&disabledH5Location=true&wsIndex=0&sendLocType=hash";
const OUTPUT_DIR = join(ROOT, "test-screenshots");

// 创建输出目录
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function testPage() {
  console.log("🚀 启动 Puppeteer 测试...");
  console.log("📍 测试 URL:", URL);

  let browser;
  try {
    // 启动浏览器
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    console.log("✅ 浏览器启动成功");

    const page = await browser.newPage();

    // 设置视口大小（模拟手机）
    await page.setViewport({ width: 375, height: 812 });

    // 启用控制台日志捕获
    page.on("console", (msg) => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    // 启用错误捕获
    page.on("pageerror", (error) => {
      console.error(`[Browser Error] ${error.message}`);
      console.error(`[Browser Error Stack] ${error.stack}`);
    });

    // 启用请求失败捕获
    page.on("requestfailed", (request) => {
      const failure = request.failure();
      console.error(`[Request Failed] ${failure?.errorText || "Unknown"} ${request.url()}`);
    });

    // 启用响应状态码捕获
    page.on("response", (response) => {
      const status = response.status();
      if (status >= 400) {
        console.error(`[HTTP ${status}] ${response.url()}`);
      }
    });

    console.log("📸 开始加载页面...");

    // 访问页面，等待网络空闲
    await page.goto(URL, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    console.log("✅ 页面加载完成");

    // 截图
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const screenshotPath = join(OUTPUT_DIR, `screenshot-${timestamp}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    console.log("📸 截图保存:", screenshotPath);

    // 获取页面标题
    const title = await page.title();
    console.log("📄 页面标题:", title);

    // 等待 2 秒让 JavaScript 完全执行
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 检查 JavaScript 是否执行
    const hasRuntimeConfig = await page.evaluate(() => typeof window.runtimeConfig !== "undefined");
    console.log("🔧 runtimeConfig 存在:", hasRuntimeConfig);

    const hasDaxiApp = await page.evaluate(() => typeof window.DaxiApp !== "undefined");
    console.log("🔧 DaxiApp 存在:", hasDaxiApp);

    // 检查 __vite__mapDeps 是否存在（Vite 打包标记）
    const hasViteMapDeps = await page.evaluate(() => typeof window.__vite__mapDeps !== "undefined");
    console.log("🔧 __vite__mapDeps 存在:", hasViteMapDeps);

    // 检查是否有全局错误
    const hasViteIsModernBrowser = await page.evaluate(
      () => typeof window.__vite_is_modern_browser !== "undefined"
    );
    console.log("🔧 __vite_is_modern_browser 存在:", hasViteIsModernBrowser);

    // 获取 HTML 内容（前 1000 字符）
    const html = await page.content();
    console.log("📄 HTML 长度:", html.length);

    // 检查关键元素
    const appElement = await page.$("#app");
    const containerElement = await page.$("#container");
    const firstPageElement = await page.$("#first_page");

    // 检查 #app 是否有内容
    const appInnerHtml = await page.evaluate(() => {
      const app = document.getElementById("app");
      return app ? app.innerHTML : null;
    });

    // 检查 #first_page 是否可见（而不仅仅是存在）
    const firstPageVisible = await page.evaluate(() => {
      const firstPage = document.getElementById("first_page");
      if (!firstPage) return false;
      return window.getComputedStyle(firstPage).display !== "none";
    });

    console.log("🔍 元素检查:");
    console.log("  - #app:", appElement ? "✅ 存在" : "❌ 不存在");
    console.log("  - #app 内容长度:", appInnerHtml ? appInnerHtml.length : 0);
    console.log("  - #container:", containerElement ? "✅ 存在" : "❌ 不存在");
    console.log(
      "  - #first_page:",
      firstPageElement
        ? firstPageVisible
          ? "✅ 存在且可见（加载中）"
          : "✅ 存在但已隐藏（正常）"
        : "❌ 不存在（已隐藏）"
    );

    // 等待 5 秒看是否有变化
    console.log("⏳ 等待 5 秒观察动态变化...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 再次检查
    const firstPageVisibleAfter = await page.evaluate(() => {
      const firstPage = document.getElementById("first_page");
      if (!firstPage) return false;
      return window.getComputedStyle(firstPage).display !== "none";
    });
    console.log(
      "  - #first_page (3 秒后):",
      firstPageVisibleAfter ? "✅ 可见（可能卡住）" : "✅ 已隐藏（正常）"
    );

    // 再截图
    const screenshotPath2 = join(OUTPUT_DIR, `screenshot-${timestamp}-3s.png`);
    await page.screenshot({
      path: screenshotPath2,
      fullPage: true,
    });

    console.log("📸 3 秒后截图保存:", screenshotPath2);

    // 生成测试报告
    const report = {
      timestamp,
      url: URL,
      title,
      htmlLength: html.length,
      elements: {
        app: !!appElement,
        container: !!containerElement,
        firstPage: !!firstPageElement,
        firstPageVisible: firstPageVisible,
        firstPageVisibleAfter3s: firstPageVisibleAfter,
      },
      javascript: {
        hasRuntimeConfig,
        hasDaxiApp,
      },
      screenshots: [screenshotPath, screenshotPath2],
    };

    const reportPath = join(OUTPUT_DIR, `report-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log("📊 测试报告保存:", reportPath);
    console.log("✅ 测试完成！");

    return report;
  } catch (error) {
    console.error("❌ 测试失败:", error.message);

    // 保存错误报告
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const errorPath = join(OUTPUT_DIR, `error-${timestamp}.json`);
    fs.writeFileSync(
      errorPath,
      JSON.stringify(
        {
          timestamp,
          error: error.message,
          stack: error.stack,
        },
        null,
        2
      )
    );

    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("🔒 浏览器已关闭");
    }
  }
}

// 运行测试
testPage()
  .then((report) => {
    console.log("\n=== 测试完成摘要 ===");
    console.log("页面标题:", report.title);
    console.log("HTML 长度:", report.htmlLength);
    console.log("关键元素:", report.elements);
    console.log("截图文件:", report.screenshots);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n=== 测试失败 ===");
    console.error("错误:", error.message);
    process.exit(1);
  });
