/**
 * Hexo Image Extension
 * 语法: ![描述|宽度](url)
 * 功能:
 * 1. 自动处理图片圆角
 * 2. 分离宽度设置
 * 3. 若有描述，生成卡片式带有灰色背景的题注区
 */

const fs = require('fs');
const path = require('path');

// 1. 核心逻辑：替换 HTML 中的 img 标签
hexo.extend.filter.register('after_post_render', function (data) {
	// 正则捕获：src="...", alt="描述|宽度"
	// 兼容可能的其他属性顺序
	const regex = /<img([^>]+?)alt="([^"]*?)\|(\d+)"([^>]*?)>/g;

	data.content = data.content.replace(regex, function (match, preAttributes, altText, width, postAttributes) {

		// 清洗 description，防止 undefined
		const desc = altText ? altText.trim() : "";
		const widthPx = width;

		// 基础图片样式：保持原始属性，但修正 alt（移除|宽度部分），添加圆角类
		// style="width: 100%" 确保图片填满我们设定的容器宽度
		const imgTag = `<img${preAttributes}alt="${desc}"${postAttributes} style="width: 100%; height: auto; display: block; border-radius: 16px;">`;

		// 结构构建
		if (desc) {
			// 场景 A: 有描述 -> 灰色边框 + 灰色背景描述区 + 斜体
			return `<figure class="hexo-img-ext-container with-caption" style="width: ${widthPx}px;"><div class="img-wrapper">${imgTag}</div><figcaption class="img-caption"><em>${desc}</em></figcaption></figure>`;
		} else {
			// 场景 B: 无描述 -> 仅圆角图片 + 宽度控制
			return `<div class="hexo-img-ext-container" style="width: ${widthPx}px;">${imgTag}</div>`;
		}
	});

	return data;
});

// 2. 注入器：在 head 标签结束前引入 CSS 文件
hexo.extend.injector.register('head_end', () => {
	const cssPath = path.join(hexo.theme_dir, 'source', 'css', 'img_extension.css');

	try {
		const cssContent = fs.readFileSync(cssPath, 'utf8');
		return `<style>${cssContent}</style>`;
	} catch (e) {
		console.error('Hexo Image Ext Plugin Error: Could not read img_extension.css', e);
		return '';
	}
});