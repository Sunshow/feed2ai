export default defineBackground(() => {
  // Click extension icon to start selection mode directly
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      try {
        // Programmatically inject content script
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-scripts/content.js']
        });
        await browser.tabs.sendMessage(tab.id, { action: 'startSelection' });
      } catch (error) {
        console.error('Failed to start selection:', error);
      }
    }
  });
});
