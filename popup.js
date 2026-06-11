let collectedImages = [];

function getCanvas(tabId) {
  return chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const c = document.querySelector('canvas.material-canvas');
      if (!c) return null;
      return c.toDataURL('image/jpeg', 0.92);
    }
  });
}

function pressRight(tabId) {
  return chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      document.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight', keyCode:39, bubbles:true}));
    }
  });
}

function sig(dataUrl) {
  if (!dataUrl) return '';
  const mid = Math.floor(dataUrl.length / 2);
  return dataUrl.substring(mid - 100, mid + 100);
}

document.getElementById('btn-scan').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const btnScan = document.getElementById('btn-scan');
  const btnDownload = document.getElementById('btn-download');
  const status = document.getElementById('status');
  const progressBar = document.getElementById('progress-bar');
  const progressFill = document.getElementById('progress-fill');

  btnScan.disabled = true;
  btnDownload.style.display = 'none';
  collectedImages = [];
  progressBar.style.display = 'block';
  progressFill.style.width = '0%';
  status.textContent = 'Returning to page 1...';

  // Go to page 1
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      for (let i = 0; i < 400; i++) {
        document.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowLeft', keyCode:37, bubbles:true}));
      }
      await wait(1500);
    }
  });

  status.textContent = 'Scanning...';

  const images = [];
  let lastSig = null;
  let samePageCount = 0;
  const MAX_SAME = 3;
  const MAX_PAGES = 600;

  // Grab first page
  const firstResult = await getCanvas(tab.id);
  const firstData = firstResult[0].result;
  if (!firstData) {
    status.textContent = '❌ Canvas not found. Make sure you are on a BookRoll material page.';
    btnScan.disabled = false;
    return;
  }
  images.push({ page: 1, data: firstData });
  lastSig = sig(firstData);
  status.textContent = 'Scanning... page 1';

  for (let page = 2; page <= MAX_PAGES; page++) {
    await pressRight(tab.id);

    // Poll until canvas changes (up to 2 seconds)
    let newData = null;
    let changed = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise(r => setTimeout(r, 100));
      const r = await getCanvas(tab.id);
      newData = r[0].result;
      if (sig(newData) !== lastSig) { changed = true; break; }
    }

    if (!changed) {
      samePageCount++;
      if (samePageCount >= MAX_SAME) break; // end of document — stop immediately
      continue;
    }

    samePageCount = 0;
    lastSig = sig(newData);
    images.push({ page, data: newData });

    const pct = Math.min(95, Math.round((page / (page + 3)) * 100));
    progressFill.style.width = pct + '%';
    status.textContent = `Scanning... page ${page}`;
  }

  collectedImages = images;
  progressFill.style.width = '100%';
  status.textContent = `✅ Done — ${collectedImages.length} pages captured`;
  btnDownload.style.display = 'block';
  btnScan.disabled = false;
});

document.getElementById('btn-download').addEventListener('click', async () => {
  if (collectedImages.length === 0) return;
  const status = document.getElementById('status');
  status.textContent = 'Building PDF...';

  try {
    const pdfBytes = await buildPDF(collectedImages);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    await chrome.downloads.download({ url, filename: 'bookroll.pdf', saveAs: true });
    status.textContent = '✅ PDF downloaded!';
  } catch(e) {
    status.textContent = '❌ Error: ' + e.message;
    console.error(e);
  }
});

// ---- Minimal raw PDF builder (no external dependencies) ----
async function buildPDF(pages) {
  const imgObjects = [];
  for (const p of pages) {
    const { width, height, jpegBytes } = await getImageInfo(p.data);
    imgObjects.push({ width, height, jpegBytes });
  }

  const parts = [];
  const offsets = {};
  const enc = str => new TextEncoder().encode(str);
  const push = b => parts.push(b instanceof Uint8Array ? b : enc(b));
  const byteLen = () => parts.reduce((a, b) => a + b.length, 0);

  push('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  let objId = 1;
  const pageObjIds = [], imgObjIds = [];

  for (let i = 0; i < imgObjects.length; i++) {
    const { width, height, jpegBytes } = imgObjects[i];

    const imgId = objId++;
    imgObjIds.push(imgId);
    offsets[imgId] = byteLen();
    push(`${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
    push(jpegBytes);
    push('\nendstream\nendobj\n');

    const contentStr = `q ${width} 0 0 ${height} 0 0 cm /Im${i} Do Q\n`;
    const contentId = objId++;
    offsets[contentId] = byteLen();
    push(`${contentId} 0 obj\n<< /Length ${contentStr.length} >>\nstream\n${contentStr}\nendstream\nendobj\n`);

    const pageId = objId++;
    pageObjIds.push(pageId);
    offsets[pageId] = byteLen();
    push(`${pageId} 0 obj\n<< /Type /Page /Parent 1000 0 R /MediaBox [0 0 ${width} ${height}] /Contents ${contentId} 0 R /Resources << /XObject << /Im${i} ${imgId} 0 R >> >> >>\nendobj\n`);
  }

  const pagesId = 1000;
  offsets[pagesId] = byteLen();
  push(`${pagesId} 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pageObjIds.length} >>\nendobj\n`);

  const catalogId = objId++;
  offsets[catalogId] = byteLen();
  push(`${catalogId} 0 obj\n<< /Type /Catalog /Pages ${pagesId} 0 R >>\nendobj\n`);

  const xrefOffset = byteLen();
  const maxId = Math.max(...Object.keys(offsets).map(Number));
  push(`xref\n0 ${maxId + 1}\n`);
  push('0000000000 65535 f \n');
  for (let id = 1; id <= maxId; id++) {
    const off = offsets[id] !== undefined ? offsets[id] : 0;
    const free = offsets[id] !== undefined ? 'n' : 'f';
    push(String(off).padStart(10,'0') + ` 00000 ${free} \n`);
  }
  push(`trailer\n<< /Size ${maxId+1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  const totalLen = parts.reduce((a,b)=>a+b.length,0);
  const out = new Uint8Array(totalLen);
  let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  return out;
}

async function getImageInfo(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        blob.arrayBuffer().then(buf => resolve({
          width: img.width, height: img.height, jpegBytes: new Uint8Array(buf)
        }));
      }, 'image/jpeg', 0.92);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
