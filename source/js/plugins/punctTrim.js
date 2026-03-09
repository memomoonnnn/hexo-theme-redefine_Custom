/**
 * punctTrim.js - 标点挤压
 * 检测标题、段落等元素的首字符，若为全角开括号类符号，
 * 则添加 .punct-trim-start 类以应用 text-indent: -0.5em，
 * 消除左侧视觉空隙，保持段落对齐。
 */

// 需要处理的全角开括号类字符（左侧含约 0.5em 内部留白）
const CJK_OPEN_BRACKETS = new Set([
  '\u3010', // 【
  '\u300C', // 「
  '\u300E', // 『
  '\uFF08', // （
  '\u300A', // 《
  '\u3008', // 〈
  '\u3014', // 〔
  '\u3016', // 〖
  '\u3018', // 〘
  '\u301A', // 〚
  '\uFF5B', // ｛
]);

// 目标选择器
const SELECTORS = [
  '.markdown-body h1',
  '.markdown-body h2',
  '.markdown-body h3',
  '.markdown-body h4',
  '.markdown-body h5',
  '.markdown-body h6',
  '.markdown-body p',
  '.markdown-body li',
  '.markdown-body blockquote > p',
  '.article-title-cover',
  '.article-title-regular',
  '.page-title',
  '.home-article-title',
].join(', ');

const TRIM_CLASS = 'punct-trim-start';

/**
 * 获取元素的首个可见文本字符（跳过空白）
 */
function getFirstVisibleChar(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = walker.currentNode.textContent;
    const trimmed = text.replace(/^\s+/, '');
    if (trimmed.length > 0) {
      return trimmed.charAt(0);
    }
  }
  return null;
}

/**
 * 扫描所有目标元素，按需添加或移除 punct-trim-start 类
 */
function applyPunctTrim() {
  const elements = document.querySelectorAll(SELECTORS);
  elements.forEach((el) => {
    const firstChar = getFirstVisibleChar(el);
    if (firstChar && CJK_OPEN_BRACKETS.has(firstChar)) {
      el.classList.add(TRIM_CLASS);
    } else {
      el.classList.remove(TRIM_CLASS);
    }
  });
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', applyPunctTrim);

// Swup 页面切换后重新执行
try {
  swup.hooks.on('page:view', applyPunctTrim);
} catch {}
