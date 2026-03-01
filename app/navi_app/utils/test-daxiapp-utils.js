/**
 * daxiapp.utils.js 功能测试脚本
 * 
 * 测试内容：
 * 1. DXUtils 工具函数
 * 2. Vector3 向量运算
 * 3. Matrix 矩阵运算
 * 4. navi_utils 导航工具
 */

// 模拟浏览器环境
global.window = {
  DaxiApp: {},
  EventHandler: function() {},
  EventHandlerManager: function() {},
  Cross: function() {},
  DaxiMap: { deviceType: {} },
  langData: { kilometer: '公里', 'meter:distance': '米' },
  HWH5: false,
  currentEnv: 'prod',
  additionalQuery: {},
  XMLHttpRequest: function() {
    this.readyState = 4;
    this.status = 200;
    this.response = '{}';
    this.responseText = '{}';
    this.timeout = 15000;
    this.open = function() {};
    this.send = function() {};
    this.setRequestHeader = function() {};
    this.getResponseHeader = function() { return 'application/json'; };
  },
  location: {
    search: '?bdid=B000A11DAF&token=test123',
    hash: ''
  },
  document: {
    createElement: function() { return { style: {}, addEventListener: function() {} }; },
    body: { appendChild: function() {} }
  }
};

global.location = global.window.location;
global.document = global.window.document;

console.log('='.repeat(60));
console.log('daxiapp.utils.js 功能测试');
console.log('='.repeat(60));
console.log();

