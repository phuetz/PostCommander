// Service Worker for PostCommander Chrome Extension
console.log('PostCommander Background Service Worker Initialized.');

chrome.runtime.onInstalled.addListener(() => {
  console.log('PostCommander Extension Installed.');
});

// Listener to handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    console.log('Received PING from', sender);
    sendResponse({ status: 'PONG' });
  }
  return true; // Keep message channel open for async response if needed
});
