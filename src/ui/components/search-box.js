/**
 * 搜索框组件
 * 用于搜索功能
 *
 * @class SearchBox
 * @extends BaseComponent
 */
import { BaseComponent } from "./base-component.js";

export class SearchBox extends BaseComponent {
  /**
   * 创建搜索框组件
   * @param {Object} options - 配置选项
   * @param {string} [options.placeholder='搜索...'] - 占位符
   * @param {string} [options.value=''] - 初始值
   * @param {boolean} [options.showClear=true] - 显示清除按钮
   * @param {boolean} [options.showHistory=true] - 显示搜索历史
   * @param {boolean} [options.showHotWords=true] - 显示热门词
   * @param {Array} [options.hotWords=[]] - 热门词列表
   * @param {Array} [options.history=[]] - 搜索历史
   * @param {Function} [options.onSearch] - 搜索回调
   * @param {Function} [options.onInputChange] - 输入变化回调
   * @param {Function} [options.onClear] - 清除回调
   */
  constructor(options = {}) {
    super(options);
    this.componentName = "SearchBox";

    this.placeholder = options.placeholder || "搜索景点、路线...";
    this.value = options.value || "";
    this.showClear = options.showClear !== false;
    this.showHistory = options.showHistory !== false;
    this.showHotWords = options.showHotWords !== false;
    this.hotWords = options.hotWords || [];
    this.history = options.history || [];
    this.onSearch = options.onSearch || null;
    this.onInputChange = options.onInputChange || null;
    this.onClear = options.onClear || null;

    this.isFocused = false;
    this.showSuggestions = false;
    this.suggestions = [];
  }

  /**
   * 渲染组件
   * @returns {string} HTML 字符串
   */
  render() {
    const hasValue = this.value && this.value.trim().length > 0;
    const showSuggestions = this.isFocused && (this.showSuggestions || hasValue);

    return `
      <div class="search-box ${this.isFocused ? "focused" : ""}">
        <div class="search-box-input-wrapper">
          <span class="search-box-icon">🔍</span>
          <input 
            type="text" 
            class="search-box-input" 
            id="searchBoxInput"
            placeholder="${this.placeholder}"
            value="${this.escapeHtml(this.value)}"
          />
          ${this.showClear && hasValue ? `<button class="search-box-clear" id="searchBoxClear">✕</button>` : ""}
        </div>
        
        ${showSuggestions ? this.renderSuggestions() : ""}
      </div>
    `;
  }

