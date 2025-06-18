# GLPI Markdown Plugin

A plugin for GLPI that adds comprehensive Markdown support to the Knowledge Base system, including Obsidian-style markdown features.

**✅ Compatible with GLPI 10.x and 11.x**

## Installation
1. Download the repo
2. Make sure the folder is names memarkdown
3. Copy to your plugin folder
4. sudo chown -R www-data:www-data ./memarkdown
5. Install and toggle on the plugin


## Compatibility

- **GLPI Version**: 10.0.0 - 11.x
- **Browsers**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **Themes**: Compatible with all GLPI themes (light/dark mode support)
- **Bootstrap**: Compatible with Bootstrap 4 (GLPI 10.x) and Bootstrap 5 (GLPI 11.x)

## GLPI 11 Compatibility Features

This plugin has been enhanced to work seamlessly with both GLPI 10.8+ and GLPI 11.x:

### Enhanced Detection
- **Multi-selector Support**: The plugin tries multiple CSS selectors to find the rich text editor
- **Dynamic TinyMCE Detection**: Improved detection of TinyMCE editors in GLPI 11's new interface
- **Form Structure Adaptation**: Handles both old and new form structures

### Version-Specific Hooks
- **GLPI 10.x**: Uses traditional hooks (`post_item_form`, `post_show_item`, `post_show_form`)
- **GLPI 11.x**: Uses enhanced hooks with better compatibility and error handling
- **Automatic Detection**: The plugin automatically detects the GLPI version and uses appropriate hooks

### UI Improvements for GLPI 11
- **Bootstrap 5 Compatibility**: Full support for Bootstrap 5 CSS variables and classes
- **Enhanced Dark Theme**: Improved dark theme support using both old and new selectors
- **Responsive Design**: Better mobile experience on GLPI 11
- **Loading States**: Enhanced loading indicators with CSS animations

## Installation

1. Extract the plugin to your GLPI plugins directory:
   ```
   /path/to/glpi/plugins/markdown/
   ```

2. Log in to GLPI as an administrator

3. Go to **Setup > Plugins**

4. Find "Minimal Effort Markdown" in the list and click **Install**

5. Click **Activate** to enable the plugin

 both `data-glpi-theme` and `data-bs-theme`

## Known Issues

- Image placement is not happy when switching back from HTML mode
	- At least it's not corrupting your text formatting
- Cannot paste images when into markdown mode.


## Features

### Standard Markdown Support
- **Headers** - `# H1`, `## H2`, `### H3`, etc.
- **Bold** - `**bold text**` or `__bold text__`
- **Italic** - `*italic text*` or `_italic text_`
- **Links** - `[link text](url)`
- **Images** - `![alt text](url)`
- **Code** - `inline code` and ``` code blocks ```
- **Lists** - `- unordered` and `1. ordered`
- **Blockquotes** - `> quoted text`
- **Tables** - Markdown table syntax
- **Horizontal Rules** - `---` or `***`

### Obsidian-Style Extensions
- **Wikilinks** - `[[Page Name]]` or `[[Page Name|Display Text]]`
- **Tags** - `#tag`
- **Highlights** - `==highlighted text==`
- **Strikethrough** - `~~crossed out~~`
- **Math** - `$inline math$` and `$$block math$$`
- **Callouts** - `> [!note] Title`
- **Footnotes** - `[^1]`
- **File Embeds** - `![[file.pdf]]`

## Usage

### Enabling Markdown Mode

1. Open a Knowledge Base item for editing
2. Look for the **Markdown Mode** toggle switch above the rich text editor
3. Click the toggle to switch between:
   - **Rich Text Mode** - Standard TinyMCE WYSIWYG editor
   - **Markdown Mode** - Plain text editor with markdown syntax

### Writing in Markdown

When in Markdown mode, you can write using standard markdown syntax:

```markdown
# Main Heading

This is a paragraph with **bold** and *italic* text.

## Sub Heading

- List item 1
- List item 2
  - Nested item

### Code Example

Here's some `inline code` and a code block:

```python
def hello_world():
    print("Hello, GLPI!")
```

### Links and Images

[GLPI Website](https://glpi-project.org)

![GLPI Logo](https://glpi-project.org/logo.png)

### Obsidian Features

[[Related Article]] - Wikilink to another article
#documentation #glpi - Tags
==Important text== - Highlighted
~~Old information~~ - Strikethrough

> [!note] Important Note
> This is a callout box
```

### Converting Content

- **Markdown to HTML**: When you save a knowledge base item in markdown mode, the content is automatically converted to HTML for storage in GLPI
- **HTML to Markdown**: When you switch to markdown mode, existing HTML content is converted to markdown (best effort conversion)

## Technical Details

### File Structure
```
plugins/markdown/
├── setup.php              # Plugin configuration and hooks (GLPI 11 compatible)
├── css/
│   └── markdown.css        # Styling (Bootstrap 4 & 5 compatible)
├── js/
│   ├── markdown-toggle.js  # Toggle functionality (enhanced detection)
│   ├── markdown-converter.js # Enhanced markdown converter
│   └── markdown-init.js    # Initialization scripts  
├── lib/
│   └── Parsedown.php       # Markdown parsing library
├── locales/
│   └── en_GB.po           # English translations
└── README.md              # This file
```

### Hooks Used

#### GLPI 11.x:
- `post_item_form_v11` - Enhanced injection with better error handling
- `post_show_item_v11` - Improved compatibility with new interface
- Enhanced detection and initialization strategies

#### GLPI 10.x:
- `post_show_item` - Injects the markdown toggle UI
- `post_item_form` - Alternative injection point
- `post_show_form` - Fallback injection method
- `pre_item_add` - Converts markdown to HTML before saving new items
- `pre_item_update` - Converts markdown to HTML before updating items

### Dependencies
- GLPI 10.0.0 or higher (including GLPI 11.x)
- TinyMCE (included with GLPI)
- Bootstrap CSS classes (4.x or 5.x, included with GLPI)

## Version History

### Version 1.1.0 (GLPI 11 Compatible)
- Added GLPI 11.x compatibility
- Enhanced detection mechanisms
- Bootstrap 5 support with fallbacks
- Improved dark theme support
- Better error handling and debugging
- Enhanced form integration

### Version 1.0.0
- Initial release
- GLPI 10.x support
- Standard markdown support
- Obsidian-style extensions
- Toggle between markdown and rich text modes
- Dark theme support
- Localization support

## License

This plugin is licensed under the MIT License.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both GLPI 10.x and 11.x if possible
5. Submit a pull request 
