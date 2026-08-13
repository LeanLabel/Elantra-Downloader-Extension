# Elentra Resource Downloader

A Chrome extension that batch-downloads all files from an Elentra event page, grouping them by section.

---

## Features

- **Scans the current Elentra event page** – finds every resource link.
- **Groups files by section header** – create folders like `2.1 Cytoskeleton`, `2.2 Cell Signalling`, etc.
- **Optional folder organisation** – toggles subfolders per section inside your Downloads directory.
- **Background processing** – the queue continues downloading even when the popup is closed.
- **Live progress badge** – shows `completed/total` on the extension icon; turns green with ✅ when done.
- **Automatic conflict handling** – uses Chrome's `uniquify` to avoid overwriting existing files.

---

## Installation (Developer Mode)

This extension is not published on the Chrome Web Store, so you must load it manually:

1. Download or clone this repository to a folder on your computer.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top‑right corner).
4. Click **Load unpacked** and select the folder containing `manifest.json`, `background.js`, `popup.html`, and `popup.js`.
5. The extension icon will appear in your Chrome toolbar.

---

## Usage

1. Go to an **Elentra course page** with listed resources.
2. Click the extension icon in the toolbar.
3. In the popup:
   - Tick **"Organize into folders"** if you want files saved inside section‑named subfolders.
   - Click **"Scan & Download"**.
4. The popup will show a status message and send the queue to the background.
5. Monitor progress via the **badge** on the extension icon.
6. When finished, the badge turns green with ✅ and clears after 10 seconds.

All files are saved to your default Chrome Downloads folder.

---

## Permissions & Hosts

| Permission | Reason |
|------------|--------|
| `activeTab` | To inject the content script into the current page. |
| `downloads` | To trigger file downloads and monitor progress. |
| `scripting` | To execute the extraction script on the page. |
| `https://webapps.duke-nus.edu.sg/*` | The only domain the extension is allowed to run on (Duke‑NUS Elentra). |

> **Note:** If your Elentra instance uses a different domain, update the `host_permissions` in `manifest.json`.

---

## Notes

- No data is stored locally
- The download queue is lost if you reload the extension or close Chrome.
- Works best on single‑page Elentra views. If the page uses lazy loading, scroll to load all items before scanning.

---