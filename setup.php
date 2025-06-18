<?php
/**
 * ---------------------------------------------------------------------
 *
 * Minimal Effort Markdown - GLPI Plugin
 *
 * @copyright 2024 HellrazorX64
 * @license   MIT
 * @homepage  https://github.com/hellrazorx64/memarkdown
 *
 * ---------------------------------------------------------------------
 */

define('PLUGIN_MEMARKDOWN_VERSION', '1.1.0');
define('PLUGIN_MEMARKDOWN_MIN_GLPI', '10.0.0');
define('PLUGIN_MEMARKDOWN_MAX_GLPI', '12.0.0');

/**
 * Init the hooks of the plugins - Needed
 */
function plugin_init_memarkdown()
{
    global $PLUGIN_HOOKS;

    $PLUGIN_HOOKS['csrf_compliant']['memarkdown'] = true;
    
    // Add JavaScript and CSS with version detection
    if (version_compare(GLPI_VERSION, '11.0.0', '>=')) {
        // GLPI 11+ requires assets to be in public folder
        $PLUGIN_HOOKS['add_css']['memarkdown'] = 'public/css/markdown.css';
        $PLUGIN_HOOKS['add_javascript']['memarkdown'] = [
            'public/js/markdown-converter.js',
            'public/js/markdown-toggle.js',
            'public/js/markdown-init.js'
        ];
    } else {
        // GLPI 10.x uses direct css/js folders
        $PLUGIN_HOOKS['add_css']['memarkdown'] = 'css/markdown.css';
        $PLUGIN_HOOKS['add_javascript']['memarkdown'] = [
            'js/markdown-converter.js',
            'js/markdown-toggle.js',
            'js/markdown-init.js'
        ];
    }
    
    // Use more robust hooks for GLPI 11 compatibility
    if (version_compare(GLPI_VERSION, '11.0.0', '>=')) {
        // GLPI 11+ hooks
        $PLUGIN_HOOKS['post_item_form']['memarkdown'] = [
            'KnowbaseItem' => 'plugin_memarkdown_post_item_form_v11'
        ];
        $PLUGIN_HOOKS['post_show_item']['memarkdown'] = [
            'KnowbaseItem' => 'plugin_memarkdown_post_show_item_v11'
        ];
    } else {
        // GLPI 10.x hooks
        $PLUGIN_HOOKS['post_item_form']['memarkdown'] = [
            'KnowbaseItem' => 'plugin_memarkdown_post_item_form'
        ];
        $PLUGIN_HOOKS['post_show_item']['memarkdown'] = [
            'KnowbaseItem' => 'plugin_memarkdown_post_show_item'
        ];
        $PLUGIN_HOOKS['post_show_form']['memarkdown'] = [
            'KnowbaseItem' => 'plugin_memarkdown_post_show_form'
        ];
    }
    
    // Data processing hooks (should work for both versions)
    $PLUGIN_HOOKS['pre_item_add']['memarkdown'] = [
        'KnowbaseItem' => 'plugin_memarkdown_pre_item_add'
    ];
    $PLUGIN_HOOKS['pre_item_update']['memarkdown'] = [
        'KnowbaseItem' => 'plugin_memarkdown_pre_item_update'
    ];
}

/**
 * Get the name and the version of the plugin - Needed
 */
function plugin_version_memarkdown()
{
    return [
        'name'           => 'Minimal Effort Markdown',
        'version'        => PLUGIN_MEMARKDOWN_VERSION,
        'author'         => 'HellrazorX64',
        'license'        => 'MIT',
        'homepage'       => 'https://github.com/hellrazorx64/memarkdown',
        'requirements'   => [
            'glpi' => [
                'min' => PLUGIN_MEMARKDOWN_MIN_GLPI,
                'max' => PLUGIN_MEMARKDOWN_MAX_GLPI,
            ]
        ]
    ];
}

/**
 * Optional : check prerequisites before install : may print errors or add to message after redirect
 */
