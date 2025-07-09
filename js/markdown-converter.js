/**
 * ---------------------------------------------------------------------
 *
 * Minimal Effort Markdown - Enhanced Converter with Obsidian Support
 *
 * @copyright 2024 HellrazorX64
 * @license   MIT
 * @homepage  https://github.com/hellrazorx64/memarkdown
 *
 * ---------------------------------------------------------------------
 */

/**
 * Enhanced Markdown to HTML converter with Obsidian support
 */
class MarkdownConverter {
    constructor() {
        this.obsidianFeatures = true;
    }

    /**
     * Convert markdown text to HTML with Obsidian extensions
     */
    toHtml(markdown) {
        let html = markdown;

        // Obsidian-specific features
        if (this.obsidianFeatures) {
            html = this.parseObsidianFeatures(html);
        }

        // Standard markdown parsing
        html = this.parseStandardMarkdown(html);

        return html;
    }

    /**
     * Convert HTML back to markdown (best effort)
     */
    toMarkdown(html) {
        // This is the inverse of toHtml - convert HTML back to markdown
        let markdown = html;

        // Remove HTML comments
        markdown = markdown.replace(/<!--[\s\S]*?-->/g, '');

        // Convert back Obsidian features first
        if (this.obsidianFeatures) {
            markdown = this.unparseObsidianFeatures(markdown);
        }

        // Convert standard HTML back to markdown
        markdown = this.unparseStandardMarkdown(markdown);

        return markdown;
    }

