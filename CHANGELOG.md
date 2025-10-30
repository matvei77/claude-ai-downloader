# Changelog

## v1.1.1 - Download Mechanism Fix (2025-10-30)

### Fixed
- **Critical Fix**: Resolved issue where downloads weren't actually triggering despite successful export
  - Replaced blob URL approach with base64 data URL for Manifest V3 compatibility
  - Blob URLs don't work reliably in Manifest V3 service workers
  - Data URLs with base64 encoding are more stable and compatible

### Improved
- Added detailed logging to both content.js and background.js
- Better error handling with specific error messages
- Response validation to distinguish between different failure modes
- Console now shows download ID when successful

### Technical Details
- Changed from `URL.createObjectURL(blob)` to `data:text/markdown;base64,...`
- Added content size logging for debugging
- Added stack trace logging for errors
- Fixed return value handling in message listener

---

## v1.1.0 - Download Fix (2025-10-30)

### Fixed
- **Major Fix**: Resolved download issue where files weren't actually being downloaded
  - Replaced clipboard-based extraction (which failed due to focus issues) with direct DOM extraction
  - Claude responses now extracted directly from page content instead of clipboard interception
  - No more "Document is not focused" errors
  - Works reliably from extension popup

### Changed
- Claude response extraction now uses DOM scraping as primary method
- Clipboard interception kept as fallback method
- Removed unnecessary clipboard button clicking
- Simplified export flow for better reliability

### Technical Details
- Added `extractClaudeResponses()` function that reads directly from DOM
- Uses multiple strategies to find response content:
  1. Message blocks by structure
  2. Copy button parent containers
  3. Clipboard interception (fallback)

---

## v1.0.0 - Initial Release

### Added
- Export Claude conversations to markdown
- Extract human messages via edit button
- Capture Claude responses via clipboard
- Extract code artifacts (3 methods)
- Extract attachments (5 methods)
- Structured markdown with context section
- Chrome extension with popup UI
- Background download handler
- Status indicator overlay

### Features
- Message extraction (human + Claude)
- Artifact detection (code blocks, components)
- Attachment support (text files, images)
- Markdown export with references
- Full context section with code