function plugin_memarkdown_check_prerequisites()
{
    if (version_compare(GLPI_VERSION, PLUGIN_MEMARKDOWN_MIN_GLPI, 'lt')
        || version_compare(GLPI_VERSION, PLUGIN_MEMARKDOWN_MAX_GLPI, 'ge')) {
        if (method_exists('Plugin', 'messageIncompatible')) {
            echo Plugin::messageIncompatible('core', PLUGIN_MEMARKDOWN_MIN_GLPI, PLUGIN_MEMARKDOWN_MAX_GLPI);
        }
        return false;
    }
    return true;
}

/**
 * Check configuration process for plugin : need to return true if succeeded
 * Can display a message only if failure and $verbose is true
 */
function plugin_memarkdown_check_config($verbose = false)
{
    if (true) { // Your configuration check
        return true;
    }

    if ($verbose) {
        echo __('Installed / not configured', 'memarkdown');
    }
    return false;
}

/**
 * Install plugin
 */
function plugin_memarkdown_install()
{
    // No database tables needed for this plugin
    // All functionality is client-side with hooks
    return true;
}

/**
 * Uninstall plugin
 */
function plugin_memarkdown_uninstall()
{
    // No database cleanup needed
    return true;
}

/**
 * Hook called after item form (more reliable timing)
 */
function plugin_memarkdown_post_item_form($params)
{
    if ($params['item'] instanceof KnowbaseItem) {
        echo plugin_memarkdown_inject_toggle_ui($params);
    }
}

/**
 * Hook called after showing knowledge base item form
 */
function plugin_memarkdown_post_show_item($params)
{
    if ($params['item'] instanceof KnowbaseItem) {
        echo plugin_memarkdown_inject_toggle_ui($params);
    }
}

/**
 * Hook called after showing knowledge base item form (alternative hook)
 */
function plugin_memarkdown_post_show_form($params)
{
    if ($params['item'] instanceof KnowbaseItem) {
        echo plugin_memarkdown_inject_toggle_ui($params);
    }
}

/**
 * Hook called before adding knowledge base item
 */
function plugin_memarkdown_pre_item_add($input)
{
    return plugin_memarkdown_convert_content($input);
}

/**
 * Hook called before updating knowledge base item
 */
function plugin_memarkdown_pre_item_update($input)
{
    return plugin_memarkdown_convert_content($input);
}

/**
 * Convert markdown content to HTML if markdown mode is enabled
 */
function plugin_memarkdown_convert_content($input)
{
    // Only process if explicitly in markdown mode AND content needs conversion
    if (isset($input['_markdown_mode']) && $input['_markdown_mode'] == 1) {
        if (isset($input['answer']) && !empty($input['answer'])) {
            // Check if content is already HTML (contains HTML tags)
            if (strpos($input['answer'], '<') === false) {
                // Only convert if it looks like markdown (no HTML tags)
                $input['answer'] = plugin_memarkdown_to_html($input['answer']);
            }
        }
        // Remove the markdown mode flag as it's not a database field
        unset($input['_markdown_mode']);
    }
    return $input;
}

/**
 * Convert markdown content to HTML
 */
function plugin_memarkdown_to_html($markdown_content)
{
    // Include the markdown parser
    require_once __DIR__ . '/lib/Parsedown.php';
    
    $parsedown = new Parsedown();
    $parsedown->setSafeMode(true); // Enable safe mode for security
    $parsedown->setBreaksEnabled(true); // Enable line breaks
    
    $html = $parsedown->text($markdown_content);
    
    // GLPI-specific HTML formatting adjustments
    $html = plugin_memarkdown_format_for_glpi($html);
    
    return $html;
}

/**
 * Format HTML to be compatible with GLPI's requirements
 */
