/**
 * ---------------------------------------------------------------------
 *
 * Minimal Effort Markdown - Simple Toggle functionality
 *
 * @copyright 2024 HellrazorX64
 * @license   MIT
 * @homepage  https://github.com/hellrazorx64/memarkdown
 *
 * ---------------------------------------------------------------------
 */

let markdownEnabled = false;
let tinymceEditor = null;

/**
 * Initialize the markdown toggle functionality
 */
function initMarkdownToggle() {
    // Enhanced selector detection for both GLPI 10.x and 11.x
    const detectAnswerTextarea = () => {
        const selectors = [
            'textarea[name="answer"]',           // GLPI 10.x standard
            'textarea[data-itemtype="answer"]',   // GLPI 11 potential
            '.rich-text-container textarea',      // GLPI 11 container
            '#answer',                           // Direct ID
            'textarea[id*="answer"]',            // Contains answer in ID
            '.form-field textarea[name="answer"]' // Form field container
        ];
        
        for (const selector of selectors) {
            const textarea = document.querySelector(selector);
            if (textarea) {
                return textarea;
            }
        }
        return null;
    };

    const answerTextarea = detectAnswerTextarea();
    if (!answerTextarea) {
        return false;
    }

    // Enhanced TinyMCE editor detection for GLPI 11
    if (typeof tinymce !== 'undefined') {
        tinymceEditor = null;
        
        // Method 1: By textarea ID (works for both versions)
        if (answerTextarea.id) {
            tinymceEditor = tinymce.get(answerTextarea.id);
        }
        
        // Method 2: Find by target element (more reliable)
        if (!tinymceEditor && tinymce.editors) {
            for (let i = 0; i < tinymce.editors.length; i++) {
                const editor = tinymce.editors[i];
                if (editor && editor.targetElm === answerTextarea) {
                    tinymceEditor = editor;
                    break;
                }
            }
        }
        
        // Method 3: First available editor (fallback)
        if (!tinymceEditor && tinymce.editors && tinymce.editors.length > 0) {
            tinymceEditor = tinymce.editors[0];
        }
        
        // Method 4: Try to find editor by container proximity (GLPI 11)
        if (!tinymceEditor && tinymce.editors) {
            const textareaContainer = answerTextarea.closest('.form-field, .field-container, .rich-text-container');
            if (textareaContainer) {
                for (let i = 0; i < tinymce.editors.length; i++) {
                    const editor = tinymce.editors[i];
                    const editorContainer = editor.getContainer();
                    if (editorContainer && textareaContainer.contains(editorContainer)) {
                        tinymceEditor = editor;
                        break;
                    }
                }
            }
        }
        
        if (tinymceEditor) {
            try {
                addMarkdownToggleButton();
                return true;
            } catch (error) {
                console.warn('Markdown plugin: Error adding toggle button:', error);
                return false;
            }
        }
    }
    
    return false;
}

/**
 * Add the markdown toggle button with enhanced GLPI 11 support
 */
