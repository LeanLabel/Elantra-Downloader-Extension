document.getElementById('downloadBtn').addEventListener('click', () => {
  const btn = document.getElementById('downloadBtn');
  const status = document.getElementById('status');
  const organize = document.getElementById('organizeCheck').checked;
  
  btn.disabled = true;
  btn.textContent = '⏳ Scanning...';
  status.textContent = '🔎 Scanning page for resources...';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      status.textContent = '❌ No active tab found.';
      resetButton(btn);
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: extractResources
    }, (results) => {
      if (chrome.runtime.lastError) {
        status.textContent = '❌ Error: ' + chrome.runtime.lastError.message;
        resetButton(btn);
        return;
      }
      
      const result = results[0].result;
      if (result.error) {
        status.textContent = '❌ ' + result.error;
        resetButton(btn);
        return;
      }

      const groups = result.data;
      const entries = Object.entries(groups);
      let total = 0;
      for (const [folder, files] of entries) {
        total += files.length;
      }

      if (total === 0) {
        status.textContent = '❌ No downloadable files found.';
        resetButton(btn);
        return;
      }

      // Send the data to the background service worker
      chrome.runtime.sendMessage({
        action: 'startDownload',
        groups: groups,
        organize: organize
      }, (response) => {
        if (chrome.runtime.lastError) {
          status.textContent = '❌ Background error: ' + chrome.runtime.lastError.message;
          resetButton(btn);
          return;
        }
        
        if (response && response.status === 'success') {
          status.innerHTML = `✅ ${response.message}<br>Check the extension badge for progress. You can close this popup.`;
          btn.textContent = '📦 Sent to Background';
          setTimeout(() => resetButton(btn), 2000);
        } else {
          status.textContent = '❌ ' + (response ? response.message : 'Unknown error.');
          resetButton(btn);
        }
      });
    });
  });
});

// ========================================
// This function runs INSIDE the webpage
// ========================================
function extractResources() {
  const groups = {};
  const allElements = document.querySelectorAll('li.public-section-header, a.resource-link');
  let currentHeader = 'Uncategorized';

  allElements.forEach(el => {
    // If it's a section header, update the current folder name
    if (el.matches('li.public-section-header')) {
      const span = el.querySelector('span');
      if (span) {
        currentHeader = span.innerText.trim();
      } else {
        currentHeader = el.innerText.trim();
      }
      currentHeader = currentHeader.replace(/[<>:"/\\|?*]/g, '_');
      if (!currentHeader) currentHeader = 'Uncategorized';
    }
    
    // If it's a file link
    else if (el.matches('a.resource-link')) {
      let href = el.getAttribute('href');
      if (!href) return;
      
      // Convert relative URLs to absolute
      if (href.startsWith('/')) {
        href = window.location.origin + href;
      } else if (!href.startsWith('http')) {
        href = new URL(href, window.location.href).href;
      }
      
      // Get the filename from the 'title' attribute
      const title = el.getAttribute('title') || '';
      let filename = title.replace(/^Click to download\s+/, '').trim();
      
      // Fallback: use the last part of the URL
      if (!filename) {
        const parts = href.split('/');
        filename = parts[parts.length - 1].split('?')[0] || 'file.bin';
      }
      
      // Remove illegal filesystem characters
      filename = filename.replace(/[<>:"/\\|?*]/g, '_');
      
      // Add to the current group
      if (!groups[currentHeader]) {
        groups[currentHeader] = [];
      }
      groups[currentHeader].push({ url: href, filename: filename });
    }
  });

  // Check if we found anything
  if (Object.keys(groups).length === 0) {
    return { error: 'No resource links found. Ensure you are on an Elentra event page.' };
  }
  
  return { success: true, data: groups };
}

function resetButton(btn) {
  btn.disabled = false;
  btn.textContent = '🔍 Scan & Download';
}