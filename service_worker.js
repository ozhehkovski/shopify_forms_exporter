
const tokenCache = new Map();
chrome.webRequest.onBeforeSendHeaders.addListener(
  details => {
    const hdr = details.requestHeaders.find(h => h.name.toLowerCase() === "x-csrf-token");
    if (hdr && hdr.value) {
      tokenCache.set(details.tabId, hdr.value);
      chrome.runtime.sendMessage({ type: "csrf-found", tabId: details.tabId });
    }
  },
  { urls: ["https://admin.shopify.com/api/shopify/*"] },
  ["requestHeaders", "extraHeaders"]
);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "get-csrf") {
    const tabId = msg.tabId ?? sender?.tab?.id;
    sendResponse({ token: tokenCache.get(tabId) || "" });
  }
  return false; // synchronous response
});
