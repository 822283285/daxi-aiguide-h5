/**
 * 命令总线
 * @description 负责命令的分发和处理
 */

export class CommandBus {
  constructor() {
    this.handlers = new Map();
    this.middleware = [];
  }

  /**
   * 注册命令处理器
   * @param {string} commandType - 命令类型
   * @param {Function} handler - 处理函数
   */
  register(commandType, handler) {
    if (typeof handler !== "function") {
      throw new Error("Handler must be a function");
    }
    this.handlers.set(commandType, handler);
  }

  /**
   * 注册中间件
   * @param {Function} middleware - 中间件函数
   */
  use(middleware) {
    if (typeof middleware !== "function") {
      throw new Error("Middleware must be a function");
    }
    this.middleware.push(middleware);
  }

  /**
   * 执行命令
   * @param {Object} command - 命令对象 {type, payload}
   * @param {Object} context - 执行上下文
   * @returns {Promise<any>}
   */
  async execute(command, context = {}) {
    const { type, payload } = command;

    if (!type) {
      throw new Error("Command type is required");
    }

    const handler = this.handlers.get(type);
    if (!handler) {
      throw new Error(`No handler registered for command type: ${type}`);
    }

    // 执行中间件
    let enhancedContext = { ...context, command, timestamp: Date.now() };
    for (const mw of this.middleware) {
      try {
        const result = await mw(enhancedContext);
        if (result === false) {
          return {
            success: false,
            error: {
              message: "Command blocked by middleware",
              code: "MIDDLEWARE_BLOCKED",
            },
          };
        }
        if (result && typeof result === "object") {
          enhancedContext = { ...enhancedContext, ...result };
        }
      } catch (error) {
        return {
          success: false,
          error: {
            message: error.message || "Middleware error",
            code: "MIDDLEWARE_ERROR",
          },
        };
      }
    }

    // 执行命令处理器
    try {
      const result = await handler(payload, enhancedContext);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`[CommandBus] Error executing command ${type}:`, error);
      return {
        success: false,
        error: {
          message: error.message || "Command execution failed",
          code: "COMMAND_EXECUTION_FAILED",
          type,
        },
      };
    }
  }

  /**
   * 批量执行命令
   * @param {Array<Object>} commands - 命令列表
   * @param {Object} context - 执行上下文
   * @returns {Promise<Array<Object>>}
   */
  async executeBatch(commands, context = {}) {
    const results = [];
    for (const command of commands) {
      const result = await this.execute(command, context);
      results.push(result);
    }
    return results;
  }

  /**
   * 取消注册命令处理器
   * @param {string} commandType - 命令类型
   */
  unregister(commandType) {
    this.handlers.delete(commandType);
  }

  /**
   * 清除所有处理器
   */
  clear() {
    this.handlers.clear();
  }

  /**
   * 获取已注册的命令类型列表
   * @returns {string[]}
   */
  getRegisteredCommands() {
    return Array.from(this.handlers.keys());
  }

  /**
   * 检查命令是否已注册
   * @param {string} commandType - 命令类型
   * @returns {boolean}
   */
  isRegistered(commandType) {
    return this.handlers.has(commandType);
  }
}

/**
 * 命令基类
 */
export class Command {
  constructor(type, payload = {}) {
    this.type = type;
    this.payload = payload;
    this.timestamp = Date.now();
    this.id = this.generateId();
  }

  generateId() {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      type: this.type,
      payload: this.payload,
      timestamp: this.timestamp,
      id: this.id,
    };
  }
}

/**
 * 命令结果
 */
export class CommandResult {
  constructor(success, data = null, error = null) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.timestamp = Date.now();
  }

  static ok(data) {
    return new CommandResult(true, data);
  }

  static fail(error) {
    return new CommandResult(false, null, error);
  }

  toJSON() {
    return {
      success: this.success,
      data: this.data,
      error: this.error,
      timestamp: this.timestamp,
    };
  }
}