  /**
   * 渲染建议列表
   * @returns {string} HTML 字符串
   */
  renderSuggestions() {
    // 优先显示搜索历史
    if (this.showHistory && this.history.length > 0 && !this.value) {
      return `
        <div class="search-box-suggestions">
          <div class="search-box-suggestions-header">
            <span class="search-box-suggestions-title">搜索历史</span>
            <button class="search-box-clear-history" id="searchBoxClearHistory">清空</button>
          </div>
          <div class="search-box-history-list">
            ${this.history
              .map(
                (word) => `
              <button class="search-box-history-item" data-word="${this.escapeHtml(word)}">
                <span class="search-box-history-icon">🕐</span>
                <span class="search-box-history-text">${this.escapeHtml(word)}</span>
              </button>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    // 显示热门词
    if (this.showHotWords && this.hotWords.length > 0 && !this.value) {
      return `
        <div class="search-box-suggestions">
          <div class="search-box-suggestions-header">
            <span class="search-box-suggestions-title">热门搜索</span>
          </div>
          <div class="search-box-hot-words">
            ${this.hotWords
              .map(
                (word, index) => `
              <button class="search-box-hot-word ${index < 3 ? "hot" : ""}" data-word="${this.escapeHtml(word)}">
                ${this.escapeHtml(word)}
              </button>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    // 显示搜索建议
    if (this.suggestions && this.suggestions.length > 0) {
      return `
        <div class="search-box-suggestions">
          <div class="search-box-suggestions-list">
            ${this.suggestions
              .map(
                (item) => `
              <button class="search-box-suggestion-item" data-value="${this.escapeHtml(item.value || item)}">
                ${item.name || item}
              </button>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    return "";
  }

  /**
   * HTML 转义
   * @param {string} text - 文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * 组件挂载后调用
   */
  onMount() {
    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    const input = this.$("#searchBoxInput");
    if (input) {
      this.addEventListener(input, "focus", () => {
        this.isFocused = true;
        this.rerender();
      });

      this.addEventListener(input, "blur", () => {
        // 延迟关闭，以便能点击建议项
        setTimeout(() => {
          this.isFocused = false;
          this.showSuggestions = false;
          this.rerender();
        }, 200);
      });

      this.addEventListener(input, "input", (e) => {
        this.value = e.target.value;
        if (this.onInputChange) {
          this.onInputChange(this.value);
        }
      });

      this.addEventListener(input, "keyup", (e) => {
        if (e.key === "Enter") {
          this.performSearch();
        }
      });
    }

    // 清除按钮
    const clearBtn = this.$("#searchBoxClear");
    if (clearBtn) {
      this.addEventListener(clearBtn, "click", () => {
        this.clearSearch();
      });
    }

    // 清空历史按钮
    const clearHistoryBtn = this.$("#searchBoxClearHistory");
    if (clearHistoryBtn) {
      this.addEventListener(clearHistoryBtn, "click", () => {
        this.clearHistory();
      });
    }

    // 历史项点击
    const historyItems = this.$$(".search-box-history-item");
    historyItems.forEach((item) => {
      this.addEventListener(item, "click", (e) => {
        const word = e.currentTarget.dataset.word;
        this.selectWord(word);
      });
    });

    // 热门词点击
    const hotWordItems = this.$$(".search-box-hot-word");
    hotWordItems.forEach((item) => {
      this.addEventListener(item, "click", (e) => {
        const word = e.currentTarget.dataset.word;
        this.selectWord(word);
      });
    });

    // 建议项点击
    const suggestionItems = this.$$(".search-box-suggestion-item");
    suggestionItems.forEach((item) => {
      this.addEventListener(item, "click", (e) => {
        const value = e.currentTarget.dataset.value;
        this.selectWord(value);
      });
    });

    // 点击外部关闭建议
    this.addEventListener(document, "click", (e) => {
      const searchBox = this.$(".search-box");
      if (searchBox && !searchBox.contains(e.target)) {
        this.isFocused = false;
        this.showSuggestions = false;
        this.rerender();
      }
    });
  }

  /**
   * 执行搜索
   */
  performSearch() {
    if (!this.value || !this.value.trim()) {
      return;
    }

    const keyword = this.value.trim();

    // 添加到搜索历史
    this.addToHistory(keyword);

    if (this.onSearch) {
      this.onSearch(keyword);
    }

    this.showSuggestions = false;
    this.isFocused = false;
    this.rerender();
  }

  /**
   * 选择词汇
   * @param {string} word - 词汇
   */
  selectWord(word) {
    this.value = word;
    this.addToHistory(word);

    if (this.onSearch) {
      this.onSearch(word);
    }

    this.showSuggestions = false;
    this.isFocused = false;
    this.rerender();
  }

  /**
   * 清除搜索
   */
  clearSearch() {
    this.value = "";
    this.suggestions = [];

    if (this.onClear) {
      this.onClear();
    }

    this.rerender();

    // 聚焦到输入框
    const input = this.$("#searchBoxInput");
    if (input) {
      input.focus();
    }
  }

  /**
   * 添加到搜索历史
   * @param {string} word - 词汇
   */
  addToHistory(word) {
    if (!word || !this.showHistory) {
      return;
    }

    // 移除重复项
    this.history = this.history.filter((w) => w !== word);

    // 添加到开头
    this.history.unshift(word);

    // 限制历史记录数量
    if (this.history.length > 10) {
      this.history = this.history.slice(0, 10);
    }
  }

  /**
   * 清空搜索历史
   */
  clearHistory() {
    this.history = [];
    this.rerender();
  }

  /**
   * 更新建议列表
   * @param {Array} suggestions - 建议列表
   */
  updateSuggestions(suggestions) {
    this.suggestions = suggestions || [];
    this.showSuggestions = true;
    this.rerender();
  }

  /**
   * 更新热门词
   * @param {Array} hotWords - 热门词列表
   */
  updateHotWords(hotWords) {
    this.hotWords = hotWords || [];
    this.rerender();
  }

  /**
   * 设置搜索值
   * @param {string} value - 值
   */
  setValue(value) {
    this.value = value || "";
    this.rerender();
  }

  /**
   * 获取搜索值
   * @returns {string} 搜索值
   */
  getValue() {
    return this.value;
  }

  /**
   * 聚焦到输入框
   */
  focus() {
    const input = this.$("#searchBoxInput");
    if (input) {
      input.focus();
    }
  }

  /**
   * 取消聚焦
   */
  blur() {
    const input = this.$("#searchBoxInput");
    if (input) {
      input.blur();
    }
  }
}

/**
 * 创建搜索框组件
 * @param {Object} options - 配置选项
 * @returns {SearchBox}
 */
export function createSearchBox(options = {}) {
  return new SearchBox(options);
}

/**
 * 默认导出
 */
export default {
  SearchBox,
  createSearchBox,
};
