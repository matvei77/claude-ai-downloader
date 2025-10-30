# 📝 Claude Conversation Exporter

[![Version](https://img.shields.io/badge/version-1.1.1-blue.svg)](https://github.com/matvei77/claude-ai-downloader)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/chrome-extension-orange.svg)](https://developer.chrome.com/docs/extensions/)

A Chrome extension that exports Claude.ai conversations with full context: messages, artifacts, attachments, and code blocks. Perfect for archiving, sharing, or analyzing your Claude conversations.

## 🚀 Features

- ✅ **Complete Message Export** - Captures all human messages and Claude responses
- 🎨 **Artifact Extraction** - Exports all code blocks, components, and artifacts
- 📎 **Attachment Support** - Includes uploaded files and their content
- 📊 **Structured Output** - Clean markdown format with references and full context
- 🔒 **Privacy-First** - All processing happens locally, no data sent anywhere

## 📦 Installation

### Step 1: Generate Icons
1. Open `icons/generate-icons.html` in your browser
2. Click "Download All Icons"
3. Save the three PNG files to the `icons/` directory

Alternatively, you can use any icons you want - just make sure they're named:
- `icon16.png` (16x16px)
- `icon48.png` (48x48px)
- `icon128.png` (128x128px)

### Step 2: Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `claude-ai-download` folder
5. The extension should now appear in your browser toolbar

## 🎯 Usage

1. Navigate to https://claude.ai and open a conversation
2. Click the Claude Exporter extension icon in your toolbar
3. Click the "Export Conversation" button
4. Wait a few seconds while the export processes
5. A markdown file will be downloaded automatically

## 📂 Output Format

The exported markdown file contains:

### Section 1: Conversation Flow
- All messages in chronological order
- References to artifacts and attachments
- Clean, readable format

### Section 2: Context (Full Content)
- Complete artifact code with syntax highlighting
- Full attachment content
- Structured with anchor links from the conversation

## 🔧 How It Works

1. **Content Script** (`content.js`) - Runs on Claude.ai pages
   - **Extracts Claude responses directly from DOM** (no clipboard needed!)
   - Extracts messages via edit button simulation
   - Scans DOM for artifacts and attachments
   - Checks localStorage for additional content

2. **Background Worker** (`background.js`) - Handles file downloads
   - Converts markdown to downloadable file
   - Uses Chrome downloads API

3. **Popup UI** (`popup.html`) - Triggers the export
   - Simple button interface
   - Shows export status
   - Communicates with content script

## 🛠️ Project Structure

```
claude-ai-download/
├── manifest.json          # Extension configuration
├── content.js            # Main extraction logic
├── background.js         # Download handler
├── popup.html           # Extension popup UI
├── popup.js             # Popup logic
├── styles.css           # Popup styling
├── icons/               # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   ├── icon.svg         # Source SVG
│   └── generate-icons.html
└── README.md            # This file
```

## 🐛 Troubleshooting

### Extension doesn't appear after loading
- Make sure you selected the correct folder
- Check that all files are present
- Look for errors in `chrome://extensions/`

### Export button does nothing
- Make sure you're on a Claude.ai conversation page
- Open browser console (F12) and check for errors
- Try reloading the Claude.ai page

### Some content is missing from export
- **First**: Reload the extension in `chrome://extensions/` and try again
- The extension relies on Claude's DOM structure
- If Claude updates their UI, selectors may need updating
- Check console for warnings about failed extractions
- Try clicking the export button while the page is fully loaded

### Download doesn't start
- Check that the extension has "downloads" permission
- Look for errors in the extension's service worker console
- Try clicking the export button again

## 🔍 Debugging

### View Content Script Logs
1. Open Claude.ai conversation
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for messages with emoji prefixes (🎨, 📎, 📝, etc.)

### View Background Script Logs
1. Go to `chrome://extensions/`
2. Find "Claude Conversation Exporter"
3. Click "service worker" link
4. Console logs will appear

### View Popup Logs
1. Right-click the extension icon
2. Select "Inspect popup"
3. Console will show popup script logs

## 🚨 Known Limitations

- **DOM Selectors**: Claude may update their UI, breaking selectors
- **Large Conversations**: Very long conversations may take longer to process
- **Image Downloads**: Only captures image URLs, not the actual image files
- **Real-time Updates**: Must click export button; doesn't auto-export
- **Formatting**: Some special formatting in Claude's responses may not be preserved perfectly

## 🔐 Privacy & Security

- ✅ All processing happens locally in your browser
- ✅ No data is sent to external servers
- ✅ No tracking or analytics
- ✅ Open source - inspect the code yourself
- ✅ Only requests minimal required permissions

## 📝 Permissions Explained

- **activeTab** - Access current Claude.ai page to read conversation
- **downloads** - Save markdown file to your computer
- **storage** - (Optional) Save user preferences
- **host_permissions** - Only works on claude.ai domains

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs via GitHub Issues
- Suggest features or improvements
- Submit pull requests
- Improve documentation

Please ensure your code follows the existing style and includes appropriate comments.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Attribution

- **Author**: [Matvei](https://github.com/matvei77)
- **Developed with**: [Claude Code](https://claude.com/claude-code) by Anthropic
- **Original concept**: Converted from `terminal.js` bookmarklet to full Chrome extension

## 📮 Support

If you encounter issues:
1. Check the [Troubleshooting](#-troubleshooting) section above
2. Review console logs for errors (F12 → Console)
3. Ensure you're on the latest version of Chrome
4. Verify Claude.ai hasn't changed their UI structure
5. Open an issue on [GitHub](https://github.com/matvei77/claude-ai-downloader/issues)

## ⭐ Star This Project

If you find this extension useful, please consider giving it a star on GitHub!

---

**Enjoy exporting your Claude conversations! 🎉**
