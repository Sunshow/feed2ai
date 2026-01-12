export default defineBackground(() => {
  // Click extension icon to start selection mode directly
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      try {
        await browser.tabs.sendMessage(tab.id, { action: 'startSelection' });
      } catch (error) {
        console.error('Failed to start selection:', error);
      }
    }
  });
});
