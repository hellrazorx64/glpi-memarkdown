/**
 * ---------------------------------------------------------------------
 *
 * Minimal Effort Markdown - Direct Initialization
 *
 * @copyright 2024 HellrazorX64
 * @license   MIT
 * @homepage  https://github.com/hellrazorx64/memarkdown
 *
 * ---------------------------------------------------------------------
 */

// Force initialization with multiple strategies
(function() {
    'use strict';
    
    let initialized = false;
    let attempts = 0;
    const maxAttempts = 50;
    
    function forceMarkdownInit() {
        attempts++;
        
        if (initialized) {
            return true;
        }
        
        // Check if we're on a knowledge base page
        const isKnowledgeBasePage = window.location.href.includes('knowbaseitem') || 
                                   document.querySelector('textarea[name="answer"]') ||
                                   document.querySelector('#answer');
        
        if (!isKnowledgeBasePage) {
            return false;
        }
        
        // Don't initialize if already done by the main toggle script
        if (document.querySelector('.markdown-toggle-container')) {
            return true;
        }
        
        // Check if the toggle function exists
        if (typeof initMarkdownToggle === 'function') {
            const result = initMarkdownToggle();
            if (result) {
                initialized = true;
                addMarkdownToggleDirectly();
                return true;
            }
        } else {
            // Try to initialize directly
            addMarkdownToggleDirectly();
        }
        
        if (attempts < maxAttempts) {
            setTimeout(forceMarkdownInit, 1000);
        }
        
        return false;
    }
    
    function addMarkdownToggleDirectly() {
        // Find TinyMCE editor
        let editor = null;
        
        if (typeof tinymce !== 'undefined') {
            const editors = tinymce.editors || [];
            if (editors.length > 0) {
                editor = editors[0]; // Get first editor
            } else {
                return false;
            }
        } else {
            return false;
        }
        
        // Check if toggle already exists
        if (document.querySelector('.markdown-toggle-container')) {
            return true;
        }
        
        // Create toggle UI
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

        // Insert the toggle container above the TinyMCE editor
        const editorContainer = editor.getContainer();
        editorContainer.parentNode.insertBefore(toggleContainer, editorContainer);

        // Add event listener for the toggle
        const toggleCheckbox = document.getElementById('markdownToggle');
        const helpDiv = toggleContainer.querySelector('.markdown-help');
        
        if (toggleCheckbox) {
            toggleCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    helpDiv.style.display = 'block';
                    // Switch to markdown mode
                    editor.hide();
                    createMarkdownTextarea(editor);
                } else {
                    helpDiv.style.display = 'none';
                    // Switch back to rich text
                    const markdownTextarea = document.getElementById('markdownTextarea');
                    if (markdownTextarea) {
                        editor.setContent(markdownTextarea.value);
                        markdownTextarea.remove();
                    }
                    editor.show();
                }
            });
            
            initialized = true;
            return true;
        }
        
        return false;
    }
    
    function createMarkdownTextarea(editor) {
        const editorContainer = editor.getContainer();
        
        const textarea = document.createElement('textarea');
        textarea.id = 'markdownTextarea';
        textarea.className = 'form-control markdown-textarea';
        textarea.rows = 15;
        textarea.value = htmlToMarkdownSimple(editor.getContent());
        textarea.style.width = '100%';
        textarea.style.fontFamily = 'Monaco, Menlo, "Ubuntu Mono", monospace';
        textarea.style.fontSize = '14px';
        textarea.style.lineHeight = '1.5';
        
        editorContainer.parentNode.insertBefore(textarea, editorContainer.nextSibling);
    }
    
    function htmlToMarkdownSimple(html) {
        return html
            .replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, function(match, level, text) {
                return '#'.repeat(parseInt(level)) + ' ' + text + '\n\n';
            })
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
            .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi, '```\n$1\n```')
            .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
            .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
            .replace(/<br[^>]*>/gi, '\n')
            .replace(/<p[^>]*>/gi, '')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }
    
    // Start initialization attempts
    // Try immediately
    setTimeout(forceMarkdownInit, 100);
    
    // Try when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(forceMarkdownInit, 500);
        });
    } else {
        setTimeout(forceMarkdownInit, 500);
    }
    
    // Try when window loads
    window.addEventListener('load', function() {
        setTimeout(forceMarkdownInit, 1000);
    });
    
    // Try every 2 seconds for first 30 seconds
    for (let i = 1; i <= 15; i++) {
        setTimeout(forceMarkdownInit, i * 2000);
    }
    
})(); 