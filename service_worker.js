
// Persist tokens in chrome.storage.session so they survive service worker restarts.
// MV3 service workers are ephemeral — an in-memory Map gets wiped when Chrome
// terminates the worker (~30 s of inactivity).

chrome.webRequest.onBeforeSendHeaders.addListener(
  details => {
    const hdr = details.requestHeaders.find(h => h.name.toLowerCase() === "x-csrf-token");
    if (hdr && hdr.value) {
      const key = "csrf_" + details.tabId;
      chrome.storage.session.set({ [key]: hdr.value });
      chrome.runtime.sendMessage({ type: "csrf-found", tabId: details.tabId }).catch(() => {});
    }
  },
  // Widen the filter to catch any Shopify admin API path
  { urls: ["https://admin.shopify.com/api/*", "https://admin.shopify.com/internal/*"] },
  ["requestHeaders", "extraHeaders"]
);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "get-csrf") {
    const tabId = msg.tabId ?? sender?.tab?.id;
    const key = "csrf_" + tabId;
    chrome.storage.session.get(key).then(result => {
      sendResponse({ token: result[key] || "" });
    });
    return true; // keep channel open for async sendResponse
  }
});