// 导入模块
import('./daxiapp.utils.js')
  .then(({ DaxiApp, DXUtils, default: defaultExport }) => {
    console.log('✅ 模块导入成功');
    console.log();
    
    let passed = 0;
    let failed = 0;
    
    function test(name, fn) {
      try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
      } catch (e) {
        console.log(`❌ ${name}`);
        console.log(`   错误：${e.message}`);
        failed++;
      }
    }
    
    console.log('--- DXUtils 工具函数测试 ---');
    
    // 测试 getStringVal
    test('DXUtils.getStringVal', () => {
      const result = DXUtils.getStringVal('%E6%B5%8B%E8%AF%95', 'default');
      if (result !== '测试') throw new Error(`期望 '测试', 得到 '${result}'`);
    });
    
    // 测试 getIntVal
    test('DXUtils.getIntVal', () => {
      const result = DXUtils.getIntVal('42', 0);
      if (result !== 42) throw new Error(`期望 42, 得到 ${result}`);
    });
    
    // 测试 getFloatVal
    test('DXUtils.getFloatVal', () => {
      const result = DXUtils.getFloatVal('3.14', 0);
      if (Math.abs(result - 3.14) > 0.001) throw new Error(`期望 3.14, 得到 ${result}`);
    });
    
    // 测试 getBooleanVal
    test('DXUtils.getBooleanVal', () => {
      if (DXUtils.getBooleanVal('true') !== true) throw new Error('true 转换失败');
      if (DXUtils.getBooleanVal('false') !== false) throw new Error('false 转换失败');
      if (DXUtils.getBooleanVal('1') !== true) throw new Error('1 转换失败');
      if (DXUtils.getBooleanVal('0') !== false) throw new Error('0 转换失败');
    });
    
    // 测试 parseLancherParam
    test('DXUtils.parseLancherParam', () => {
      const result = DXUtils.parseLancherParam('?a=1&b=2&c=test');
      if (result.a !== '1') throw new Error('参数 a 解析失败');
      if (result.b !== '2') throw new Error('参数 b 解析失败');
      if (result.c !== 'test') throw new Error('参数 c 解析失败');
    });
    
    // 测试 isValidPhoneNumber
    test('DXUtils.isValidPhoneNumber', () => {
      if (!DXUtils.isValidPhoneNumber('13800138000')) throw new Error('有效手机号验证失败');
      if (DXUtils.isValidPhoneNumber('12345678901')) throw new Error('无效手机号验证失败');
    });
    
    // 测试 formatSecondsToTime
    test('DXUtils.formatSecondsToTime', () => {
      const result = DXUtils.formatSecondsToTime(125);
      if (result !== '02:05') throw new Error(`期望 '02:05', 得到 '${result}'`);
    });
    
    // 测试 createUUID
    test('DXUtils.createUUID', () => {
      const uuid = DXUtils.createUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
      if (!uuidRegex.test(uuid)) throw new Error(`UUID 格式错误：${uuid}`);
    });
    
    // 测试 distanceToText
    test('DXUtils.distanceToText', () => {
      const result1 = DXUtils.distanceToText(500);
      if (!result1.includes('米')) throw new Error('距离单位错误');
      
      const result2 = DXUtils.distanceToText(1500);
      if (!result2.includes('公里')) throw new Error('距离单位错误');
    });
    
    // 测试 copyData
    test('DXUtils.copyData', () => {
      const original = { a: 1, b: { c: 2 } };
      const copy = DXUtils.copyData(original);
      copy.b.c = 3;
      if (original.b.c === 3) throw new Error('深拷贝失败');
    });
    
    // 测试 compareObj
    test('DXUtils.compareObj', () => {
      if (!DXUtils.compareObj({a: 1}, {a: 1})) throw new Error('相同对象比较失败');
      if (DXUtils.compareObj({a: 1}, {a: 2})) throw new Error('不同对象比较失败');
    });
    
    // 测试类型检查函数
    test('DXUtils.isObject', () => {
      if (!DXUtils.isObject({})) throw new Error('对象检查失败');
      if (DXUtils.isObject([])) throw new Error('数组不应被识别为对象');
    });
    
    test('DXUtils.isArray', () => {
      if (!DXUtils.isArray([])) throw new Error('数组检查失败');
      if (DXUtils.isArray({})) throw new Error('对象不应被识别为数组');
    });
    
    test('DXUtils.isFunction', () => {
      if (!DXUtils.isFunction(() => {})) throw new Error('函数检查失败');
      if (DXUtils.isFunction(123)) throw new Error('数字不应被识别为函数');
    });
    
    console.log();
    console.log('--- Vector3 向量运算测试 ---');
    
    const Vector3 = DXUtils.Vector3;
    
    test('Vector3.create', () => {
      const v = Vector3.create();
      if (v.length !== 3) throw new Error('向量长度错误');
      if (v[0] !== 0 || v[1] !== 0 || v[2] !== 0) throw new Error('零向量创建失败');
    });
    
    test('Vector3.make', () => {
      const v = Vector3.make(1, 2, 3);
      if (v[0] !== 1 || v[1] !== 2 || v[2] !== 3) throw new Error('向量创建失败');
    });
    
    test('Vector3.add', () => {
      const result = Vector3.add([], [1, 2, 3], [4, 5, 6]);
      if (result[0] !== 5 || result[1] !== 7 || result[2] !== 9) throw new Error('向量加法失败');
    });
    
    test('Vector3.sub', () => {
      const result = Vector3.sub([], [4, 5, 6], [1, 2, 3]);
      if (result[0] !== 3 || result[1] !== 3 || result[2] !== 3) throw new Error('向量减法失败');
    });
    
    test('Vector3.scale', () => {
      const result = Vector3.scale([], [1, 2, 3], 2);
      if (result[0] !== 2 || result[1] !== 4 || result[2] !== 6) throw new Error('向量缩放失败');
    });
    
    test('Vector3.dot', () => {
      const result = Vector3.dot([1, 2, 3], [4, 5, 6]);
      if (result !== 32) throw new Error(`点积错误：期望 32, 得到 ${result}`);
    });
    
    test('Vector3.cross', () => {
      const result = Vector3.cross([], [1, 0, 0], [0, 1, 0]);
      if (result[0] !== 0 || result[1] !== 0 || result[2] !== 1) throw new Error('叉积失败');
    });
    
    test('Vector3.length', () => {
      const result = Vector3.length([3, 4, 0]);
      if (Math.abs(result - 5) > 0.001) throw new Error(`向量长度错误：期望 5, 得到 ${result}`);
    });
    
    test('Vector3.normalize', () => {
      const result = Vector3.normalize([], [3, 4, 0]);
      const expectedLength = 1;
      const actualLength = Vector3.length(result);
      if (Math.abs(actualLength - expectedLength) > 0.001) throw new Error('归一化失败');
    });
    
    test('Vector3.distance', () => {
      const result = Vector3.distance([0, 0, 0], [3, 4, 0]);
      if (Math.abs(result - 5) > 0.001) throw new Error(`距离计算错误：期望 5, 得到 ${result}`);
    });
    
    console.log();
    console.log('--- Matrix 矩阵运算测试 ---');
    
    const Matrix = DXUtils.Matrix;
    
    test('Matrix.create', () => {
      const m = Matrix.create();
      if (m.length !== 16) throw new Error('矩阵长度错误');
      if (m[0] !== 1 || m[5] !== 1 || m[10] !== 1 || m[15] !== 1) throw new Error('单位矩阵创建失败');
    });
    
    test('Matrix.makeIdentity', () => {
      const m = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      Matrix.makeIdentity(m);
      if (m[0] !== 1 || m[5] !== 1 || m[10] !== 1 || m[15] !== 1) throw new Error('单位矩阵设置失败');
    });
    
    test('Matrix.scale', () => {
      const m = Matrix.scale([], 2, 3, 4);
      if (m[0] !== 2 || m[5] !== 3 || m[10] !== 4) throw new Error('缩放矩阵失败');
    });
    
    test('Matrix.translate', () => {
      const m = Matrix.translate([], 1, 2, 3);
      if (m[12] !== 1 || m[13] !== 2 || m[14] !== 3) throw new Error('平移矩阵失败');
    });
    
    console.log();
    console.log('--- navi_utils 导航工具测试 ---');
    
    const navi_utils = DaxiApp.naviMath;
    
    test('navi_utils.earth_radius', () => {
      if (navi_utils.earth_radius !== 6378137.0) throw new Error('地球半径常量错误');
    });
    
    test('navi_utils.DEGREE_TO_RADIAN', () => {
      const expected = Math.PI / 180;
      if (Math.abs(navi_utils.DEGREE_TO_RADIAN - expected) > 0.0000001) throw new Error('角度转弧度常量错误');
    });
    
    test('navi_utils.getGeodeticCircleDistance', () => {
      const p1 = { x: 116.4, y: 39.9 }; // 北京
      const p2 = { x: 121.4, y: 31.2 }; // 上海
      const distance = navi_utils.getGeodeticCircleDistance(p1, p2);
      // 北京到上海大约 1068 公里
      if (distance < 1000000 || distance > 1200000) throw new Error(`距离计算错误：${distance} 米`);
    });
    
    test('navi_utils.lonLatToMectro', () => {
      const result = navi_utils.lonLatToMectro({ lon: 0, lat: 0 });
      if (Math.abs(result.x) > 0.1 || Math.abs(result.y) > 0.1) throw new Error('墨卡托转换失败');
    });
    
    test('navi_utils.mectroTolLonLat', () => {
      const mectro = { x: 0, y: 0 };
      const result = navi_utils.mectroTolLonLat(mectro);
      if (Math.abs(result.lon) > 0.1 || Math.abs(result.lat) > 0.1) throw new Error('墨卡托逆转换失败');
    });
    
    test('navi_utils.formatSecondsToTime', () => {
      const result = navi_utils.secondToDate(125, false, 'zh');
      if (!result.includes('分钟') && !result.includes('秒')) throw new Error('时间格式化失败');
    });
    
    test('navi_utils.copyData', () => {
      const original = { a: 1, b: { c: 2 } };
      const copy = navi_utils.copyData(original);
      copy.b.c = 3;
      if (original.b.c === 3) throw new Error('深拷贝失败');
    });
    
    console.log();
    console.log('--- 其他功能测试 ---');
    
    test('DaxiApp.defined', () => {
      if (DaxiApp.defined(undefined)) throw new Error('undefined 检查失败');
      if (DaxiApp.defined(null)) throw new Error('null 检查失败');
      if (!DaxiApp.defined(0)) throw new Error('0 应该被定义为已定义');
      if (!DaxiApp.defined('')) throw new Error('空字符串应该被定义为已定义');
    });
    
    test('DaxiApp.defaultValue', () => {
      if (DaxiApp.defaultValue(undefined, 'default') !== 'default') throw new Error('默认值失败');
      if (DaxiApp.defaultValue(null, 'default') !== 'default') throw new Error('null 默认值失败');
      if (DaxiApp.defaultValue('value', 'default') !== 'value') throw new Error('非默认值失败');
    });
    
    test('DaxiApp.GCJ2WGSUtils', () => {
      const utils = DaxiApp.GCJ2WGSUtils;
      if (!utils.wgs84_To_Gcj02) throw new Error('wgs84_To_Gcj02 不存在');
      if (!utils.gcj02_To_Wgs84) throw new Error('gcj02_To_Wgs84 不存在');
      if (!utils.bd09_To_Gcj02) throw new Error('bd09_To_Gcj02 不存在');
      if (!utils.gcj02_To_Bd09) throw new Error('gcj02_To_Bd09 不存在');
      
      // 测试坐标转换
      const result = utils.wgs84_To_Gcj02(39.9, 116.4);
      if (!result.lon || !result.lat) throw new Error('坐标转换失败');
    });
    
    console.log();
    console.log('='.repeat(60));
    console.log(`测试结果：${passed} 通过，${failed} 失败`);
    console.log('='.repeat(60));
    
    if (failed > 0) {
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('❌ 模块加载失败:', err);
    process.exit(1);
  });
