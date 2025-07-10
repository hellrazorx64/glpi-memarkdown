# GLPI Markdown Editor Plugin

A plugin for GLPI that adds markdown editing capabilities to text fields in the knowledge base and other text areas.

## Features

- **Markdown Toggle**: Switch between rich text editor (TinyMCE) and markdown mode
- **Real-time Preview**: See HTML preview while editing markdown
- **Image Paste Support**: Paste images directly from clipboard in markdown mode
- **Syntax Highlighting**: Markdown syntax highlighting in textarea
- **Bidirectional Conversion**: Convert between HTML and markdown seamlessly

## Usage

### Basic Markdown Editing

1. Open any knowledge base article or text field with rich text editor
2. Look for the "Markdown" toggle switch next to the text editor
3. Toggle the switch to enable markdown mode
4. Write your content using standard markdown syntax
5. Toggle back to see the rendered HTML

### Image Paste Feature

**New in this version!** You can now paste images directly into markdown mode:

1. **Enable markdown mode** by toggling the switch
2. **Copy an image** from anywhere (screenshot, file, web page, etc.)
3. **Paste the image** (`Ctrl+V` / `Cmd+V`) into the markdown textarea
4. The image will be **automatically uploaded** to GLPI's file system
5. **Markdown syntax** for the image will be inserted: `![filename](url)`
6. **Toggle back to HTML mode** to see the image rendered

#### Supported Image Formats
- PNG
- JPEG/JPG  
- GIF
- WebP (if supported by browser)

#### Upload Process
- Images are uploaded to GLPI's temporary directory (`/files/_tmp/`)
- Unique filenames are generated to prevent conflicts
- Upload progress is shown with visual feedback
- Success/error notifications appear in the top-right corner

### Markdown Syntax Support

- **Headers**: `# ## ###`
- **Bold**: `**text**` or `__text__`
- **Italic**: `*text*` or `_text_`
- **Links**: `[text](url)`
- **Images**: `![alt text](url)` 
- **Lists**: `- item` or `1. item`
- **Code**: `` `code` `` or ``` code blocks ```
- **Quotes**: `> quote`

## Installation

1. Copy the plugin to your GLPI plugins directory
2. Access GLPI administration
3. Go to Setup → Plugins
4. Install and activate the "MarkDown Editor" plugin

## Technical Details

- Uses TinyMCE's API for seamless integration
- Leverages GLPI's existing file upload system (`/ajax/fileupload.php`)
- Images are stored in GLPI's temporary directory structure
- Real-time conversion between HTML and markdown formats
- Event-driven architecture for optimal performance

## Troubleshooting

### Images not uploading
- Check that GLPI's file upload permissions are configured correctly
- Verify that the `/files/_tmp/` directory is writable
- Check browser console for any JavaScript errors

### Markdown not converting properly
- Refresh the page to reload JavaScript files
- Clear browser cache if changes aren't taking effect
- Check for conflicts with other plugins

### Toggle not appearing
- Ensure the plugin is properly activated in GLPI
- Check that you're on a page with a rich text editor
- Verify JavaScript console for any errors 