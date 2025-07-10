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

// Store base64 images during conversion
const base64ImageMap = new Map();

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
    const textarea = document.createElement('textarea');
    textarea.id = 'markdownTextarea';
    textarea.className = 'form-control markdown-textarea';
    textarea.rows = 15;
    textarea.value = content;
    textarea.style.width = '100%';
    textarea.style.fontFamily = 'Monaco, Menlo, "Ubuntu Mono", monospace';
    textarea.style.fontSize = '14px';
    textarea.style.lineHeight = '1.5';
    
    const editorContainer = tinymceEditor.getContainer();
    editorContainer.parentNode.insertBefore(textarea, editorContainer.nextSibling);
    
    // Simple sync - only update TinyMCE when typing
    textarea.addEventListener('input', function() {
        const htmlContent = markdownToHtml(this.value);
        tinymceEditor.setContent(htmlContent);
    });

    // Focus and maintain scroll position
    textarea.focus();
}

function markdownToHtml(markdown) {
    let html = markdown;

    // Headers (largest to smallest)
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // Lists - handle them before paragraphs
    html = html.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\s*(\d+)\.\s+(.+)$/gm, '<li>$2</li>');
    html = html.replace(/(<li>[^<]+<\/li>\s*)+/g, '<ul>$&</ul>');

    // Code blocks and inline code
    html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold and italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Images - Handle them before links to avoid conflicts
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
        const style = src.includes('document.send.php') ? '' : ' style="max-width:100%;"';
        return `<img src="${src}" alt="${alt}"${style}>`;
    });

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Process lines - wrap each non-empty line in a paragraph with reduced spacing
    const lines = html.split('\n');
    const processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
            // Empty line - add a paragraph break
            processedLines.push('<p>&nbsp;</p>');
            continue;
        }
        
        // Block elements - don't wrap in paragraphs
        if (line.match(/^<(h[1-6]|ul|ol|li|pre|img|div|blockquote)/)) {
            processedLines.push(line);
        } else {
            // Inline content - wrap in paragraph with reduced margin
            processedLines.push(`<p style="margin: 0.2em 0;">${line}</p>`);
        }
    }
    
    return processedLines.join('');
}

function htmlToMarkdown(html) {
    let markdown = html;

    // Handle linked images first (images wrapped in anchor tags)
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>\s*<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*>\s*<\/a>/g, (match, href, src, alt) => {
        const altText = alt || src.split('/').pop().split('?')[0] || 'image';
        return `![${altText}](${src})`;
    });

    // Headers
    markdown = markdown.replace(/<h6[^>]*>(.+?)<\/h6>/g, '###### $1\n');
    markdown = markdown.replace(/<h5[^>]*>(.+?)<\/h5>/g, '##### $1\n');
    markdown = markdown.replace(/<h4[^>]*>(.+?)<\/h4>/g, '#### $1\n');
    markdown = markdown.replace(/<h3[^>]*>(.+?)<\/h3>/g, '### $1\n');
    markdown = markdown.replace(/<h2[^>]*>(.+?)<\/h2>/g, '## $1\n');
    markdown = markdown.replace(/<h1[^>]*>(.+?)<\/h1>/g, '# $1\n');

    // Lists - handle nested content properly
    markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, (match, content) => {
        return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (liMatch, liContent) => {
            const cleanContent = liContent.replace(/<[^>]*>/g, '').trim();
            return `- ${cleanContent}\n`;
        });
    });
    markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, (match, content) => {
        let counter = 1;
        return content.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (liMatch, liContent) => {
            const cleanContent = liContent.replace(/<[^>]*>/g, '').trim();
            return `${counter++}. ${cleanContent}\n`;
        });
    });

    // Code blocks and inline code
    markdown = markdown.replace(/<pre><code[^>]*>([\s\S]+?)<\/code><\/pre>/g, '```\n$1\n```\n');
    markdown = markdown.replace(/<code[^>]*>([^<]+)<\/code>/g, '`$1`');

    // Bold and italic
    markdown = markdown.replace(/<strong[^>]*>([^<]+)<\/strong>/g, '**$1**');
    markdown = markdown.replace(/<em[^>]*>([^<]+)<\/em>/g, '*$1*');

    // Standalone images (not wrapped in links)
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*>/g, (match, src, alt) => {
        const altText = alt || src.split('/').pop().split('?')[0] || 'image';
        return `![${altText}](${src})`;
    });

    // Regular links (after handling linked images)
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/g, '[$2]($1)');

    // Paragraphs - convert to single newlines, not double
    markdown = markdown.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, (match, content) => {
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        return cleanContent ? `${cleanContent}\n` : '';
    });
    
    // Handle line breaks
    markdown = markdown.replace(/<br[^>]*>/g, '\n');

    // Clean up: remove excessive newlines but preserve intentional spacing
    markdown = markdown.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines in a row
    markdown = markdown.trim();

    return markdown;
}