function addMarkdownToggleButton() {
    if (!tinymceEditor || document.querySelector('.markdown-toggle-container')) {
        return;
    }

    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'markdown-toggle-container';
    toggleContainer.innerHTML = `
        <div class="form-check form-switch markdown-switch">
            <input class="form-check-input" type="checkbox" id="markdownToggle">
            <label class="form-check-label" for="markdownToggle">
                <i class="fas fa-markdown"></i> Markdown Mode
            </label>
        </div>
        <div class="markdown-help" style="display: none;">
            <small class="text-muted">
                <strong>Markdown Quick Reference:</strong><br>
                **bold** | *italic* | # Heading | ## Subheading | [link](url) | 
                ![image](url) | \`code\` | \`\`\`code block\`\`\` | - list item | 
                1. numbered list | > blockquote
            </small>
        </div>
    `;

    // Enhanced container detection for GLPI 11
    const editorContainer = tinymceEditor.getContainer();
    let insertLocation = editorContainer;
    
    // Try to find a better insertion point for GLPI 11
    const formField = editorContainer.closest('.form-field, .field-container, .rich-text-container');
    if (formField) {
        insertLocation = formField;
    }
    
    // Insert before the container
    insertLocation.parentNode.insertBefore(toggleContainer, insertLocation);

    const toggleCheckbox = document.getElementById('markdownToggle');
    const helpDiv = toggleContainer.querySelector('.markdown-help');
    
    toggleCheckbox.addEventListener('change', function() {
        toggleMarkdownMode(this.checked, helpDiv);
    });
    
    // Enhanced form detection for GLPI 11
    const detectForm = () => {
        const containers = [
            editorContainer.closest('form'),
            editorContainer.closest('.form-container'),
            editorContainer.closest('[data-itemtype]'),
            document.querySelector('form[name="form"]'),
            document.querySelector('form.form-horizontal')
        ];
        
        for (const container of containers) {
            if (container) return container;
        }
        return null;
    };
    
    const form = detectForm();
    if (form) {
        // Enhanced button detection for GLPI 11
        const detectSubmitButtons = () => {
            const selectors = [
                'input[type="submit"]',
                'button[type="submit"]',
                '.btn-primary[type="submit"]',
                '.btn[data-bs-toggle="modal"]',
                'button[name="add"]',
                'button[name="update"]'
            ];
            
            let buttons = [];
            selectors.forEach(selector => {
                buttons = buttons.concat(Array.from(form.querySelectorAll(selector)));
            });
            
            return buttons;
        };
        
        // Auto-disable markdown mode on form submission
        form.addEventListener('submit', function() {
            if (markdownEnabled) {
                toggleCheckbox.checked = false;
                toggleMarkdownMode(false, helpDiv);
            }
        });
        
        // Enhanced button click detection
        setTimeout(() => {
            const submitButtons = detectSubmitButtons();
            submitButtons.forEach(button => {
                button.addEventListener('click', function() {
                    if (markdownEnabled) {
                        setTimeout(() => {
                            toggleCheckbox.checked = false;
                            toggleMarkdownMode(false, helpDiv);
                        }, 10);
                    }
                });
            });
        }, 1000);
    }
}

/**
 * Improved toggle between markdown and rich text mode
 */
function toggleMarkdownMode(enabled, helpDiv) {
    markdownEnabled = enabled;
    const editorContainer = tinymceEditor.getContainer();
    
    if (enabled) {
        // Switch to markdown - HIDE the original editor completely
        const originalContent = tinymceEditor.getContent();
        const markdownContent = htmlToMarkdown(originalContent);
        
        // Hide the entire TinyMCE container instead of just the editor
        editorContainer.style.display = 'none';
        
        createMarkdownTextarea(markdownContent);
        helpDiv.style.display = 'block';
        
    } else {
        // Switch back to rich text - SHOW the original editor
        const markdownTextarea = document.getElementById('markdownTextarea');
        if (markdownTextarea) {
            const markdownContent = markdownTextarea.value;
            const htmlContent = markdownToHtml(markdownContent);
            
            // Update TinyMCE content and show the container
            tinymceEditor.setContent(htmlContent);
            editorContainer.style.display = '';
            
            // Remove markdown textarea
            markdownTextarea.remove();
            helpDiv.style.display = 'none';
        } else {
            // If no markdown textarea, just show the editor
            editorContainer.style.display = '';
            helpDiv.style.display = 'none';
        }
    }
}

/**
 * Create simple markdown textarea
 */
function createMarkdownTextarea(content) {
    const editorContainer = tinymceEditor.getContainer();
    
    const textarea = document.createElement('textarea');
    textarea.id = 'markdownTextarea';
    textarea.className = 'form-control markdown-textarea';
    textarea.rows = 15;
    textarea.value = content;
    textarea.style.width = '100%';
    textarea.style.fontFamily = 'Monaco, Menlo, "Ubuntu Mono", monospace';
    textarea.style.fontSize = '14px';
    textarea.style.lineHeight = '1.5';
    
    editorContainer.parentNode.insertBefore(textarea, editorContainer.nextSibling);
    
    // Simple sync - only update TinyMCE when typing
    textarea.addEventListener('input', function() {
        const htmlContent = markdownToHtml(this.value);
        tinymceEditor.setContent(htmlContent);
    });
}

/**
 * Simple HTML to Markdown conversion
 */