function plugin_memarkdown_format_for_glpi($html)
{
    // GLPI uses specific classes and formatting
    $html = str_replace('<table>', '<table class="table table-striped table-hover card-table">', $html);
    $html = str_replace('<blockquote>', '<blockquote class="blockquote">', $html);
    $html = str_replace('<code>', '<code class="language-text">', $html);
    
    // Ensure images have proper classes
    $html = preg_replace('/<img([^>]*)>/', '<img$1 class="img-fluid">', $html);
    
    // Convert external links to target="_blank"
    $html = preg_replace('/<a\s+href="(https?:\/\/[^"]*)"([^>]*)>/', '<a href="$1" target="_blank" rel="noopener noreferrer"$2>', $html);
    
    // Ensure proper paragraph spacing
    $html = str_replace('<p></p>', '', $html);
    
    return $html;
}

/**
 * Inject the markdown toggle UI with improved timing
 */
function plugin_memarkdown_inject_toggle_ui($params)
{
    // Enhanced debugging and script for both GLPI 10.x and 11.x
    $script = "
    <script>
    (function() {
        console.log('MEMarkdown Plugin: Starting initialization...');
        console.log('GLPI Version detected: " . GLPI_VERSION . "');
        
        // Debug information
        window.meMarkdownDebug = {
            pluginInitialized: false,
            attempts: 0,
            maxAttempts: 50,
            debugMode: true
        };
        
        function debugLog(message) {
            if (window.meMarkdownDebug.debugMode) {
                console.log('MEMarkdown Debug: ' + message);
            }
        }
        
        function forceInitMeMarkdown() {
            window.meMarkdownDebug.attempts++;
            debugLog('Initialization attempt #' + window.meMarkdownDebug.attempts);
            
            if (window.meMarkdownDebug.pluginInitialized) {
                debugLog('Already initialized, skipping...');
                return true;
            }
            
            // Enhanced detection for both GLPI versions
            const detectEditor = () => {
                const selectors = [
                    'textarea[name=\"answer\"]',
                    'textarea[data-itemtype=\"answer\"]', 
                    '.rich-text-container textarea',
                    '#answer',
                    'textarea[id*=\"answer\"]',
                    '.form-field textarea[name=\"answer\"]',
                    'textarea.form-control[name=\"answer\"]'
                ];
                
                debugLog('Trying to find textarea with selectors: ' + selectors.join(', '));
                
                for (const selector of selectors) {
                    const textarea = document.querySelector(selector);
                    if (textarea) {
                        debugLog('Found textarea with selector: ' + selector);
                        debugLog('Textarea ID: ' + (textarea.id || 'no ID'));
                        debugLog('Textarea name: ' + (textarea.name || 'no name'));
                        return textarea;
                    }
                }
                debugLog('No textarea found with any selector');
                return null;
            };
            
            const answerTextarea = detectEditor();
            if (!answerTextarea) {
                debugLog('No answer textarea found');
                return false;
            }
            
            // Check TinyMCE
            if (typeof tinymce === 'undefined') {
                debugLog('TinyMCE not loaded yet');
                return false;
            }
            
            debugLog('TinyMCE is loaded, editors count: ' + (tinymce.editors ? tinymce.editors.length : 0));
            
            // Check if our JavaScript functions are loaded
            if (typeof initMarkdownToggle !== 'function') {
                debugLog('initMarkdownToggle function not loaded yet');
                return false;
            }
            
            debugLog('Attempting to initialize markdown toggle...');
            
            try {
                const result = initMarkdownToggle();
                if (result) {
                    window.meMarkdownDebug.pluginInitialized = true;
                    debugLog('Successfully initialized markdown toggle!');
                    return true;
                } else {
                    debugLog('initMarkdownToggle returned false');
                    return false;
                }
            } catch (error) {
                debugLog('Error during initialization: ' + error.message);
                console.error('MEMarkdown Error:', error);
                return false;
            }
        }
        
        function retryInit() {
            if (window.meMarkdownDebug.pluginInitialized) {
                return;
            }
            
            if (window.meMarkdownDebug.attempts >= window.meMarkdownDebug.maxAttempts) {
                console.warn('MEMarkdown: Maximum initialization attempts reached. Plugin may not work properly.');
                debugLog('Final debug info:');
                debugLog('- TinyMCE loaded: ' + (typeof tinymce !== 'undefined'));
                debugLog('- initMarkdownToggle function: ' + (typeof initMarkdownToggle === 'function'));
                debugLog('- Answer textarea found: ' + (document.querySelector('textarea[name=\"answer\"]') !== null));
                return;
            }
            
            if (!forceInitMeMarkdown()) {
                setTimeout(retryInit, 200);
            }
        }
        
        // Start trying immediately
        setTimeout(() => {
            debugLog('Starting immediate initialization...');
            forceInitMeMarkdown();
        }, 100);
        
        // DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                debugLog('DOM loaded, attempting initialization...');
                setTimeout(forceInitMeMarkdown, 300);
            });
        } else {
            debugLog('DOM already loaded, attempting initialization...');
            setTimeout(forceInitMeMarkdown, 300);
        }
        
        // Window load
        window.addEventListener('load', function() {
            debugLog('Window loaded, attempting initialization...');
            setTimeout(forceInitMeMarkdown, 500);
        });
        
        // Start retry mechanism
        setTimeout(retryInit, 1000);
        
        // TinyMCE specific events
        if (typeof tinymce !== 'undefined') {
            debugLog('Setting up TinyMCE event listeners...');
            tinymce.on('AddEditor', function(e) {
                debugLog('TinyMCE AddEditor event fired for: ' + (e.editor.id || 'unknown'));
                setTimeout(forceInitMeMarkdown, 500);
            });
            
            tinymce.on('EditorChange', function(e) {
                debugLog('TinyMCE EditorChange event fired');
                if (!window.meMarkdownDebug.pluginInitialized) {
                    setTimeout(forceInitMeMarkdown, 200);
                }
            });
        } else {
            debugLog('TinyMCE not available, setting up detection...');
            // TinyMCE detection loop
            let tinymceCheckCount = 0;
            function checkTinyMCE() {
                tinymceCheckCount++;
                if (typeof tinymce !== 'undefined') {
                    debugLog('TinyMCE became available after ' + tinymceCheckCount + ' checks');
                    setTimeout(forceInitMeMarkdown, 300);
                } else if (tinymceCheckCount < 30) {
                    setTimeout(checkTinyMCE, 500);
                } else {
                    debugLog('TinyMCE still not available after 30 checks');
                }
            }
            setTimeout(checkTinyMCE, 1000);
        }
        
        // Observer for dynamic content
        if (typeof MutationObserver !== 'undefined') {
            debugLog('Setting up MutationObserver...');
            const observer = new MutationObserver((mutations) => {
                if (!window.meMarkdownDebug.pluginInitialized) {
                    let shouldCheck = false;
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            for (let node of mutation.addedNodes) {
                                if (node.nodeType === 1) { // Element node
                                    if (node.querySelector && (
                                        node.querySelector('textarea[name=\"answer\"]') ||
                                        node.querySelector('.tox-tinymce') ||
                                        node.matches && node.matches('textarea[name=\"answer\"]')
                                    )) {
                                        shouldCheck = true;
                                        break;
                                    }
                                }
                            }
                        }
                    });
                    
                    if (shouldCheck) {
                        debugLog('Relevant DOM changes detected, attempting initialization...');
                        setTimeout(forceInitMeMarkdown, 200);
                    }
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
        
        debugLog('MEMarkdown initialization setup complete');
    })();
    </script>
    ";
    
    return $script;
}

/**
 * GLPI 11+ compatible hook for post item form
 */
function plugin_memarkdown_post_item_form_v11($params)
{
    if ($params['item'] instanceof KnowbaseItem) {
        echo plugin_memarkdown_inject_toggle_ui_v11($params);
    }
}

/**
 * GLPI 11+ compatible hook for post show item
 */
function plugin_memarkdown_post_show_item_v11($params)
{
    if ($params['item'] instanceof KnowbaseItem) {
        echo plugin_memarkdown_inject_toggle_ui_v11($params);
    }
}

/**
 * GLPI 11+ compatible toggle UI injection
 */
function plugin_memarkdown_inject_toggle_ui_v11($params)
{
    // Use the same enhanced script as the regular version
    return plugin_memarkdown_inject_toggle_ui($params);
} 