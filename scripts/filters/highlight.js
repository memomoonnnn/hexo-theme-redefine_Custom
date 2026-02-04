/**
 * scripts/filters/highlight.js
 * Feature: Highlight text using `==text==` syntax.
 */

const fs = require('fs');
const path = require('path');
const logger = require('hexo-log');

// Register the filter
hexo.extend.filter.register('before_post_render', function (data) {
    const highlightRegex = /==([^=]+)==/g;

    if (highlightRegex.test(data.content)) {
        data.content = data.content.replace(highlightRegex, function (match, content) {
            return `<span class="highlight-text">${content}</span>`;
        });
    }

    return data;
}, 5);

// Inject CSS
hexo.extend.injector.register('head_end', () => {
    const cssPath = path.join(hexo.theme_dir, 'source', 'css', 'highlight.css');
    
    try {
        if (fs.existsSync(cssPath)) {
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            return `<style>${cssContent}</style>`;
        }
    } catch (e) {
        logger.error('Highlight Plugin Error (CSS):', e);
    }

    return '';
});
