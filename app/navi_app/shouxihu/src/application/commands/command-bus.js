export class CommandBus {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.handlers = new Set();
    this.middlewares = [];
  }

  subscribe(handler) {
    if (typeof handler !== "function") {
      return () => false;
    }

    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  use(middleware) {
    if (typeof middleware !== "function") {
      return () => false;
    }

    this.middlewares.push(middleware);
    return () => {
      const index = this.middlewares.indexOf(middleware);
      if (index < 0) {
        return false;
      }
      this.middlewares.splice(index, 1);
      return true;
    };
  }

  dispatch(command, context = {}) {
    let index = -1;
    const invoke = (nextCommand) => {
      index += 1;
      if (index < this.middlewares.length) {
        return this.middlewares[index](nextCommand, context, invoke);
      }

      let lastResult;
      this.handlers.forEach((handler) => {
        try {
          lastResult = handler(nextCommand, context);
        } catch (error) {
          this.logger.error?.("[CommandBus] handler error", error);
        }
      });
      return lastResult;
    };

    return invoke(command);
  }

  getSubscriberCount() {
    return this.handlers.size;
  }
}

