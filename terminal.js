function setupEnhancedClaudeExporter() {
  const originalWriteText = navigator.clipboard.writeText;
  const capturedResponses = [];
  const humanMessages = [];
  const artifacts = [];
  const attachments = [];
  let interceptorActive = true;

  // DOM Selectors
  const SELECTORS = {
    userMessage: '[data-testid="user-message"]',
    messageGroup: '.group',
    copyButton: 'button[data-testid="action-bar-copy"]',
    editTextarea: 'textarea',
    conversationTitle: '[data-testid="chat-title-button"] .truncate, button[data-testid="chat-title-button"] div.truncate',
    // Artifact selectors - multiple patterns
    artifactContainer: '[data-testid="artifact"], [class*="artifact"], [class*="Artifact"]',
    artifactContent: 'code, pre, [class*="artifact"]',
    artifactPanel: '[class*="slide-out"], [class*="panel"]',
    // Attachment selectors - multiple patterns
    attachmentLink: 'a[href*="claude.ai"][href*="file"]',
    uploadedFile: '[data-testid="file-upload"], [class*="attachment"], [class*="file-preview"], [data-file], button[class*="file"]',
    imageElement: 'img[src*="claude"]',
    documentViewer: '[class*="document"], [class*="viewer"], [class*="preview"]',
  };

  const DELAYS = {
    hover: 50,
    edit: 150,
    copy: 100,
    artifact: 200
  };

  // ============= UTILITY FUNCTIONS =============

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function sanitizeFilename(name) {
    return name
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase()
      .substring(0, 100);
  }

  function getConversationTitle() {
    const titleElement = document.querySelector(SELECTORS.conversationTitle);
    const title = titleElement?.textContent?.trim();
    
    if (!title || title === 'Claude' || title.includes('New conversation')) {
      return 'claude_conversation';
    }
    return sanitizeFilename(title);
  }

  // ============= ARTIFACT EXTRACTION =============

  async function extractArtifacts() {
    console.log('🎨 Extracting artifacts...');
    
    // Method 1: Extract from visible artifact containers
    const artifactElements = document.querySelectorAll(SELECTORS.artifactContainer);
    
    for (let i = 0; i < artifactElements.length; i++) {
      const artifact = artifactElements[i];
      
      try {
        const title = artifact.getAttribute('data-artifact-title') || 
                     artifact.querySelector('[class*="title"]')?.textContent ||
                     `artifact_${i + 1}`;
        
        const language = artifact.getAttribute('data-artifact-language') ||
                        artifact.getAttribute('data-language') ||
                        detectLanguage(artifact);
        
        let content = '';
        const codeElement = artifact.querySelector('code, pre');
        if (codeElement) {
          content = codeElement.textContent;
        } else {
          content = artifact.textContent;
        }

        if (content.trim()) {
          artifacts.push({
            index: i,
            title: sanitizeFilename(title),
            language: language,
            content: content.trim(),
            type: determineArtifactType(artifact, language)
          });
          console.log(`  ✓ Artifact ${i + 1}: ${title} (${language})`);
        }
      } catch (error) {
        console.warn(`  ⚠ Failed to extract artifact ${i + 1}:`, error);
      }
    }

    // Method 2: Extract from localStorage (Claude stores conversation data here)
    try {
      const conversationData = await extractFromLocalStorage();
      if (conversationData && conversationData.artifacts) {
        conversationData.artifacts.forEach((art, idx) => {
          if (art.content && !artifacts.some(a => a.content === art.content)) {
            artifacts.push({
              index: artifacts.length,
              title: art.title || `artifact_from_storage_${idx + 1}`,
              language: art.language || 'text',
              content: art.content,
              type: art.type || 'code'
            });
            console.log(`  ✓ Artifact from storage: ${art.title}`);
          }
        });
      }
    } catch (error) {
      console.warn('Could not extract from localStorage:', error);
    }

    // Method 3: Look for code blocks in messages that might be artifacts
    const codeBlocks = document.querySelectorAll('pre code');
    for (let i = 0; i < codeBlocks.length; i++) {
      const code = codeBlocks[i];
      const content = code.textContent;
      
      // Only include if it's substantial and not already captured
      if (content.length > 100 && !artifacts.some(a => a.content === content)) {
        const language = code.className.match(/language-(\w+)/)?.[1] || 
                        detectLanguage(code);
        
        artifacts.push({
          index: artifacts.length,
          title: `code_block_${artifacts.length + 1}`,
          language: language,
          content: content.trim(),
          type: 'code'
        });
        console.log(`  ✓ Code block ${i + 1} captured as artifact`);
      }
    }

    console.log(`✅ Extracted ${artifacts.length} artifacts`);
  }

  async function extractFromLocalStorage() {
    try {
      // Claude stores conversation data in localStorage
      const keys = Object.keys(localStorage);
      const conversationKey = keys.find(k => 
        k.includes('conversation') || 
        k.includes('chat') ||
        k.startsWith('lastActiveOrg')
      );
      
      if (conversationKey) {
        const data = JSON.parse(localStorage.getItem(conversationKey));
        
        // Try to extract artifacts from the structure
        const extractedArtifacts = [];
        
        if (data && typeof data === 'object') {
          // Recursively search for artifact-like content
          const findArtifacts = (obj, depth = 0) => {
            if (depth > 10) return; // Prevent infinite recursion
            
            if (obj && typeof obj === 'object') {
              if (obj.type === 'artifact' || obj.artifact) {
                extractedArtifacts.push({
                  title: obj.title || obj.identifier,
                  language: obj.language,
                  content: obj.content || obj.text,
                  type: obj.type
                });
              }
              
              Object.values(obj).forEach(val => {
                if (typeof val === 'object') {
                  findArtifacts(val, depth + 1);
                }
              });
            }
          };
          
          findArtifacts(data);
        }
        
        return { artifacts: extractedArtifacts };
      }
    } catch (error) {
      console.warn('Error parsing localStorage:', error);
    }
    return null;
  }

  function detectLanguage(element) {
    const classList = element.className;
    if (classList.includes('python')) return 'python';
    if (classList.includes('javascript')) return 'javascript';
    if (classList.includes('html')) return 'html';
    if (classList.includes('css')) return 'css';
    if (classList.includes('json')) return 'json';
    if (classList.includes('markdown')) return 'markdown';
    if (classList.includes('react')) return 'jsx';
    return 'text';
  }

  function determineArtifactType(element, language) {
    const text = element.textContent;
    if (language === 'html' || text.includes('<!DOCTYPE')) return 'html';
    if (language === 'jsx' || language === 'react') return 'react';
    if (text.includes('import React')) return 'react';
    if (language === 'svg' || text.includes('<svg')) return 'svg';
    return 'code';
  }

  // ============= ATTACHMENT EXTRACTION =============

  async function extractAttachments() {
    console.log('📎 Extracting attachments...');
    
    // Method 1: Find attachment containers with content
    const attachmentContainers = document.querySelectorAll('[class*="attachment"], [class*="file"], [class*="upload"]');
    
    for (let i = 0; i < attachmentContainers.length; i++) {
      const container = attachmentContainers[i];
      
      // Get filename
      const filename = container.getAttribute('data-filename') ||
                      container.getAttribute('title') ||
                      container.querySelector('[class*="filename"]')?.textContent ||
                      container.textContent.split('\n')[0].trim() ||
                      `attachment_${i + 1}`;
      
      // Try to get content if it's a text file displayed inline
      let content = null;
      const contentElement = container.querySelector('pre, code, [class*="content"]');
      if (contentElement) {
        content = contentElement.textContent;
      }
      
      // Check if there's a data attribute with content
      const dataContent = container.getAttribute('data-content') ||
                         container.getAttribute('data-file-content');
      if (dataContent) {
        content = dataContent;
      }
      
      attachments.push({
        type: content ? 'text_file' : 'file',
        filename: filename,
        content: content,
        element: container.outerHTML,
        index: i
      });
      
      if (content) {
        console.log(`  ✓ Text file ${i + 1}: ${filename} (${content.length} chars)`);
      } else {
        console.log(`  ✓ File reference ${i + 1}: ${filename}`);
      }
    }

    // Method 2: Look for document/text content that was uploaded
    // Claude often displays uploaded text in expandable sections
    const textDisplays = document.querySelectorAll('[class*="document"], [class*="text-content"]');
    for (let i = 0; i < textDisplays.length; i++) {
      const display = textDisplays[i];
      const content = display.textContent;
      
      if (content && content.length > 100) {
        const filename = display.closest('[data-filename]')?.getAttribute('data-filename') ||
                        `document_${i + 1}.txt`;
        
        // Check if not already added
        if (!attachments.some(a => a.content === content)) {
          attachments.push({
            type: 'text_file',
            filename: filename,
            content: content.trim(),
            index: attachments.length
          });
          console.log(`  ✓ Document content ${i + 1}: ${filename} (${content.length} chars)`);
        }
      }
    }

    // Method 3: Scan for any large text blocks (might be uploaded content)
    await scanForTextBlocks();

    // Method 4: Extract from localStorage (uploaded files might be cached)
    try {
      const storageKeys = Object.keys(localStorage);
      for (const key of storageKeys) {
        if (key.includes('file') || key.includes('upload') || key.includes('attachment')) {
          try {
            const data = localStorage.getItem(key);
            const parsed = JSON.parse(data);
            
            if (parsed && (parsed.content || parsed.text)) {
              const filename = parsed.name || parsed.filename || `stored_file_${attachments.length + 1}`;
              const content = parsed.content || parsed.text;
              
              if (!attachments.some(a => a.filename === filename)) {
                attachments.push({
                  type: 'text_file',
                  filename: filename,
                  content: content,
                  source: 'localStorage',
                  index: attachments.length
                });
                console.log(`  ✓ File from storage: ${filename}`);
              }
            }
          } catch (e) {
            // Not JSON or doesn't match structure, skip
          }
        }
      }
    } catch (error) {
      console.warn('Could not scan localStorage:', error);
    }

    // Method 5: Find image references
    const images = document.querySelectorAll('img[src*="claude"], img[src*="artifact"]');
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = img.src;
      const alt = img.alt || `image_${i + 1}`;
      
      // Skip icons and UI elements
      if (src && !src.includes('icon') && !src.includes('avatar') && !src.includes('logo')) {
        attachments.push({
          type: 'image',
          filename: alt,
          url: src,
          width: img.width,
          height: img.height,
          index: attachments.length
        });
        console.log(`  ✓ Image ${i + 1}: ${alt}`);
      }
    }

    console.log(`✅ Found ${attachments.length} attachments (${attachments.filter(a => a.content).length} with content)`);
  }

  async function scanForTextBlocks() {
    console.log('  🔍 Scanning for large text blocks...');
    
    // Look for any pre/code blocks that aren't already captured as artifacts
    const allTextBlocks = document.querySelectorAll('pre, code, textarea, [class*="prose"], [role="textbox"]');
    
    for (let i = 0; i < allTextBlocks.length; i++) {
      const block = allTextBlocks[i];
      const content = block.textContent || block.value;
      
      // If it's substantial content (>200 chars) and not already captured
      if (content && content.length > 200) {
        const isDuplicate = attachments.some(a => a.content === content) ||
                          artifacts.some(a => a.content === content);
        
        if (!isDuplicate) {
          // Try to determine if this looks like uploaded content vs. generated
          const isLikelyUpload = !block.closest('[class*="claude-message"]') ||
                                block.closest('[class*="user-message"]') ||
                                block.closest('[class*="upload"]');
          
          if (isLikelyUpload) {
            attachments.push({
              type: 'text_file',
              filename: `text_block_${attachments.length + 1}.txt`,
              content: content.trim(),
              source: 'text_scan',
              index: attachments.length
            });
            console.log(`    ✓ Found text block (${content.length} chars)`);
          }
        }
      }
    }
  }

  // ============= MESSAGE EXTRACTION (Original) =============

  function findEditButton(messageGroup) {
    const allButtons = messageGroup.querySelectorAll('button');
    let editButton = Array.from(allButtons).find(btn =>
      btn.textContent.trim().toLowerCase() === 'edit'
    );
    if (!editButton) return allButtons[1];
    return editButton;
  }

  async function extractMessageContent(messageContainer, messageIndex) {
    try {
      messageContainer.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await delay(DELAYS.hover);

      const messageGroup = messageContainer.closest(SELECTORS.messageGroup);
      const editButton = findEditButton(messageGroup);

      if (editButton) {
        console.log(`📝 Extracting message ${messageIndex + 1} via edit`);
        editButton.click();
        await delay(DELAYS.edit);

        const editTextarea = document.querySelector(SELECTORS.editTextarea);
        let content = '';
        if (editTextarea) {
          content = editTextarea.value;
        }

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await delay(DELAYS.hover);

        if (content) return content;
      }

      console.warn(`Failed to extract message ${messageIndex + 1}`);
    } catch (error) {
      console.warn(`Failed to extract message ${messageIndex + 1}:`, error);
    } finally {
      messageContainer.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    }
  }

  async function extractAllHumanMessages() {
    console.log('🔄 Extracting human messages...');
    const userMessages = document.querySelectorAll(SELECTORS.userMessage);

    for (let i = 0; i < userMessages.length; i++) {
      const content = await extractMessageContent(userMessages[i], i);
      humanMessages.push({
        type: 'user',
        content: content,
        index: i
      });
      updateStatus();
    }

    console.log(`✅ Extracted ${humanMessages.length} human messages`);
  }

  // ============= CLIPBOARD INTERCEPTION (Original) =============

  navigator.clipboard.writeText = function(text) {
    if (interceptorActive && text && text.length > 20) {
      console.log(`📋 Captured Claude response ${capturedResponses.length + 1}`);
      capturedResponses.push({
        type: 'claude',
        content: text,
        timestamp: Date.now()
      });
      updateStatus();
    }
  };

  // ============= STATUS INDICATOR =============

  const statusDiv = document.createElement('div');
  statusDiv.style.cssText = `
    position: fixed; top: 10px; right: 10px; z-index: 10000;
    background: #2196F3; color: white; padding: 12px 18px;
    border-radius: 8px; font-family: monospace; font-size: 13px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 350px;
    line-height: 1.5;
  `;
  document.body.appendChild(statusDiv);

  function updateStatus() {
    const parts = [
      `Human: ${humanMessages.length}`,
      `Claude: ${capturedResponses.length}`,
      artifacts.length > 0 ? `Artifacts: ${artifacts.length}` : '',
      attachments.length > 0 ? `Attachments: ${attachments.length}` : ''
    ].filter(Boolean);
    
    statusDiv.textContent = parts.join(' | ');
  }

  async function triggerClaudeResponseCopy() {
    const copyButtons = document.querySelectorAll(SELECTORS.copyButton);
    if (copyButtons.length === 0) {
      throw new Error('No Claude copy buttons found!');
    }

    console.log(`🚀 Clicking ${copyButtons.length} Claude copy buttons...`);

    for (let i = 0; i < copyButtons.length; i++) {
      const button = copyButtons[i];
      try {
        if (button.offsetParent !== null) {
          button.scrollIntoView({ behavior: 'instant', block: 'nearest' });
          button.click();
          console.log(`🖱️ Clicked copy button ${i + 1}/${copyButtons.length}`);
        }
      } catch (error) {
        console.warn(`Failed to click button ${i + 1}:`, error);
      }
      if (i < copyButtons.length - 1) {
        await delay(DELAYS.copy);
      }
    }
  }

  // ============= ENHANCED MARKDOWN BUILDER =============

  function buildEnhancedMarkdown() {
    let markdown = `# 📝 Conversation with Claude\n\n`;
    markdown += `**Exported:** ${new Date().toLocaleString()}\n\n`;
    markdown += `**Stats:** ${humanMessages.length} messages, ${capturedResponses.length} responses, ${artifacts.length} artifacts, ${attachments.length} attachments\n\n`;
    markdown += `---\n\n`;

    // ========== SECTION 1: CONVERSATION FLOW (with references) ==========
    
    const maxLength = Math.max(humanMessages.length, capturedResponses.length);
    const artifactRefs = [];
    const attachmentRefs = [];

    for (let i = 0; i < maxLength; i++) {
      // Human message
      if (i < humanMessages.length && humanMessages[i].content) {
        markdown += `## 👤 Human:\n\n${humanMessages[i].content}\n\n`;
        
        // Add references to attachments (not full content)
        const messageAttachments = attachments.filter(a => a.index === i || a.type === 'text_file');
        if (messageAttachments.length > 0) {
          markdown += `**📎 Attachments:**\n`;
          messageAttachments.forEach((att, idx) => {
            const refId = `att-${attachmentRefs.length + 1}`;
            attachmentRefs.push({ id: refId, attachment: att });
            
            if (att.type === 'text_file' && att.content) {
              markdown += `- 📄 **${att.filename}** → See [${refId}](#${refId}) in Context section below\n`;
            } else if (att.type === 'image') {
              markdown += `- 🖼️ **${att.filename}** (${att.width}x${att.height}px)\n`;
            } else {
              markdown += `- 📎 **${att.filename}**\n`;
            }
          });
          markdown += `\n`;
        }
        
        markdown += `---\n\n`;
      }

      // Claude response
      if (i < capturedResponses.length) {
        markdown += `## 🤖 Claude:\n\n${capturedResponses[i].content}\n\n`;
        
        // Add references to artifacts (not full content)
        const responseArtifacts = artifacts.filter(a => {
          // Try to associate artifacts with responses
          return true; // For now, show all after response
        });
        
        if (i === capturedResponses.length - 1 && responseArtifacts.length > 0) {
          markdown += `**🎨 Created Artifacts:**\n`;
          responseArtifacts.forEach((art, idx) => {
            const refId = `art-${artifactRefs.length + 1}`;
            artifactRefs.push({ id: refId, artifact: art });
            markdown += `- 📦 **${art.title}** (${art.language}) → See [${refId}](#${refId}) in Context section below\n`;
          });
          markdown += `\n`;
        }
        
        markdown += `---\n\n`;
      }
    }

    // ========== SECTION 2: CONTEXT (full content) ==========
    
    markdown += `\n\n# 📚 CONTEXT\n\n`;
    markdown += `*This section contains the full content of all artifacts and attachments referenced above.*\n\n`;
    markdown += `---\n\n`;

    // Add all uploaded files/attachments with content
    if (attachmentRefs.length > 0) {
      markdown += `## 📎 Uploaded Files & Attachments\n\n`;
      
      attachmentRefs.forEach(({ id, attachment }) => {
        markdown += `<a id="${id}"></a>\n\n`;
        markdown += `### ${attachment.filename}\n\n`;
        
        if (attachment.content) {
          markdown += `**Type:** Text File | **Size:** ${attachment.content.length} characters\n\n`;
          markdown += `\`\`\`\n${attachment.content}\n\`\`\`\n\n`;
        } else if (attachment.url) {
          markdown += `**Type:** ${attachment.type} | **URL:** ${attachment.url}\n\n`;
        }
        
        markdown += `---\n\n`;
      });
    }

    // Add all artifacts with full content
    if (artifactRefs.length > 0) {
      markdown += `## 🎨 Artifacts (Code, Diagrams, Components)\n\n`;
      
      artifactRefs.forEach(({ id, artifact }) => {
        markdown += `<a id="${id}"></a>\n\n`;
        markdown += `### ${artifact.title}\n\n`;
        markdown += `**Language:** ${artifact.language} | **Type:** ${artifact.type}\n\n`;
        markdown += `\`\`\`${artifact.language}\n${artifact.content}\n\`\`\`\n\n`;
        markdown += `---\n\n`;
      });
    }

    // If artifacts weren't in refs, add them anyway
    if (artifactRefs.length === 0 && artifacts.length > 0) {
      markdown += `## 🎨 Artifacts (Code, Diagrams, Components)\n\n`;
      artifacts.forEach((art, idx) => {
        markdown += `### ${art.title}\n\n`;
        markdown += `**Language:** ${art.language} | **Type:** ${art.type}\n\n`;
        markdown += `\`\`\`${art.language}\n${art.content}\n\`\`\`\n\n`;
        markdown += `---\n\n`;
      });
    }

    // Add summary statistics at the end
    markdown += `\n## 📊 Export Summary\n\n`;
    markdown += `- **Messages:** ${humanMessages.length} human, ${capturedResponses.length} assistant\n`;
    markdown += `- **Artifacts:** ${artifacts.length} total\n`;
    markdown += `- **Attachments:** ${attachments.length} total (${attachments.filter(a => a.content).length} with full content)\n`;
    markdown += `- **Export Date:** ${new Date().toLocaleString()}\n`;

    return markdown;
  }

  function downloadMarkdown(content, filename) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  // ============= MAIN EXPORT FLOW =============

  async function startExport() {
    try {
      statusDiv.textContent = '⏳ Starting enhanced export...';
      
      // Step 1: Extract human messages
      statusDiv.textContent = '📝 Extracting human messages...';
      await extractAllHumanMessages();

      // Step 2: Extract artifacts
      statusDiv.textContent = '🎨 Extracting artifacts...';
      await extractArtifacts();
      await delay(DELAYS.artifact);

      // Step 3: Extract attachments
      statusDiv.textContent = '📎 Extracting attachments...';
      await extractAttachments();
      await delay(DELAYS.artifact);

      // Step 4: Copy Claude responses
      statusDiv.textContent = '🤖 Copying Claude responses...';
      await triggerClaudeResponseCopy();

      // Step 5: Wait for clipboard operations
      const copyButtons = document.querySelectorAll(SELECTORS.copyButton);
      await waitForClipboardOperations(copyButtons.length);

      completeExport();

    } catch (error) {
      statusDiv.textContent = `❌ Error: ${error.message}`;
      statusDiv.style.background = '#f44336';
      console.error('Export failed:', error);
    }
  }

  async function waitForClipboardOperations(expectedCount) {
    const maxWaitTime = 2000;
    const checkInterval = 100;
    let elapsed = 0;

    while (elapsed < maxWaitTime) {
      if (capturedResponses.length >= expectedCount) {
        console.log(`✅ All ${expectedCount} responses captured in ${elapsed}ms`);
        return;
      }
      await delay(checkInterval);
      elapsed += checkInterval;
    }

    console.warn(`⚠️ Timeout: Only captured ${capturedResponses.length}/${expectedCount} responses`);
  }

  function completeExport() {
    interceptorActive = false;

    if (humanMessages.length === 0 && capturedResponses.length === 0) {
      statusDiv.textContent = '❌ No messages captured!';
      statusDiv.style.background = '#f44336';
      return;
    }

    console.log('\n📊 Export Summary:');
    console.log(`  - Human messages: ${humanMessages.length}`);
    console.log(`  - Claude responses: ${capturedResponses.length}`);
    console.log(`  - Artifacts: ${artifacts.length}`);
    console.log(`  - Attachments: ${attachments.length} (${attachments.filter(a => a.content).length} with full content)`);
    
    if (artifacts.length > 0) {
      console.log('\n🎨 Artifacts found:');
      artifacts.forEach((art, i) => {
        console.log(`  ${i + 1}. ${art.title} (${art.language}, ${art.content.length} chars)`);
      });
    }
    
    if (attachments.filter(a => a.content).length > 0) {
      console.log('\n📎 Attachments with content:');
      attachments.filter(a => a.content).forEach((att, i) => {
        console.log(`  ${i + 1}. ${att.filename} (${att.content.length} chars)`);
      });
    }

    const markdown = buildEnhancedMarkdown();
    const filename = `${getConversationTitle()}_full_context.md`;
    downloadMarkdown(markdown, filename);

    const summary = [
      `✅ Exported: ${filename}`,
      `📝 ${humanMessages.length}msg`,
      `🤖 ${capturedResponses.length}resp`,
      artifacts.length > 0 ? `🎨 ${artifacts.length}art` : '',
      attachments.length > 0 ? `📎 ${attachments.length}att` : ''
    ].filter(Boolean).join(' | ');

    statusDiv.textContent = summary;
    statusDiv.style.background = '#4CAF50';
    statusDiv.style.fontSize = '12px';

    console.log('\n🎉 Enhanced export complete!');
    console.log(`📄 File: ${filename}`);
    console.log('\n💡 Tip: Check the "CONTEXT" section at the end of the markdown for all artifacts and file contents.');

    setTimeout(cleanup, 5000);
  }

  function cleanup() {
    navigator.clipboard.writeText = originalWriteText;
    if (document.body.contains(statusDiv)) {
      document.body.removeChild(statusDiv);
    }
  }

  // Initialize
  updateStatus();
  setTimeout(startExport, 1000);
}

// Run the enhanced exporter
setupEnhancedClaudeExporter();