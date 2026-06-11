// Content script: expose page info for popup
(function() {
  window.__bookrollHelper = {
    getPageInfo: () => {
      const imgs = Array.from(document.querySelectorAll('img'))
        .filter(i => i.src.startsWith('data:image'));
      return { imageCount: imgs.length, url: location.href };
    }
  };
})();
