# Testing Guide for Claude Conversation Exporter

## Pre-Testing Setup

### 1. Generate Icons First
```bash
# Open this file in your browser:
open icons/generate-icons.html

# Or navigate to it manually and download all three icons
# Save them as: icon16.png, icon48.png, icon128.png in the icons/ folder
```

### 2. Load Extension
1. Open Chrome and go to: `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `claude-ai-download` folder
5. Confirm extension appears with no errors

## Test Checklist

### Test 1: Basic Installation
- [ ] Extension appears in `chrome://extensions/`
- [ ] No errors in extension details
- [ ] Extension icon appears in toolbar
- [ ] Can click icon to open popup

### Test 2: Popup Functionality
- [ ] Popup opens when clicking icon
- [ ] "Export Conversation" button is visible
- [ ] UI looks correct (purple gradient, readable text)
- [ ] Status shows "Ready to export"

### Test 3: Content Script Loading
1. Go to https://claude.ai
2. Open DevTools (F12) → Console
3. Look for: `Claude Conversation Exporter content script loaded`
4. - [ ] Message appears

### Test 4: Export on Empty Page
1. On claude.ai home page (no conversation)
2. Click extension icon → "Export Conversation"
3. Check console for messages
4. Expected: Should handle gracefully (may show "no messages" or minimal export)

### Test 5: Export Simple Conversation
1. Create a new conversation with Claude
2. Send 2-3 simple messages (e.g., "Hello", "How are you?")
3. Wait for Claude to respond to each
4. Click extension icon → "Export Conversation"
5. Check console output:
   - [ ] See "Export triggered"
   - [ ] See "Extracting human messages..."
   - [ ] See "Extracting artifacts..."
   - [ ] See "Extracting attachments..."
   - [ ] See "Copying Claude responses..."
   - [ ] See download dialog appear
6. Open downloaded markdown file:
   - [ ] Contains all your messages
   - [ ] Contains Claude's responses
   - [ ] Proper markdown formatting

### Test 6: Export with Code Blocks
1. Ask Claude to write some code (e.g., "Write a Python hello world")
2. Wait for response with code
3. Export conversation
4. Check markdown file:
   - [ ] Code block is captured
   - [ ] Proper syntax highlighting markers
   - [ ] Code appears in "CONTEXT" section

### Test 7: Export with Artifacts
1. Ask Claude to create an artifact (e.g., "Create a React component")
2. Wait for artifact to appear
3. Export conversation
4. Check markdown file:
   - [ ] Artifact reference appears in conversation
   - [ ] Full artifact code in "CONTEXT" section
   - [ ] Artifact has proper title and language

### Test 8: Export with Multiple Messages
1. Have a longer conversation (10+ messages)
2. Include mix of text and code
3. Export conversation
4. Check markdown file:
   - [ ] All messages present
   - [ ] Correct order maintained
   - [ ] No duplicates

### Test 9: Background Script
1. Go to `chrome://extensions/`
2. Click "service worker" under extension
3. Trigger an export
4. Check logs:
   - [ ] "Download request received"
   - [ ] "Download started with ID: X"
   - [ ] No errors

### Test 10: File Naming
1. Rename conversation in Claude (click title)
2. Export conversation
3. Check downloaded filename:
   - [ ] Uses conversation title (sanitized)
   - [ ] Ends with `_full_context.md`
   - [ ] No invalid characters

### Test 11: Multiple Exports
1. Export conversation once
2. Wait for completion
3. Export same conversation again
4. - [ ] Both exports work
5. - [ ] Files are named uniquely (Chrome adds numbers)

### Test 12: Status Indicator
During export, watch the blue status box in top-right:
- [ ] Shows message counts updating
- [ ] Shows "Human: X | Claude: Y"
- [ ] Shows artifacts/attachments if present
- [ ] Turns green on completion
- [ ] Disappears after 5 seconds

### Test 13: Error Handling
Try these scenarios:
1. Export on non-Claude.ai page
   - [ ] Should show error in popup
2. Export very quickly after page load
   - [ ] Should either work or fail gracefully
3. Close popup during export
   - [ ] Export should continue in background

## Debugging Failed Tests

### If content script doesn't load:
```javascript
// In DevTools console on claude.ai:
chrome.runtime.getManifest()
// Should return extension manifest

// Check if content script injected:
document.querySelector('div[style*="position: fixed"]')
// Should find status indicator after export starts
```

### If export doesn't trigger:
```javascript
// In DevTools console:
chrome.runtime.sendMessage({action: 'startExport'})
// Should trigger export manually
```

### If download fails:
```javascript
// Check background script console
// Look for errors about permissions or blob creation
```

### Common Issues:

**Issue**: "Cannot read properties of undefined"
- **Cause**: Selectors changed on Claude's side
- **Fix**: Update SELECTORS object in content.js

**Issue**: Download button does nothing
- **Cause**: Popup can't communicate with content script
- **Fix**: Reload claude.ai page, reload extension

**Issue**: Missing responses
- **Cause**: DOM selectors may not match current Claude UI
- **Fix**: Check console for extraction errors, update selectors in content.js

**Issue**: Icons don't show
- **Cause**: PNG files not generated
- **Fix**: Run generate-icons.html and save PNGs

## Expected Output Structure

Your exported markdown should have:

```markdown
# Conversation with Claude

**Exported:** [date]
**Stats:** X messages, Y responses, Z artifacts, W attachments

---

## Human:
[message content]
---

## Claude:
[response content]
---

[... more messages ...]

# CONTEXT

## Uploaded Files & Attachments
[if any]

## Artifacts (Code, Diagrams, Components)
[full artifact code]

## Export Summary
[statistics]
```

## Success Criteria

All tests passing means:
- Extension loads without errors
- Popup UI works and looks good
- Content script injects correctly
- Messages extracted successfully
- Claude responses captured via DOM extraction
- Artifacts captured
- Downloads work properly
- Markdown file is well-formatted
- No console errors during normal operation

## Advanced Testing

### Performance Test
1. Find a very long conversation (50+ messages)
2. Export it
3. Monitor:
   - Time to complete
   - Memory usage
   - Any timeouts

### Edge Cases
- Empty messages
- Very long code blocks (>10,000 lines)
- Special characters in messages (emojis, unicode)
- Conversations with images
- Conversations with file uploads

### Browser Compatibility
Test in:
- [ ] Chrome (latest)
- [ ] Edge (Chromium)
- [ ] Brave

## Reporting Issues

When reporting bugs, include:
1. Chrome version
2. Extension version
3. Console logs (both content and background)
4. Steps to reproduce
5. Expected vs actual behavior
