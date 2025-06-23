
document.addEventListener("DOMContentLoaded", async () => {
  const btn = document.getElementById("downloadBtn");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  async function queryCsrf() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ type: "get-csrf", tabId: tab.id }, resp => {
        resolve(resp?.token ?? "");
      });
    });
  }

  // initial token check
  if (await queryCsrf()) {
    btn.disabled = false;
    btn.textContent = "Download data";
  }

  // listen when token appears
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "csrf-found" && msg.tabId === tab.id) {
      btn.disabled = false;
      btn.textContent = "Download data";
    }
  });

  btn.addEventListener("click", async () => {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = "Running…";
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    chrome.tabs.sendMessage(tab.id, { type: "downloadData" });
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
