/**
 * 图片懒加载工具
 * 使用 IntersectionObserver API 实现
 */

let imageObserver = null;
let bgObserver = null;

/**
 * 初始化图片观察者
 */
function initImageObserver() {
  if (!("IntersectionObserver" in globalThis)) return null;

  return new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }
          img.removeAttribute("data-src");
          img.removeAttribute("data-srcset");
          img.classList.add("loaded");
          observer.unobserve(img);
        }
      });
    },
    {
      rootMargin: "50px 0px", // 提前 50px 加载
      threshold: 0.01,
    }
  );
}

/**
 * 初始化背景图片观察者
 */
function initBackgroundObserver() {
  if (!("IntersectionObserver" in globalThis)) return null;

  return new IntersectionObserver(
    (entries, bgObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.style.backgroundImage = `url(${el.dataset.bg})`;
          el.removeAttribute("data-bg");
          bgObserver.unobserve(el);
        }
      });
    },
    {
      rootMargin: "100px 0px",
      threshold: 0.01,
    }
  );
}

/**
 * 设置图片懒加载
 * @param {HTMLElement} [container=document] - 可选的容器，用于观察特定区域内的图片
 */
export function setupLazyLoad(container = document) {
  const images = container.querySelectorAll("img[data-src]");

  if (!imageObserver) {
    imageObserver = initImageObserver();
  }

  if (imageObserver) {
    images.forEach((img) => imageObserver.observe(img));
  } else {
    // 降级处理：立即加载所有图片
    images.forEach((img) => {
      img.src = img.dataset.src;
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
      }
    });
  }
}

/**
 * 设置背景图片懒加载
 * @param {HTMLElement} [container=document] - 可选的容器
 */
export function setupBackgroundLazyLoad(container = document) {
  const elements = container.querySelectorAll("[data-bg]");

  if (!bgObserver) {
    bgObserver = initBackgroundObserver();
  }

  if (bgObserver) {
    elements.forEach((el) => bgObserver.observe(el));
  }
}

/**
 * 将普通图片标签转换为懒加载格式
 * @param {HTMLElement} img - 图片元素
 */
export function convertToLazyImage(img) {
  if (img.src && !img.dataset.src) {
    img.dataset.src = img.src;
    img.src = ""; // 清空 src，等待懒加载
    img.classList.add("lazy");
    if (imageObserver) {
      imageObserver.observe(img);
    }
  }
}

/**
 * 批量转换容器内的图片为懒加载格式
 * @param {HTMLElement} container - 容器元素
 * @param {string} selector - 图片选择器，默认为 'img'
 */
export function convertContainerImagesToLazy(container, selector = "img") {
  const images = container.querySelectorAll(selector);
  images.forEach((img) => convertToLazyImage(img));
}

/**
 * 动态添加懒加载图片
 * @param {HTMLElement} container - 容器元素
 */
export function observeNewImages(container) {
  setupLazyLoad(container);
  setupBackgroundLazyLoad(container);
}

/**
 * 自动观察 DOM 变化，为新添加的图片启用懒加载
 */
export function autoObserveDOMChanges() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Element node
            // 检查节点本身是否是图片
            if (node.tagName === "IMG" && node.dataset.src) {
              setupLazyLoad(node);
            }
            // 检查节点内的图片
            const images = node.querySelectorAll?.("img[data-src]") || [];
            if (images.length) {
              setupLazyLoad(node);
            }
            // 检查背景图片
            const bgElements = node.querySelectorAll?.("[data-bg]") || [];
            if (bgElements.length) {
              setupBackgroundLazyLoad(node);
            }
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log("[LazyLoad] DOM change observer initialized");
}

export default {
  setupLazyLoad,
  setupBackgroundLazyLoad,
  convertToLazyImage,
  convertContainerImagesToLazy,
  observeNewImages,
  autoObserveDOMChanges,
};
