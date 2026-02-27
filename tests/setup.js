/**
 * Jest 测试设置文件
 * 在每个测试文件执行前运行
 */

// 全局 Mock
global.appState = null;
global.router = null;
global.config = null;

// 模拟 Zepto
global.$ = () => ({});
global.Zepto = {};

// 模拟 CryptoJS
global.CryptoJS = {
  MD5: () => ({ toString: () => "mocked-hash" }),
};

// 模拟 DOM
document.body.innerHTML = `
  <div id="first_page"></div>
  <div id="app"></div>
  <div id="container"></div>
`;

// 模拟 localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// 模拟 sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// 模拟 fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  })
);

// 模拟 URL 参数
const mockUrlParams = new URLSearchParams();
Object.defineProperty(global, "location", {
  value: {
    search: "",
    href: "http://localhost:3000/index.html",
  },
  writable: true,
});

// 辅助函数：设置 URL 参数
global.setMockUrlParams = (params) => {
  const searchParams = new URLSearchParams(params).toString();
  global.location.search = `?${searchParams}`;
  global.location.href = `http://localhost:3000/index.html?${searchParams}`;
};

// 辅助函数：模拟环境
global.setMockEnvironment = (env) => {
  const ua = {
    dev: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
    android: "Mozilla/5.0 (Linux; Android 10)",
    wechat: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) MicroMessenger/8.0.0",
  };
  Object.defineProperty(navigator, "userAgent", {
    value: ua[env] || ua.dev,
    writable: true,
  });
};

// 清理函数
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  global.fetch.mockClear();
});
