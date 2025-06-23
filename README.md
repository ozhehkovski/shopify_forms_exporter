
# Shopify Forms Exporter

**Version 1.4.2 — open‑source, MIT‑licensed**

## What it does
This Chrome/Chromium extension adds a **Download data** button for any Shopify Admin page that shows a Shopify Forms form.  
One click fetches *all* form submissions via the same GraphQL endpoint the admin uses, follows the pagination cursor until the last page, then saves the result as a CSV file that opens cleanly in Excel.

## How it works
* A content‑script sends the GraphQL queries directly from the browser, using your existing admin cookies.  
* A background service‑worker passively captures the `x‑csrf‑token` header from any request the page itself fires and reuses it, so the extension works even on deep SPA routes where the meta‑tag is missing.  
* The `app‑‑<id>‑‑shopify‑forms<formId>` part of the URL is parsed on the fly, so the exporter adapts to custom IDs.  
* All code is fully client‑side; **nothing** is sent anywhere except to your own Shopify store.

## Installation (dev build)

[Installation and usage guide for the extension](https://www.example.com/my%20great%20page)

1. Download / unzip this repo.  
2. Visit `chrome://extensions`, enable *Developer mode*, click **Load unpacked** and select the folder.  
3. Open a Shopify Forms admin page (e.g. `/apps/shopify-forms/forms/<formId>` or the metaobjects listing) and click the extension icon – the popup will show **Download data** once the CSRF token is available.

## Caveats
* Provided **as‑is** – use at your own risk.  
* Works only while you are logged into Shopify Admin; it relies on your session cookies.  
* Tested on Chrome 137, Manifest V3.

## License
MIT. See `LICENSE` file (or just treat it as MIT if the file is missing – no restrictions beyond attribution and no warranty).

---

**Developed with ❤️ by the DataEase team.**
