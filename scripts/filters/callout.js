const fs = require('fs');
const path = require('path');

// --- 功能 1: 注册 Markdown 解析过滤器 ---

hexo.extend.filter.register('before_post_render', function (data) {
	// 正则表达式匹配 Callout 块
	const calloutRegex = /^> ?\[!([a-zA-Z]+)\]([-+]?)(.*)\n((?:> ?.*\n?)*)/gm;

	data.content = data.content.replace(calloutRegex, function (match, type, collapse, title, content) {

		// 元数据处理
		const calloutType = type.toLowerCase();
		const isCollapsible = collapse.length > 0;
		const isCollapsed = collapse === '-';
		const displayTitle = title.trim() || type.toUpperCase();

		// 图标映射 (Obsidian 风格 -> FontAwesome)
		const iconMap = {
			'abstract': 'fa-solid fa-clipboard-list',
			'info': 'fa-solid fa-circle-info',
			'note': 'fa-solid fa-pencil',
			'warning': 'fa-solid fa-triangle-exclamation',
			'tip': 'fa-solid fa-fire',
			'example': 'fa-solid fa-list',
			// 常用别名/扩展
			'todo': 'fa-solid fa-check',
			'question': 'fa-solid fa-circle-question',
			'quote': 'fa-solid fa-quote-left',
			'bug': 'fa-solid fa-bug',
			'error': 'fa-solid fa-circle-xmark',
			'success': 'fa-solid fa-circle-check',
			'fail': 'fa-solid fa-circle-xmark'
		};

		// 获取对应图标，默认为 pencil (note)
		const iconClass = iconMap[calloutType] || 'fa-solid fa-pencil';

		// 内容清洗与渲染
		let cleanContent = content.replace(/^> ?/gm, '');

		// 修复 CJK 标点紧贴 emphasis marker 导致加粗/斜体失效的问题
		// （callout 内容使用 hexo.render.renderSync 渲染，不经过 before_post_render 过滤器）
		const cjkPunct = '[\\u3000-\\u303F\\uFF00-\\uFFEF\\u2018-\\u201F\\uFE10-\\uFE6F]';
		const reAfter = new RegExp('(\\*{1,3})(' + cjkPunct + ')', 'gu');
		const reBefore = new RegExp('(' + cjkPunct + ')(\\*{1,3})', 'gu');
		cleanContent = cleanContent.replace(reAfter, '$1\u200B$2').replace(reBefore, '$1\u200B$2');

		const renderedContent = hexo.render.renderSync({
			text: cleanContent,
			engine: 'markdown',
			gfm: true,
			breaks: true
		});

		// HTML 构建
		if (isCollapsible) {
			const openAttr = isCollapsed ? '' : 'open';
			return `
<details class="callout callout-${calloutType}" ${openAttr}>
    <summary class="callout-title">
        <span class="callout-icon"><i class="${iconClass}"></i></span>
        <span class="callout-text">${displayTitle}</span>
    </summary>
    <div class="callout-content">${renderedContent}</div>
</details>

`;
		} else {
			return `
<div class="callout callout-${calloutType}">
    <div class="callout-title">
        <span class="callout-icon"><i class="${iconClass}"></i></span>
        <span class="callout-text">${displayTitle}</span>
    </div>
    <div class="callout-content">${renderedContent}</div>
</div>

`;
		}
	});

	return data;
});

// --- 功能 2: 读取 CSS 文件并注入 ---

// 使用 Hexo 5.0+ 的 Injector API
hexo.extend.injector.register('head_end', () => {
	// 获取 CSS 文件的绝对路径
	// hexo.theme_dir 是主题目录
	const cssPath = path.join(hexo.theme_dir, 'source', 'css', 'callout.css');

	try {
		// 同步读取文件内容
		const cssContent = fs.readFileSync(cssPath, 'utf8');
		// 返回带 <style> 标签的字符串
		return `<style>${cssContent}</style>`;
	} catch (e) {
		console.error('Hexo Callout Plugin Error: Could not read callout.css', e);
		return '';
	}
});