function htmlToMarkdown(html) {
    let markdown = html;
    
    // IMPROVED: Better detection of markdown content
    const markdownLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    const hasMarkdownLinks = markdownLinkPattern.test(markdown);
    const hasHtmlLinks = markdown.includes('<a ') || markdown.includes('<a>');
    
    // If content already looks like markdown and has no HTML links, just clean it up
    if (hasMarkdownLinks && !hasHtmlLinks) {
        // Extract text content from any paragraph tags and clean up
        markdown = markdown.replace(/<p[^>]*>/gi, '');
        markdown = markdown.replace(/<\/p>/gi, '\n');
        markdown = markdown.replace(/<br[^>]*>/gi, '\n');
        markdown = markdown.replace(/<[^>]*>/g, ''); // Remove any other HTML tags
        
        // Clean up HTML entities
        markdown = markdown.replace(/&nbsp;/g, ' ');
        markdown = markdown.replace(/&amp;/g, '&');
        markdown = markdown.replace(/&lt;/g, '<');
        markdown = markdown.replace(/&gt;/g, '>');
        markdown = markdown.replace(/&quot;/g, '"');
        markdown = markdown.replace(/&#39;/g, "'");
        
        // Clean up excessive line breaks but preserve structure
        markdown = markdown.replace(/\n{3,}/g, '\n\n');
        markdown = markdown.replace(/^\s+|\s+$/g, '');
        
        return markdown;
    }
    
    // Original conversion logic for actual HTML content
    // Handle code blocks FIRST (before other code processing)
    markdown = markdown.replace(/<pre><code(?:\s+class="language-(\w+)")?>([^<]*?)<\/code><\/pre>/gis, function(match, lang, code) {
        const language = lang || '';
        const cleanCode = code.replace(/<br\s*\/?>/g, '\n').trim();
        return '```' + language + '\n' + cleanCode + '\n```';
    });
    
    // Handle list items properly by converting HTML lists to markdown
    markdown = convertHtmlListsToMarkdown(markdown);
    
    // Headers
    markdown = markdown.replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, function(match, level, text) {
        const cleanText = text.replace(/<[^>]*>/g, '').trim();
        return '#'.repeat(parseInt(level)) + ' ' + cleanText + '\n\n';
    });
    
    // Bold and italic
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    
    // Inline code (after code blocks)
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    
    // Handle linked images BEFORE regular links and images
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>\s*<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>\s*<\/a>/gi, function(match, linkUrl, imgSrc, imgAlt) {
        return '\n\n[![' + imgAlt + '](' + imgSrc + ')](' + linkUrl + ')\n\n';
    });
    
    // Regular images (add spacing)
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, function(match, src, alt) {
        return '\n\n![' + alt + '](' + src + ')\n\n';
    });
    
    // IMPROVED: Regular links (after linked images) - Better handling for complex link content
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>((?:(?!<\/a>).)*)<\/a>/gi, function(match, href, linkText) {
        // Clean any remaining HTML tags from link text
        const cleanLinkText = linkText.replace(/<[^>]*>/g, '').trim();
        // Decode HTML entities in the link text
        const decodedLinkText = cleanLinkText
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
        return '[' + decodedLinkText + '](' + href + ')';
    });
    
    // Blockquotes
    markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1');
    
    // IMPROVED: Better line break and paragraph handling
    // Convert paragraph breaks to double newlines FIRST
    markdown = markdown.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
    markdown = markdown.replace(/<p[^>]*>/gi, '');
    markdown = markdown.replace(/<\/p>/gi, '\n');
    
    // Convert br tags to single newlines AFTER paragraph handling
    markdown = markdown.replace(/<br[^>]*>/gi, '\n');
    
    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    markdown = markdown.replace(/&nbsp;/g, ' ');
    markdown = markdown.replace(/&amp;/g, '&');
    markdown = markdown.replace(/&lt;/g, '<');
    markdown = markdown.replace(/&gt;/g, '>');
    markdown = markdown.replace(/&quot;/g, '"');
    markdown = markdown.replace(/&#39;/g, "'");
    
    // IMPROVED: Clean up spacing while preserving intentional line breaks
    // Remove excessive newlines but keep single and double newlines
    markdown = markdown.replace(/\n{4,}/g, '\n\n');
    
    // Ensure single newlines between consecutive links are preserved
    markdown = markdown.replace(/(\]\([^)]+\))(\[)/g, '$1\n$2');
    
    // Clean up any trailing/leading whitespace but preserve internal structure
    markdown = markdown.replace(/^\s+|\s+$/g, '');
    
    return markdown;
}

