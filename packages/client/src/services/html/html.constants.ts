export const HTML_BOOTSTRAP = `(function () {
  var post = function (message) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    } else {
      window.parent.postMessage(message, '*');
    }
  };

  var previous = 0;
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
