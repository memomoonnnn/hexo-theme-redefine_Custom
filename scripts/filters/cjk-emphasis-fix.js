/**
 * CJK Emphasis Fix Filter
 *
 * 修复 marked (CommonMark) 在处理 CJK 标点符号紧贴 emphasis marker（*、**、***）时
 * 无法正确识别加粗/斜体的问题。
 *
 * 原理：在 emphasis marker 与相邻的 CJK 标点之间插入零宽空格（U+200B），
 * 使 marked 的 delimiter 边界检查能够通过。零宽空格在浏览器渲染时不可见。
 */

'use strict';

hexo.extend.filter.register('before_post_render', function (data) {
  // CJK 标点符号范围：
  // \u3000-\u303F  CJK 符号和标点（「」『』【】〈〉《》等）
  // \uFF00-\uFFEF  全角 ASCII 和半角片假名（，。！？：；等）
  // \u2018-\u201F  通用标点补充区引号（''""等）
  // \uFE10-\uFE6F  CJK 兼容形式（竖排标点等）
  const cjkPunct = '[\\u3000-\\u303F\\uFF00-\\uFFEF\\u2018-\\u201F\\uFE10-\\uFE6F]';

  // 在开启端 emphasis marker 之后、CJK 标点之前插入零宽空格
  // 例：**「  ->  **\u200B「
  const reAfterMarker = new RegExp('(\\*{1,3})(' + cjkPunct + ')', 'gu');

  // 在 CJK 标点之后、关闭端 emphasis marker 之前插入零宽空格
  // 例：」**  ->  」\u200B**
  const reBeforeMarker = new RegExp('(' + cjkPunct + ')(\\*{1,3})', 'gu');

  data.content = data.content
    .replace(reAfterMarker, '$1\u200B$2')
    .replace(reBeforeMarker, '$1\u200B$2');

  return data;
});
