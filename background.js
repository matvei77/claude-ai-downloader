// Background service worker for Claude Conversation Exporter
// Handles file downloads using Chrome downloads API

console.log('🔧 Claude Exporter background service worker loaded');

// Listen for download requests from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'download') {
    console.log('📥 Download request received:', request.filename);
    console.log('📦 Content size:', request.content.length, 'characters');

    try {
      // Use data URL instead of blob URL for better Manifest V3 compatibility
      // Encode content as base64 to avoid URL encoding size limits
      const base64Content = btoa(unescape(encodeURIComponent(request.content)));
      const dataUrl = `data:text/markdown;base64,${base64Content}`;

      console.log('🔗 Data URL created, initiating download...');

      // Trigger download using Chrome downloads API
      chrome.downloads.download({
        url: dataUrl,
        filename: request.filename,
        saveAs: true, // Show save dialog
        conflictAction: 'uniquify' // Auto-rename if file exists
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Download failed:', chrome.runtime.lastError);
          console.error('❌ Error details:', chrome.runtime.lastError.message);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log(`✅ Download started with ID: ${downloadId}`);
          console.log(`✅ File: ${request.filename}`);
          sendResponse({ success: true, downloadId: downloadId });
        }
      });

      // Return true to indicate we'll send response asynchronously
      return true;

    } catch (error) {
      console.error('❌ Error creating download:', error);
      console.error('❌ Stack trace:', error.stack);
      sendResponse({ success: false, error: error.message });
      return true; // Still need to return true for async response
    }
  }

  // Return false for other message types
  return false;
});

// Optional: Listen for download completion to show notification
chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state && delta.state.current === 'complete') {
    console.log('✅ Download completed:', delta.id);
  } else if (delta.state && delta.state.current === 'interrupted') {
    console.error('❌ Download interrupted:', delta.id);
  }
});

// Optional: Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('🎉 Claude Conversation Exporter installed!');
  } else if (details.reason === 'update') {
    console.log('🔄 Claude Conversation Exporter updated!');
  }
});
