
document.addEventListener("DOMContentLoaded", async () => {
  const btn = document.getElementById("downloadBtn");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Enable the button based on URL — don't wait for CSRF token.
  // The content script will extract CSRF when the download runs.
  const isShopifyAdmin = tab.url?.includes("admin.shopify.com/store/");

  if (isShopifyAdmin) {
    btn.disabled = false;
    btn.textContent = "Download data";
  } else {
    btn.textContent = "Open a Shopify Forms page";
    btn.disabled = true;
  }

  btn.addEventListener("click", async () => {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = "Running…";
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
      chrome.tabs.sendMessage(tab.id, { type: "downloadData" });
    } catch (err) {
      btn.textContent = "Error: " + err.message;
      setTimeout(() => { btn.textContent = "Download data"; btn.disabled = false; }, 5000);
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "download-complete") {
      btn.textContent = msg.success ? "Done!" : ("Error: " + msg.error);
      setTimeout(() => {
        btn.textContent = "Download data";
        btn.disabled = false;
      }, 5000);
    }
  });
});
