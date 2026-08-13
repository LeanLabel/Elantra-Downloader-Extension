// Background service worker - persists even when popup is closed
let downloadQueue = [];
let isProcessing = false;
let totalCount = 0;
let completedCount = 0;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startDownload') {
    const groups = message.groups;
    const organize = message.organize;
    
    // Build the queue
    let queue = [];
    for (const [folder, files] of Object.entries(groups)) {
      let folderName = folder.replace(/[<>:"/\\|?*]/g, '_');
      if (!folderName) folderName = 'Uncategorized';
      
      for (const file of files) {
        let filename = file.filename.replace(/[<>:"/\\|?*]/g, '_');
        if (!filename) filename = 'file.bin';
        
        let fullPath = organize ? folderName + '/' + filename : filename;
        queue.push({ url: file.url, filename: fullPath });
      }
    }
    
    if (queue.length === 0) {
      sendResponse({ status: 'error', message: 'No files to download.' });
      return;
    }
    
    // Replace any existing queue with the new one
    downloadQueue = queue;
    totalCount = queue.length;
    completedCount = 0;
    
    // Update badge to show progress
    chrome.action.setBadgeText({ text: `0/${totalCount}` });
    chrome.action.setBadgeBackgroundColor({ color: '#1a73e8' });
    
    if (!isProcessing) {
      processQueue();
    }
    
    sendResponse({ status: 'success', message: `Started downloading ${totalCount} files in the background.` });
  }
});

function processQueue() {
  if (downloadQueue.length === 0) {
    isProcessing = false;
    chrome.action.setBadgeText({ text: '✅' });
    chrome.action.setBadgeBackgroundColor({ color: '#28a745' });
    // Clear the badge after 10 seconds
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 10000);
    return;
  }
  
  isProcessing = true;
  const item = downloadQueue.shift();
  
  chrome.downloads.download({
    url: item.url,
    filename: item.filename,
    conflictAction: 'uniquify'
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error('Download error:', chrome.runtime.lastError.message);
    }
    
    completedCount++;
    chrome.action.setBadgeText({ text: `${completedCount}/${totalCount}` });
    
    // Polite delay: 800ms between files
    setTimeout(processQueue, 800);
  });
}

// Optional: Reset badge if downloads finish while popup is closed
chrome.downloads.onChanged.addListener((delta) => {
  // If a download completes or fails, we could update state, but our queue handles it.
});