chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SEARCH_BOOKMARKS') {
    chrome.bookmarks.search(message.query, (results) => {
      // Filter out folders, only keep URLs
      const filtered = results.filter(item => item.url).slice(0, 10);
      sendResponse(filtered);
    });
    return true; // Keep channel open for async response
  }
});