/**
 * Convert HTML lists to markdown format
 */
function convertHtmlListsToMarkdown(html) {
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

/**
 * Simple Markdown to HTML conversion
 */
function markdownToHtml(markdown) {
    let html = markdown;
    
    // IMPROVED: Handle links FIRST before other processing to avoid conflicts
    // This ensures that markdown links are converted to HTML before any other processing
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(match, linkText, url) {
        // Clean the URL and link text
        const cleanUrl = url.trim();
        const cleanLinkText = linkText.trim();
        return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${cleanLinkText}</a>`;
    });
    
    // IMPROVED: Handle images AFTER links to avoid conflicts
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function(match, alt, src) {
        const cleanSrc = src.trim();
        const cleanAlt = alt.trim();
        return `<img src="${cleanSrc}" alt="${cleanAlt}" class="img-fluid" />`;
    });
    
    // Code blocks first (but after links/images)
    html = html.replace(/```(\w+)?\n([\s\S]*?)\n```/g, function(match, lang, code) {
        const language = lang || 'text';
        return `<pre><code class="language-${language}">${code.trim()}</code></pre>`;
    });
        
    // Headers
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
        
    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
    // Inline code
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    
    // IMPROVED: Better line break handling
    // Split into lines first to handle them individually
    const lines = html.split('\n');
    const processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines (they'll become paragraph breaks)
        if (line === '') {
            processedLines.push('');
            continue;
        }
        
        // Check if this line contains only a link (or link with surrounding text)
        const linkOnlyPattern = /^<a href="[^"]*"[^>]*>[^<]*<\/a>$/;
        const linkWithTextPattern = /^.*<a href="[^"]*"[^>]*>[^<]*<\/a>.*$/;
        
        if (linkOnlyPattern.test(line) || linkWithTextPattern.test(line)) {
            // Wrap standalone links or lines with links in paragraphs
            processedLines.push(`<p>${line}</p>`);
        } else {
            // Regular line
            processedLines.push(line);
        }
    }
    
    // Join back with no separators since we're adding <p> tags
    html = processedLines.join('');
    
    // Handle lists properly
    html = convertMarkdownLists(html);
    
    // Clean up any remaining empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    
    // For content that doesn't have explicit paragraph tags, wrap it
    if (!html.includes('<p>') && !html.includes('<h') && !html.includes('<pre>') && !html.includes('<ul>') && !html.includes('<ol>')) {
        html = '<p>' + html + '</p>';
    }
        
    return html;
}

/**
 * Convert markdown lists to proper HTML lists
 */
function convertMarkdownLists(html) {
    const lines = html.split('<br />');
    const result = [];
    let inUnorderedList = false;
    let inOrderedList = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check for unordered list items (- item or * item)
        const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
        if (unorderedMatch) {
            if (!inUnorderedList) {
                if (inOrderedList) {
                    result.push('</ol>');
                    inOrderedList = false;
                }
                result.push('<ul>');
                inUnorderedList = true;
            }
            result.push(`<li>${unorderedMatch[1]}</li>`);
            continue;
        }
        
        // Check for ordered list items (1. item, 2. item, etc.)
        const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
        if (orderedMatch) {
            if (!inOrderedList) {
                if (inUnorderedList) {
                    result.push('</ul>');
                    inUnorderedList = false;
                }
                result.push('<ol>');
                inOrderedList = true;
            }
            result.push(`<li>${orderedMatch[1]}</li>`);
            continue;
        }
        
        // Not a list item - close any open lists
        if (inUnorderedList) {
            result.push('</ul>');
            inUnorderedList = false;
        }
        if (inOrderedList) {
            result.push('</ol>');
            inOrderedList = false;
        }
        
        // Add the regular line
        if (line) {
            result.push(line);
        }
    }
    
    // Close any remaining open lists
    if (inUnorderedList) {
        result.push('</ul>');
    }
    if (inOrderedList) {
        result.push('</ol>');
    }
    
    return result.join('');
}