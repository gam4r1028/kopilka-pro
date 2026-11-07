/* Hash-роутер с параметрами и обновлением нижней панели */
window.KP = window.KP || {};
(function (KP) {
  'use strict';
  var routes = [];
  var notFound = null;
  var container = null;
  var tabUpdater = null;
  var current = { path: '/home', params: {}, route: null };

  function normalize(path) {
    if (!path) return '/home';
    if (path.charAt(0) !== '/') path = '/' + path;
    if (path.length > 1 && path.charAt(path.length - 1) === '/') path = path.slice(0, -1);
    return path;
  }

  function compile(pattern) {
    var parts = normalize(pattern).split('/').filter(Boolean);
    return parts.map(function (p) {
      if (p.charAt(0) === ':') return { param: p.slice(1) };
      return { literal: p };
    });
  }

  function matchRoute(path) {
    var segs = normalize(path).split('/').filter(Boolean);
    for (var i = 0; i < routes.length; i++) {
      var r = routes[i];
      if (r.parts.length !== segs.length) continue;
      var params = {};
      var ok = true;
      for (var j = 0; j < r.parts.length; j++) {
        if (r.parts[j].literal != null) {
          if (r.parts[j].literal !== segs[j]) { ok = false; break; }
        } else {
          params[r.parts[j].param] = decodeURIComponent(segs[j]);
        }
      }
      if (ok) return { route: r, params: params };
    }
    return null;
  }

  function pathFromHash() {
    var h = location.hash || '';
    if (h.charAt(0) === '#') h = h.slice(1);
    return normalize(h || '/home');
  }

  function render(animate) {
    if (!container) return;
    var path = pathFromHash();
    var found = matchRoute(path);
    var route = found ? found.route : notFound;
    var params = found ? found.params : {};
    current = { path: path, params: params, route: route };
    var node = null;
    if (route && route.handler) {
      try { node = route.handler(params); }
      catch (e) { console.error('KP router:', e); node = null; }
    }
    container.innerHTML = '';
    if (node) {
      var screen = node;
      if (screen.classList && !screen.classList.contains('screen')) screen.classList.add('screen');
      if (screen.classList) {
        screen.classList.remove('enter');
        if (animate) screen.classList.add('enter');
      }
      container.appendChild(screen);
    }
    document.title = (route && route.title ? route.title + ' · ' : '') + 'Копилка Pro';
    if (tabUpdater) tabUpdater(path);
    if (animate) window.scrollTo(0, 0);
    var scroller = function () {
      var el = container.querySelector('.screen');
      if (el) el.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    scroller();
    if (animate) requestAnimationFrame(scroller);
  }

  function refresh() {
    var y = window.scrollY;
    render(false);
    window.scrollTo(0, y);
    var el = container && container.querySelector('.screen');
    if (el) el.classList.toggle('is-scrolled', y > 12);
  }

  var router = {
    add: function (pattern, handler, title) {
      routes.push({ parts: compile(pattern), handler: handler, title: title || '', pattern: pattern });
      return router;
    },
    notFound: function (handler) { notFound = { handler: handler, title: 'Не найдено' }; },
    start: function () {
      container = document.getElementById('screen');
      if (!location.hash) {
        try { history.replaceState(null, '', '#/home'); } catch (e) { location.hash = '#/home'; }
      }
      window.addEventListener('hashchange', function () { render(true); });
      window.addEventListener('scroll', function () {
        var el = container && container.querySelector('.screen');
        if (el) el.classList.toggle('is-scrolled', window.scrollY > 12);
      }, { passive: true });
      render(true);
    },
    refresh: refresh,
    go: function (path) {
      var target = normalize(path);
      if (pathFromHash() === target) { refresh(); return; }
      location.hash = target;
    },
    replace: function (path) {
      try { history.replaceState(null, '', '#' + normalize(path)); render(true); }
      catch (e) { location.hash = normalize(path); }
    },
    back: function () {
      if (history.length > 1) history.back();
      else router.go('/home');
    },
    current: function () { return current; },
    setTabUpdater: function (fn) { tabUpdater = fn; }
  };

  KP.router = router;
})(window.KP);
