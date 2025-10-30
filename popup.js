// Popup script for Claude Exporter extension

document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('exportBtn');
  const status = document.getElementById('status');
  const statusIcon = document.querySelector('.status-icon');
  const statusText = document.querySelector('.status-text');

  function updateStatus(icon, text, className) {
    statusIcon.textContent = icon;
    statusText.textContent = text;
    status.className = `status ${className}`;
  }

  exportBtn.addEventListener('click', async () => {
    try {
      // Disable button
      exportBtn.disabled = true;
      updateStatus('⏳', 'Starting export...', 'exporting');

      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Check if we're on Claude.ai
      if (!tab.url || (!tab.url.includes('claude.ai'))) {
        updateStatus('❌', 'Please open a Claude.ai conversation', 'error');
        exportBtn.disabled = false;
        return;
      }

      // Send message to content script to start export
      chrome.tabs.sendMessage(tab.id, { action: 'startExport' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          updateStatus('❌', 'Error: Reload the Claude page and try again', 'error');
          exportBtn.disabled = false;
          return;
        }

        updateStatus('✅', 'Export started! Check console for progress', 'success');

        // Close popup after 2 seconds
        setTimeout(() => {
          window.close();
        }, 2000);
      });

    } catch (error) {
      console.error('Export error:', error);
      updateStatus('❌', `Error: ${error.message}`, 'error');
      exportBtn.disabled = false;
    }
  });

  // Listen for status updates from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'exportStatus') {
      updateStatus(message.icon, message.text, message.className);
    }
  });
});