    /**
     * Parse Obsidian-specific markdown features
     */
    parseObsidianFeatures(text) {
        // Wikilinks [[Link]] or [[Link|Display Text]]
        text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '<a href="#$1" class="wikilink" data-note="$1">$2</a>');
        text = text.replace(/\[\[([^\]]+)\]\]/g, '<a href="#$1" class="wikilink" data-note="$1">$1</a>');

        // Tags #tag
        text = text.replace(/(^|\s)#([a-zA-Z0-9_-]+)/g, '$1<span class="obsidian-tag" data-tag="$2">#$2</span>');

        // Highlights ==text==
        text = text.replace(/==([^=]+)==/g, '<mark>$1</mark>');

        // Strikethrough ~~text~~
        text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');

        // Math blocks $$...$$
        text = text.replace(/\$\$([\s\S]*?)\$\$/g, '<div class="math-block">$1</div>');

        // Inline math $...$
        text = text.replace(/\$([^$\n]+)\$/g, '<span class="math-inline">$1</span>');

        // Callouts/Admonitions > [!type] Title
        text = text.replace(/^>\s*\[!(\w+)\]\s*(.*?)$/gm, '<div class="callout callout-$1"><div class="callout-title">$2</div>');
        text = text.replace(/^>\s*(.+)$/gm, '<div class="callout-content">$1</div>');

        // Footnotes [^1]
        text = text.replace(/\[\^([^\]]+)\]/g, '<sup class="footnote-ref"><a href="#fn-$1" id="fnref-$1">$1</a></sup>');

        // Embed files ![[file.ext]]
        text = text.replace(/!\[\[([^\]]+\.(png|jpg|jpeg|gif|pdf|mp4|webm))\]\]/gi, 
            '<div class="embed-file" data-file="$1">Embedded: $1</div>');

        return text;
    }

    /**
     * Parse standard markdown features
     */
    parseStandardMarkdown(text) {
        // Headers (### Header)
        text = text.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
        text = text.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
        text = text.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
        text = text.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
        text = text.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
        text = text.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

        // Code blocks ```language
        text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
            const language = lang ? ` class="language-${lang}"` : '';
            return `<pre><code${language}>${code.trim()}</code></pre>`;
        });

        // Inline code `code`
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold **text** or __text__
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');

        // Italic *text* or _text_
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

        // Links [text](url) or [text](url "title")
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\s+"([^"]+)"\)/g, '<a href="$2" title="$3" target="_blank">$1</a>');
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // Images ![alt](url) or ![alt](url "title")
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\s+"([^"]+)"\)/g, '<img src="$2" alt="$1" title="$3" style="max-width: 100%;">');
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%;">');

        // Horizontal rules --- or ***
        text = text.replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '<hr>');

        // Blockquotes > text
        text = text.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');

        // Unordered lists - item or * item
        text = text.replace(/^[\s]*[-*+]\s+(.+)$/gm, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Ordered lists 1. item
        text = text.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li>$1</li>');

        // Tables (basic support)
        text = this.parseTables(text);

        // Line breaks and paragraphs
        text = text.replace(/\n\s*\n/g, '</p><p>');
        text = text.replace(/\n/g, '<br>');
        
        // Wrap in paragraphs if not already wrapped
        if (!text.match(/^<[^>]+>/)) {
            text = '<p>' + text + '</p>';
        }

        return text;
    }

    /**
     * Parse markdown tables
     */
    parseTables(text) {
        const tableRegex = /^\|(.+)\|\s*\n\|[-\s|:]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm;
        
        return text.replace(tableRegex, function(match, header, rows) {
            let table = '<table class="table table-striped">';
            
            // Parse header
            const headerCells = header.split('|').map(cell => cell.trim()).filter(cell => cell);
            table += '<thead><tr>';
            headerCells.forEach(cell => {
                table += `<th>${cell}</th>`;
            });
            table += '</tr></thead>';
            
            // Parse rows
            table += '<tbody>';
            rows.split('\n').forEach(row => {
                if (row.trim()) {
                    const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
                    if (cells.length > 0) {
                        table += '<tr>';
                        cells.forEach(cell => {
                            table += `<td>${cell}</td>`;
                        });
                        table += '</tr>';
                    }
                }
            });
            table += '</tbody></table>';
            
            return table;
        });
    }

    /**
     * Convert Obsidian HTML features back to markdown
     */
    unparseObsidianFeatures(html) {
        // Wikilinks
        html = html.replace(/<a href="#([^"]+)" class="wikilink" data-note="[^"]+">([^<]+)<\/a>/g, '[[$1|$2]]');
        html = html.replace(/<a href="#([^"]+)" class="wikilink" data-note="[^"]+">([^<]+)<\/a>/g, '[[$2]]');

        // Tags
        html = html.replace(/<span class="obsidian-tag" data-tag="([^"]+)">#[^<]+<\/span>/g, '#$1');

        // Highlights
        html = html.replace(/<mark>([^<]+)<\/mark>/g, '==$1==');

        // Strikethrough
        html = html.replace(/<del>([^<]+)<\/del>/g, '~~$1~~');

        // Math
        html = html.replace(/<div class="math-block">([^<]+)<\/div>/g, '$$$$1$$');
        html = html.replace(/<span class="math-inline">([^<]+)<\/span>/g, '$$$1$$');

        return html;
    }

    /**
     * Convert standard HTML back to markdown
     */
    unparseStandardMarkdown(html) {
        // Headers
        html = html.replace(/<h([1-6])>([^<]+)<\/h[1-6]>/g, function(match, level, text) {
            return '#'.repeat(parseInt(level)) + ' ' + text;
        });

        // Bold and italic
        html = html.replace(/<strong>([^<]+)<\/strong>/g, '**$1**');
        html = html.replace(/<em>([^<]+)<\/em>/g, '*$1*');

        // Code blocks FIRST (preserve language info)
        html = html.replace(/<pre><code(?:\s+class="language-(\w+)")?>([^<]*?)<\/code><\/pre>/gis, function(match, lang, code) {
            const language = lang || '';
            const cleanCode = code.replace(/<br\s*\/?>/g, '\n').trim();
            return '```' + language + '\n' + cleanCode + '\n```';
        });

        // Inline code (after code blocks)
        html = html.replace(/<code>([^<]+)<\/code>/g, '`$1`');

        // Lists - improved handling
        html = this.convertHtmlListsToMarkdown(html);

        // Links
        html = html.replace(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g, '[$2]($1)');

        // Images
        html = html.replace(/<img src="([^"]+)" alt="([^"]*)"[^>]*>/g, '![$2]($1)');

        // Blockquotes
        html = html.replace(/<blockquote>([^<]+)<\/blockquote>/g, '> $1');

        // Line breaks and paragraphs
        html = html.replace(/<br\s*\/?>/g, '\n');
        html = html.replace(/<\/p><p>/g, '\n\n');
        html = html.replace(/<\/?p>/g, '');

        // Remove remaining HTML tags
        html = html.replace(/<[^>]*>/g, '');

        // Decode HTML entities
        html = html.replace(/&nbsp;/g, ' ');
        html = html.replace(/&amp;/g, '&');
        html = html.replace(/&lt;/g, '<');
        html = html.replace(/&gt;/g, '>');
        html = html.replace(/&quot;/g, '"');
        html = html.replace(/&#39;/g, "'");

        return html.trim();
    }

    /**
     * Convert HTML lists to markdown format (improved)
     */
    convertHtmlListsToMarkdown(html) {
        // Handle unordered lists
        html = html.replace(/<ul[^>]*>(.*?)<\/ul>/gis, function(match, content) {
            const items = content.match(/<li[^>]*>(.*?)<\/li>/gis);
            if (items) {
                return items.map(item => {
                    const text = item.replace(/<li[^>]*>(.*?)<\/li>/is, '$1').replace(/<[^>]*>/g, '').trim();
                    return '- ' + text;
                }).join('\n') + '\n\n';
            }
            return content;
        });
        
        // Handle ordered lists
        html = html.replace(/<ol[^>]*>(.*?)<\/ol>/gis, function(match, content) {
            const items = content.match(/<li[^>]*>(.*?)<\/li>/gis);
            if (items) {
                return items.map((item, index) => {
                    const text = item.replace(/<li[^>]*>(.*?)<\/li>/is, '$1').replace(/<[^>]*>/g, '').trim();
                    return (index + 1) + '. ' + text;
                }).join('\n') + '\n\n';
            }
            return content;
        });
        
        return html;
    }
}

// Global instance
window.markdownConverter = new MarkdownConverter(); 