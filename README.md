# BookRoll PDF Downloader

A Chrome extension that captures all pages from a [BookRoll](https://www.let.media.kyoto-u.ac.jp/project/digital-teaching-material-delivery-system-bookroll/) e-textbook and saves them as a single PDF.

## Installation

1. Download and unzip this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the unzipped folder
5. The extension icon will appear in your toolbar

## Usage

1. Open a BookRoll material page in Chrome
2. Click the extension icon
3. Click **Scan Pages** — the extension will automatically navigate through all pages
4. Once scanning is complete, click **Download PDF**

## Notes

- Do not interact with the page while scanning
- Works on BookRoll instances that render pages on a `material-canvas` element
- For personal use only. Please respect your institution's terms of use and copyright rules.

## How it works

The extension reads the content of the `canvas.material-canvas` element on each page, detects page transitions by comparing canvas pixel signatures, and assembles the captured frames into a raw PDF binary — no external libraries required.
