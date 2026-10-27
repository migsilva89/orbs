export const HTML_BOOTSTRAP = `(function () {
  var post = function (message) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    } else {
      window.parent.postMessage(message, '*');
    }
  };

  var previous = 0;
  var fontsLoaded = [];
  var resize = function () {
    var height = Math.ceil(document.body.getBoundingClientRect().height);

    if (height !== previous) {
      previous = height;
      post({ type: 'bots.html-height', height: height });
    }
  };

  window.addEventListener('message', function (event) {
    if (event.source !== window.parent || !event.data || event.data.type !== 'bots.html-theme') {
      return;
    }

    var root = document.documentElement;
    root.style.colorScheme = event.data.appearance;
    root.classList.toggle('dark', event.data.appearance === 'dark');
    Object.keys(event.data.tokens).forEach(function (name) { root.style.setProperty(name, String(event.data.tokens[name])); });
    (event.data.fonts || []).forEach(function (font) {
      if (fontsLoaded.indexOf(font.key) === -1 && typeof FontFace === 'function') {
        fontsLoaded.push(font.key);
        document.fonts.add(new FontFace(font.family, font.source, font.descriptors));
      }
    });

    if (document.body) {
      previous = 0;
      resize();
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    new ResizeObserver(resize).observe(document.body);
    resize();
  });

  document.addEventListener('click', function (event) {
    var link = event.target instanceof Element ? event.target.closest('a') : null;

    if (link === null) {
      return;
    }

    var href = link.getAttribute('href');

    if (href && href.indexOf('#') === 0) {
      return;
    }
    event.preventDefault();
    if (event.isTrusted && href) {
      post({ type: 'bots.html-link', url: href });
    }
  });
})();`;

export const HTML_KIT = [
  '.o-stack{display:flex;flex-direction:column;gap:16px}',
  '.o-row-wrap{display:flex;flex-wrap:wrap;align-items:center;gap:8px}',
  '.o-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}',
  '.o-h1,.o-h2{margin:0;font-size:16px;line-height:24px;font-weight:600;text-wrap:balance}',
  '.o-h3{margin:0;font-size:14px;line-height:20px;font-weight:600;text-wrap:balance}',
  '.o-text{margin:0;text-wrap:pretty}',
  '.o-muted{font-size:12px;line-height:16px;color:var(--muted-foreground)}',
  '.o-card{display:flex;flex-direction:column;gap:12px;padding:12px;border:0.5px solid var(--input);border-radius:24px;background:var(--secondary);color:var(--foreground)}',
  '.o-title{font-weight:500}',
  '.o-list{display:flex;flex-direction:column;overflow:hidden;border:0.5px solid var(--input);border-radius:14px;background:var(--background)}',
  '.o-row{display:flex;align-items:center;gap:12px;padding:10px 12px}',
  '.o-row+.o-row{border-top:0.5px solid var(--border)}',
  '.o-row>:first-child{flex:1;min-width:0}',
  '.o-stat{display:flex;flex-direction:column;gap:4px;min-width:0}',
  '.o-label{font-size:12px;line-height:16px;color:var(--muted-foreground)}',
  '.o-value{font-size:24px;line-height:32px;font-weight:600;font-variant-numeric:tabular-nums}',
  '.o-up{font-size:12px;line-height:16px;color:var(--success)}',
  '.o-down{font-size:12px;line-height:16px;color:var(--destructive)}',
  '.o-badge{display:inline-flex;align-items:center;height:18px;padding:0 8px;border:0.5px solid var(--input);border-radius:9999px;background:var(--muted);color:var(--muted-foreground);font-size:12px;font-weight:500;line-height:1}',
  '.o-button{display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 12px;border:0.5px solid var(--input);border-radius:8px;background:var(--background);color:var(--foreground);font:inherit;font-weight:500}',
  '.o-table{width:100%;border-collapse:collapse}',
  '.o-table th{padding:10px 12px;text-align:left;font-size:12px;font-weight:500;color:var(--muted-foreground);white-space:nowrap}',
  '.o-table td{padding:10px 12px;border-top:0.5px solid var(--border);white-space:nowrap;font-variant-numeric:tabular-nums}',
].join('');
