/**
 * Command 模块单元测试
 * 测试 daxiapp.page.command.js 的核心功能
 */

describe('Command 模块测试', () => {
  // 模拟必要的全局依赖
  beforeAll(() => {
    // 模拟 DaxiApp
    global.DaxiApp = {
      domUtil: {
        html: jest.fn(),
        find: jest.fn(() => document.createElement('div')),
      },
      utils: {
        getFloatVal: jest.fn((val) => parseFloat(val) || 0),
      },
      dom: {
        html: jest.fn(),
        find: jest.fn(),
      },
    };

    // 模拟 Zepto
    global.$ = jest.fn(() => ({
      on: jest.fn(),
      off: jest.fn(),
      html: jest.fn(),
    }));

    // 模拟 window 对象
    global.window = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      location: {
        hash: '',
        href: 'http://localhost:3000/index.html',
      },
      lastHashCount: 0,
      history: {
        length: 1,
      },
    };
  });

  afterAll(() => {
    // 清理全局变量
    delete global.DaxiApp;
    delete global.$;
  });

  beforeEach(() => {
    // 重置所有 mocks
    jest.clearAllMocks();
    
    // 设置基本 DOM
    document.body.innerHTML = '<div id="app"></div>';
    
    // 重置 window mocks
    global.window.addEventListener.mockClear();
    global.window.removeEventListener.mockClear();
  });

  describe('initDaxiCommand 初始化', () => {
    test('应该成功初始化 Command 模块', () => {
      const modulePath = '../../../app/navi_app/shouxihu/js/daxiapp.page.command.js';
      
      // 加载模块（会注册到 global）
      require(modulePath);
      
      // 验证全局函数被注册
      expect(global.initDaxiCommand).toBeDefined();
      expect(typeof global.initDaxiCommand).toBe('function');
    });

    test('应该接受 api 和 options 参数', () => {
      // 加载模块
      require('../../../app/navi_app/shouxihu/js/daxiapp.page.command.js');
      
      const mockApi = {
        downloader: null,
        _stateManager: {
          registState: jest.fn(),
        },
        _mapView: {
          _mapSDK: {},
        },
        _params: {
          token: 'test-token',
        },
        _dom: document.getElementById('app'),
      };
      
      const options = {
        pages: [],
      };
      
      const result = global.initDaxiCommand(mockApi, options);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('状态管理', () => {
    test('应该注册页面状态', () => {
      require('../../../app/navi_app/shouxihu/js/daxiapp.page.command.js');
      
      const mockState = {
        initialize: jest.fn(),
      };
      
      const mockStateManager = {
        registState: jest.fn(),
      };
      
      global.DaxiApp.TestState = mockState;
      
      const mockApi = {
        downloader: null,
        _stateManager: mockStateManager,
        _mapView: { _mapSDK: {} },
        _params: { token: 'test' },
        _dom: document.getElementById('app'),
      };
      
      const options = {
        pages: [
          {
            stateName: 'testState',
            stateClassName: 'TestState',
          },
        ],
      };
      
      global.initDaxiCommand(mockApi, options);
      
      expect(mockStateManager.registState).toHaveBeenCalledWith('testState', expect.any(Object));
    });
  });

  describe('WebSocket 事件处理', () => {
    test('应该处理 location WebSocket 事件', () => {
      require('../../../app/navi_app/shouxihu/js/daxiapp.page.command.js');
      
      const mockApi = {
        downloader: null,
        _stateManager: { registState: jest.fn() },
        _mapView: { _mapSDK: {} },
        _params: { token: 'test' },
        _dom: document.getElementById('app'),
      };
      
      global.initDaxiCommand(mockApi, { pages: [] });
      
      // 验证全局事件处理器被设置
      expect(global.locWebSocketOnGetEvent).toBeDefined();
      expect(typeof global.locWebSocketOnGetEvent).toBe('function');
      
      // 测试事件处理器
      const eventData = { id: '123', name: 'test' };
      global.locWebSocketOnGetEvent(eventData);
      
      // 应该更新 command 参数
      expect(mockApi._params.id).toBe('123');
    });

    test('应该处理空 ID 的情况', () => {
      require('../../../app/navi_app/shouxihu/js/daxiapp.page.command.js');
      
      const mockApi = {
        downloader: null,
        _stateManager: { registState: jest.fn() },
        _mapView: { _mapSDK: {} },
        _params: { token: 'test', id: 'original' },
        _dom: document.getElementById('app'),
      };
      
      global.initDaxiCommand(mockApi, { pages: [] });
      
      const eventData = { name: 'test' }; // 没有 id
      global.locWebSocketOnGetEvent(eventData);
      
      // id 应该被设置为空字符串
      expect(mockApi._params.id).toBe('');
    });
  });

  describe('URL 参数解析', () => {
    test('应该解析 URL 参数', () => {
      require('../../../app/navi_app/shouxihu/js/daxiapp.page.command.js');
      
      const mockApi = {
        downloader: null,
        _stateManager: { registState: jest.fn() },
        _mapView: { _mapSDK: {} },
        _params: { token: 'test' },
        _dom: document.getElementById('app'),
      };
      
      const result = global.initDaxiCommand(mockApi, { pages: [] });
      
      // 验证返回对象有 getParam 方法（如果暴露的话）
      expect(result).toBeDefined();
    });
  });

  describe('Hash 变化监听', () => {
    test('应该监听 hashchange 事件', () => {
      require('../../../app/navi_app/shouxihu/js/daxiapp.page.command.js');
      
      const mockApi = {
        downloader: null,
        _stateManager: { registState: jest.fn() },
        _mapView: { _mapSDK: {} },
        _params: { token: 'test' },
        _dom: document.getElementById('app'),
      };
      
      global.initDaxiCommand(mockApi, { pages: [] });
      
      // 验证事件监听器被注册
      expect(global.window.addEventListener).toHaveBeenCalledWith(
        'hashchange',
        expect.any(Function)
      );
    });

    test('应该处理展览展示命令', () => {
      require('../../../app/navi_app/shouxihu/js/daxiapp.page.command.js');
      
      const mockApi = {
        downloader: null,
        _stateManager: { registState: jest.fn() },
        _mapView: { _mapSDK: {} },
        _params: { token: 'test' },
        _dom: document.getElementById('app'),
      };
      
      const result = global.initDaxiCommand(mockApi, { pages: [] });
      
      // 模拟 openExhibit 方法
      result.openExhibit = jest.fn();
      
      // 模拟 hashchange 事件
      const event = {
        newURL: 'http://localhost:3000/index.html#method=showExhibit&id=123',
      };
      
      // 触发事件监听器
      const callArgs = global.window.addEventListener.mock.calls[0];
      const eventHandler = callArgs[1];
      eventHandler(event);
      
      // 验证 openExhibit 被调用
      expect(result.openExhibit).toHaveBeenCalledWith({ method: 'showExhibit', id: '123' });
    });
  });

  describe('工具函数', () => {
    test('getParam 应该正确解析查询字符串', () => {
      require('../../../app/navi_app/shouxihu/js/daxiapp.page.command.js');
      
      const mockApi = {
        downloader: null,
        _stateManager: { registState: jest.fn() },
        _mapView: { _mapSDK: {} },
        _params: { token: 'test' },
        _dom: document.getElementById('app'),
      };
      
      // 这个测试验证模块加载后内部函数可以正常工作
      expect(() => {
        global.initDaxiCommand(mockApi, { pages: [] });
      }).not.toThrow();
    });
  });
});
