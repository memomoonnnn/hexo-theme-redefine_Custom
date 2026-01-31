/**
 * scripts/filters/footnote.js
 * Feature: Inline footnotes using `^[text]` syntax.
 */

const fs = require('fs');
const path = require('path');
const logger = require('hexo-log');

// Helper to escape quotes for attribute value
function escapeAttribute(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Register the filter
hexo.extend.filter.register('before_post_render', function (data) {
    const footnoteRegex = /\^\[([^\]]+)\]/g;

    if (footnoteRegex.test(data.content)) {
        data.content = data.content.replace(footnoteRegex, function (match, content) {
            // Render the content inside the footnote
            const renderedContent = hexo.render.renderSync({
                text: content,
                engine: 'markdown',
                gfm: true,
                breaks: true
            });

            const cleanContent = renderedContent.replace(/^<p>|<\/p>\n?$/g, '');
            const encodedContent = escapeAttribute(cleanContent);

            // Return a span with data attribute only. Content is empty to hide from TOC.
            return `<span class="footnote-ref" data-content="${encodedContent}"></span>`;
        });
    }

    return data;
});

// Inject CSS and JS
hexo.extend.injector.register('head_end', () => {
    const cssPath = path.join(hexo.theme_dir, 'source', 'css', 'footnote.css');
    let output = '';

    // Inject CSS
    try {
        if (fs.existsSync(cssPath)) {
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            output += `<style>${cssContent}</style>`;
        }
    } catch (e) {
        logger.error('Footnote Plugin Error (CSS):', e);
    }

    // Inject Client-side hydration script
    const scriptContent = `
    document.addEventListener("DOMContentLoaded", function() {
        var footnotes = document.querySelectorAll('.footnote-ref');
        footnotes.forEach(function(el) {
            if (el.getAttribute('data-hydrated')) return;
            
            var content = el.getAttribute('data-content');
            if (content) {
                // Create the tooltip element
                var tooltip = document.createElement('span');
                tooltip.className = 'footnote-content';
                tooltip.innerHTML = content; // content is already HTML (from markdown render) but was attribute encoded. 
                // Browsers automatically decode attribute values when using getAttribute, 
                // but we need to be careful if we set innerHTML. 
                // Actually, escapeHtml encoded < > etc. 
                // getAttribute returns the *decoded* value? 
                // No, getAttribute returns the value as string.
                // If I saved "&lt;b&gt;" in data-content, getAttribute returns "&lt;b&gt;".
                // Setting innerHTML to "&lt;b&gt;" renders <b> text, not bold tag.
                // Wait. escapeHtml needed for the HTML string assignment to 'data-content="..."'.
                // If I put content into data-content="<b>bold</b>", it breaks the HTML markup.
                // So I must escape quotes.
                // But do I escape brackets?
                // If I escape brackets, then getAttribute returns "&lt;...".
                // Then innerHTML renders "&lt;..." as literal text <...
                
                // Correction: We need to store the HTML safely in the attribute.
                // We should ONLY escape quotes for the attribute wrapper.
                // BUT if we don't escape <>, the HTML parser might get confused? 
                // No, < inside quotes is valid HTML5.
                
                // Let's adjust escape function to only escape quotes for the attribute value.
                
                el.appendChild(tooltip);
                el.setAttribute('data-hydrated', 'true');
            }
        });
    });
    `;
    
    // We need to fix the escape logic in the filter above first! 
    // If I use escapeHtml as defined (escaping < >), then innerHTML will show tags as text.
    // I should only escape " and ' for the attribute.
    
    output += `<script>${scriptContent}</script>`;

    return output;
});
