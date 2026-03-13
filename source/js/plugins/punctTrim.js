/**
 * punctTrim.js - 标点挤压 + 文章标题自适应
 * 1) 检测目标元素首字符，若为全角开括号类符号，添加 .punct-trim-start
 * 2) 针对 .article-title-regular：优先单行缩字号，仍溢出则尾部浅色省略
 * 3) 特例：标题包含 ：；、， 且仍溢出时，在标点后断为两行（第二行必要时省略）
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

const ARTICLE_TITLE_SELECTOR = '.article-title-regular';
const TITLE_TWO_LINE_CLASS = 'article-title-regular-two-line';
const TITLE_LINE_1_CLASS = 'article-title-line-1';
const TITLE_LINE_2_CLASS = 'article-title-line-2';
const TITLE_MAIN_CLASS = 'article-title-main';
const TITLE_ELLIPSIS_CLASS = 'article-title-tail-ellipsis';
const TITLE_SPECIAL_PUNCT = new Set(['：', '；', '、', '，']);
const ELLIPSIS_TEXT = '...';

const measureCanvas = document.createElement('canvas');
const measureContext = measureCanvas.getContext('2d');

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

function parsePx(value, fallback) {
  const parsed = Number.parseFloat(String(value).trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toGlyphs(text) {
  return Array.from(text);
}

function getTitleMetrics(el) {
  const style = window.getComputedStyle(el);
  const baseFontSize = parsePx(style.fontSize, 16);
  const letterSpacingRaw = Number.parseFloat(style.letterSpacing);
  const letterSpacingPx = Number.isFinite(letterSpacingRaw) ? letterSpacingRaw : 0;

  return {
    fontStyle: style.fontStyle || 'normal',
    fontVariant: style.fontVariant || 'normal',
    fontWeight: style.fontWeight || '400',
    fontFamily: style.fontFamily || 'sans-serif',
    baseFontSize,
    letterSpacingPx,
    paddingInline:
      parsePx(style.paddingLeft, 0) + parsePx(style.paddingRight, 0),
    minFontSize: parsePx(
      style.getPropertyValue('--article-title-fit-min-size'),
      Math.max(20, baseFontSize * 0.58)
    ),
    step: Math.max(
      parsePx(style.getPropertyValue('--article-title-fit-step'), 1),
      0.25
    ),
  };
}

function setMeasureFont(metrics, fontSize) {
  if (!measureContext) return;
  measureContext.font = [
    metrics.fontStyle,
    metrics.fontVariant,
    metrics.fontWeight,
    `${fontSize}px`,
    metrics.fontFamily,
  ].join(' ');
}

function measureTextWidth(text, metrics, fontSize) {
  if (!measureContext) return Number.POSITIVE_INFINITY;

  setMeasureFont(metrics, fontSize);
  const glyphCount = toGlyphs(text).length;
  const spacingScale = fontSize / metrics.baseFontSize;
  const letterSpacing =
    metrics.letterSpacingPx * spacingScale * Math.max(glyphCount - 1, 0);

  return measureContext.measureText(text).width + letterSpacing;
}

function getTitleContentWidth(el, metrics) {
  const width = Math.max(el.clientWidth - metrics.paddingInline, 0);
  if (width > 0) return width;

  const rectWidth = el.getBoundingClientRect().width;
  return Math.max(rectWidth - metrics.paddingInline, 0);
}

function getRawTitle(el) {
  const saved = el.getAttribute('data-raw-title');
  if (saved !== null) return saved;

  const rawTitle = (el.textContent || '').trim();
  el.setAttribute('data-raw-title', rawTitle);
  return rawTitle;
}

function resetTitleState(el, rawTitle) {
  el.classList.remove(TITLE_TWO_LINE_CLASS);
  el.style.removeProperty('--article-title-fit-font-size');
  el.textContent = rawTitle;
}

function setSingleLineTitle(el, text, truncatedText = null) {
  el.classList.remove(TITLE_TWO_LINE_CLASS);

  if (truncatedText === null) {
    el.textContent = text;
    return;
  }

  el.textContent = '';

  const main = document.createElement('span');
  main.className = TITLE_MAIN_CLASS;
  main.textContent = truncatedText;

  const ellipsis = document.createElement('span');
  ellipsis.className = TITLE_ELLIPSIS_CLASS;
  ellipsis.textContent = ELLIPSIS_TEXT;

  el.append(main, ellipsis);
}

function truncateWithEllipsis(glyphs, maxWidth, metrics, fontSize) {
  const ellipsisWidth = measureTextWidth(ELLIPSIS_TEXT, metrics, fontSize);

  let low = 0;
  let high = glyphs.length;
  let best = 0;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const text = glyphs.slice(0, mid).join('');
    const width = measureTextWidth(text, metrics, fontSize) + ellipsisWidth;

    if (width <= maxWidth) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return {
    text: glyphs.slice(0, best).join(''),
    visible: best,
    truncated: best < glyphs.length,
  };
}

function buildTwoLineCandidate(glyphs, splitIndex, maxWidth, metrics, fontSize) {
  const line1Glyphs = glyphs.slice(0, splitIndex);
  const line2Glyphs = glyphs.slice(splitIndex);

  const line1Text = line1Glyphs.join('');
  if (measureTextWidth(line1Text, metrics, fontSize) > maxWidth) {
    return null;
  }

  const line2FullText = line2Glyphs.join('');
  if (measureTextWidth(line2FullText, metrics, fontSize) <= maxWidth) {
    return {
      splitIndex,
      line1: line1Text,
      line2: line2FullText,
      truncated: false,
      visible: glyphs.length,
    };
  }

  const truncated = truncateWithEllipsis(
    line2Glyphs,
    maxWidth,
    metrics,
    fontSize
  );

  return {
    splitIndex,
    line1: line1Text,
    line2: truncated.text,
    truncated: true,
    visible: splitIndex + truncated.visible,
  };
}

function setTwoLineTitle(el, candidate) {
  el.classList.add(TITLE_TWO_LINE_CLASS);
  el.textContent = '';

  const line1 = document.createElement('span');
  line1.className = TITLE_LINE_1_CLASS;
  line1.textContent = candidate.line1;

  const line2 = document.createElement('span');
  line2.className = TITLE_LINE_2_CLASS;

  if (!candidate.truncated) {
    line2.textContent = candidate.line2;
  } else {
    const main = document.createElement('span');
    main.className = TITLE_MAIN_CLASS;
    main.textContent = candidate.line2;

    const ellipsis = document.createElement('span');
    ellipsis.className = TITLE_ELLIPSIS_CLASS;
    ellipsis.textContent = ELLIPSIS_TEXT;

    line2.append(main, ellipsis);
  }

  el.append(line1, line2);
}

function fitArticleTitle(el) {
  const rawTitle = getRawTitle(el);
  if (!rawTitle) return;

  resetTitleState(el, rawTitle);

  const metrics = getTitleMetrics(el);
  const maxWidth = getTitleContentWidth(el, metrics);
  if (maxWidth <= 0) return;

  let fontSize = metrics.baseFontSize;

  while (
    fontSize - metrics.step >= metrics.minFontSize &&
    measureTextWidth(rawTitle, metrics, fontSize) > maxWidth
  ) {
    fontSize -= metrics.step;
  }

  fontSize = Math.max(fontSize, metrics.minFontSize);
  el.style.setProperty('--article-title-fit-font-size', `${fontSize}px`);

  if (measureTextWidth(rawTitle, metrics, fontSize) <= maxWidth) {
    setSingleLineTitle(el, rawTitle);
    return;
  }

  const glyphs = toGlyphs(rawTitle);
  const splitIndices = [];

  glyphs.forEach((glyph, index) => {
    if (TITLE_SPECIAL_PUNCT.has(glyph) && index < glyphs.length - 1) {
      splitIndices.push(index + 1);
    }
  });

  if (splitIndices.length > 0) {
    let bestCandidate = null;

    splitIndices.forEach((splitIndex) => {
      const candidate = buildTwoLineCandidate(
        glyphs,
        splitIndex,
        maxWidth,
        metrics,
        fontSize
      );

      if (!candidate) return;

      if (
        !bestCandidate ||
        candidate.visible > bestCandidate.visible ||
        (candidate.visible === bestCandidate.visible &&
          candidate.splitIndex > bestCandidate.splitIndex)
      ) {
        bestCandidate = candidate;
      }
    });

    if (bestCandidate) {
      setTwoLineTitle(el, bestCandidate);
      return;
    }
  }

  const truncated = truncateWithEllipsis(glyphs, maxWidth, metrics, fontSize);
  setSingleLineTitle(el, rawTitle, truncated.text);
}

function applyArticleTitleFit() {
  const titles = document.querySelectorAll(ARTICLE_TITLE_SELECTOR);
  titles.forEach((titleEl) => {
    fitArticleTitle(titleEl);
  });
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

function applyTypographyEnhancements() {
  applyArticleTitleFit();
  applyPunctTrim();
}

let resizeRafId = null;
function onResize() {
  if (resizeRafId !== null) return;
  resizeRafId = window.requestAnimationFrame(() => {
    resizeRafId = null;
    applyTypographyEnhancements();
  });
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', applyTypographyEnhancements);
window.addEventListener('resize', onResize, { passive: true });

// Swup 页面切换后重新执行
try {
  swup.hooks.on('page:view', applyTypographyEnhancements);
} catch {}
