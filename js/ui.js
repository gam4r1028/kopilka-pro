/* UI-компоненты: иконки, sheet, snackbar, numpad, чипы, toggle */
window.KP = window.KP || {};
(function (KP) {
  'use strict';
  var U = KP.utils;

  var ICONS = {
    home: '<path d="M3 10.8 12 3l9 7.8V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    history: '<path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    more: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    transfer: '<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.2 3M6.2 6.2C3.9 8 2.5 12 2.5 12S6 18 12 18c1.4 0 2.6-.3 3.8-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowDown: '<path d="M12 4v16M6 14l6 6 6-6"/>',
    arrowUp: '<path d="M12 20V4M6 10l6-6 6 6"/>',
    chevronRight: '<path d="M9 5l7 7-7 7"/>',
    chevronDown: '<path d="M5 9l7 7 7-7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/>',
    edit: '<path d="M4 20h4L20 8l-4-4L4 16z"/><path d="M14 6l4 4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    sparkles: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/>',
    flame: '<path d="M12 3c1 4-2 5.5-2 8.5A2 2 0 0 0 14 13c0-1 .5-2 1-2.5 1.2 1.6 2 3.3 2 5A5 5 0 0 1 7 15.5C7 11 12 8 12 3z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4v2a3 3 0 0 0 3 3M16 6h4v2a3 3 0 0 1-3 3M12 13v4M8 21h8M9 17h6v4H9z"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 14h2"/>',
    repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    settings: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    pin: '<path d="M9 3h6l-1 6 4 4v2H6v-2l4-4z"/><path d="M12 15v6"/>',
    archive: '<rect x="3" y="4" width="18" height="5" rx="2"/><path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
    snow: '<path d="M12 2v20M4 6l16 12M20 6L4 18M8 4l4 4 4-4M8 20l4-4 4 4"/>',
    gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M3 12h18M12 8v13M8 8a2.5 2.5 0 1 1 0-5c2 0 4 5 4 5M16 8a2.5 2.5 0 1 0 0-5c-2 0-4 5-4 5"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    dots: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    backspace: '<path d="M21 6H9l-6 6 6 6h12z"/><path d="M13 9l4 6M17 9l-4 6"/>',
    alert: '<path d="M12 3 2.5 20h19z"/><path d="M12 9v5M12 17.5v.1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.1"/>',
    piggy: '<path d="M4 13a7 7 0 0 1 7-7h3l4 3h2v5l-2 1v3h-3v-2H8v2H5v-4a7 7 0 0 1-1-3z"/><circle cx="8.5" cy="12" r="1"/><path d="M13 7.5h4"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-3-5.5 3 1-6.2L3 9.6l6.2-.9z"/>'
  };

  function icon(name, size) {
    var p = ICONS[name] || ICONS.info;
    var s = size || 24;
    return '<svg class="icon" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  var openSheets = 0;
  var sheetCounter = 0;

  function lockScroll() {
    openSheets++;
    document.documentElement.classList.add('no-scroll');
  }
  function unlockScroll() {
    openSheets = Math.max(0, openSheets - 1);
    if (openSheets === 0) document.documentElement.classList.remove('no-scroll');
  }

  function sheet(opts) {
    opts = opts || {};
    var backdrop = document.createElement('div');
    backdrop.className = 'sheet-backdrop';
    var panel = document.createElement('section');
    panel.className = 'sheet' + (opts.className ? ' ' + opts.className : '');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    var titleId = 'sheet-title-' + (++sheetCounter);
    if (opts.title) panel.setAttribute('aria-labelledby', titleId);
    else panel.setAttribute('aria-label', opts.ariaLabel || 'Окно');

    var head = '';
    if (opts.title) {
      head = '<header class="sheet-head"><h2 id="' + titleId + '">' + U.esc(opts.title) + '</h2>' +
        (opts.showClose === false ? '' : '<button type="button" class="icon-btn sheet-close" aria-label="Закрыть">' + icon('close') + '</button>') +
        '</header>';
    }
    panel.innerHTML = '<div class="sheet-grab" aria-hidden="true"></div>' + head +
      '<div class="sheet-body"></div>' +
      (opts.footer ? '<footer class="sheet-foot"></footer>' : '');

    var body = panel.querySelector('.sheet-body');
    if (opts.subtitle) {
      var sub = document.createElement('p');
      sub.className = 'sheet-sub';
      sub.textContent = opts.subtitle;
      body.appendChild(sub);
    }
    if (typeof opts.content === 'string') body.insertAdjacentHTML('beforeend', opts.content);
    else if (opts.content) body.appendChild(opts.content);

    var footer = panel.querySelector('.sheet-foot');
    if (opts.footer) {
      if (typeof opts.footer === 'string') footer.innerHTML = opts.footer;
      else footer.appendChild(opts.footer);
    }

    var previous = document.activeElement;
    var closed = false;
    function onKey(e) {
      if (e.key === 'Escape') {
        if (opts.dismissible === false) return;
        var all = document.querySelectorAll('.sheet-backdrop');
        if (all.length && all[all.length - 1] !== backdrop) return;
        e.preventDefault();
        close();
      }
      if (e.key === 'Tab') {
        var focusables = panel.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    function close() {
      if (closed) return;
      closed = true;
      backdrop.classList.remove('is-open');
      unlockScroll();
      document.removeEventListener('keydown', onKey);
      setTimeout(function () {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        if (previous && previous.focus) { try { previous.focus(); } catch (e) { /* игнорируем */ } }
      }, 280);
      if (opts.onClose) opts.onClose();
    }

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop && opts.dismissible !== false) close();
    });
    var closeBtn = panel.querySelector('.sheet-close');
    if (closeBtn) closeBtn.addEventListener('click', close);

    backdrop.appendChild(panel);
    document.getElementById('overlays').appendChild(backdrop);
    document.addEventListener('keydown', onKey);
    lockScroll();
    requestAnimationFrame(function () {
      backdrop.classList.add('is-open');
      var firstFocus = panel.querySelector('.sheet-close, button, input, select, textarea');
      if (firstFocus) { try { firstFocus.focus({ preventScroll: true }); } catch (e) { /* игнорируем */ } }
    });

    return { backdrop: backdrop, panel: panel, body: body, footer: footer, close: close };
  }

  function confirm(opts) {
    return new Promise(function (resolve) {
      var content = document.createElement('div');
      content.innerHTML = '<p class="confirm-text">' + U.esc(opts.text || '') + '</p>';
      var foot = document.createElement('div');
      foot.className = 'confirm-actions';
      var cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'btn btn-ghost';
      cancel.textContent = opts.cancelText || 'Отмена';
      var ok = document.createElement('button');
      ok.type = 'button';
      ok.className = 'btn ' + (opts.danger ? 'btn-danger' : 'btn-primary');
      ok.textContent = opts.confirmText || 'Подтвердить';
      foot.appendChild(cancel);
      foot.appendChild(ok);
      var s = sheet({ title: opts.title || 'Подтверждение', content: content, footer: foot, onClose: function () { resolve(false); } });
      cancel.addEventListener('click', function () { s.close(); });
      ok.addEventListener('click', function () { resolve(true); s.close(); });
    });
  }

  var snackTimer = null;
  var snackEl = null;

  function snackbar(opts) {
    opts = opts || {};
    var root = document.getElementById('snackbar-root');
    if (!root) return null;
    if (snackEl) { clearTimeout(snackTimer); if (snackEl.parentNode) snackEl.parentNode.removeChild(snackEl); snackEl = null; }
    var el = document.createElement('div');
    el.className = 'snackbar';
    el.setAttribute('role', 'status');
    var text = document.createElement('span');
    text.className = 'snackbar-text';
    text.textContent = opts.text || '';
    el.appendChild(text);
    var action = null;
    if (opts.actionText) {
      action = document.createElement('button');
      action.type = 'button';
      action.className = 'snackbar-action';
      action.textContent = opts.actionText;
      el.appendChild(action);
    }
    root.appendChild(el);
    snackEl = el;
    requestAnimationFrame(function () { el.classList.add('is-on'); });
    function dismiss() {
      el.classList.remove('is-on');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        if (snackEl === el) snackEl = null;
      }, 240);
    }
    if (action) {
      action.addEventListener('click', function () {
        dismiss();
        if (opts.onAction) opts.onAction();
      });
    }
    snackTimer = setTimeout(dismiss, opts.duration || (action ? 6000 : 3200));
    return { dismiss: dismiss };
  }

  function numpad(opts) {
    opts = opts || {};
    var value = opts.value ? String(opts.value) : '';
    var wrap = document.createElement('div');
    wrap.className = 'numpad-wrap';
    wrap.innerHTML = '<div class="numpad-display"><span class="numpad-value"></span><span class="numpad-cur"></span></div>' +
      '<div class="numpad" role="group" aria-label="Цифровая клавиатура"></div>';
    var grid = wrap.querySelector('.numpad');
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'].forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'numpad-key' + (k === 'del' ? ' numpad-key-del' : '');
      b.dataset.key = k;
      if (k === 'del') { b.innerHTML = icon('backspace', 26); b.setAttribute('aria-label', 'Удалить'); }
      else b.textContent = k;
      grid.appendChild(b);
    });
    var valueEl = wrap.querySelector('.numpad-value');
    var curEl = wrap.querySelector('.numpad-cur');
    var currency = U.currency(opts.currency || 'RUB').symbol;

    function fmt() {
      var parts = value.split(',');
      var int = parts[0] || '0';
      int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      valueEl.textContent = int + (parts.length > 1 ? ',' + parts[1] : '');
      curEl.textContent = ' ' + currency;
    }
    function notify() {
      fmt();
      if (opts.onChange) opts.onChange(U.toMinor(value), value);
    }
    function press(k) {
      if (k === 'del') value = value.slice(0, -1);
      else if (k === ',') { if (value.indexOf(',') < 0) value = (value || '0') + ','; }
      else {
        var parts = value.split(',');
        if (parts.length > 1 && parts[1].length >= 2) return;
        if (value === '0' && k !== '00') value = '';
        if (k === '00') {
          if (!value) return;
          if (parts.length > 1) value += '0'.repeat(Math.min(2, 2 - parts[1].length));
          else {
            if (value.replace(/\D/g, '').length >= 9) return;
            value += '00';
          }
        } else {
          if (parts.length === 1 && value.replace(/\D/g, '').length >= 9) return;
          value += k;
        }
      }
      U.haptic(6);
      notify();
    }
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-key]');
      if (b) press(b.dataset.key);
    });
    function onKey(e) {
      if (!document.body.contains(wrap)) { document.removeEventListener('keydown', onKey); return; }
      if (/^[0-9]$/.test(e.key)) { press(e.key); e.preventDefault(); }
      else if (e.key === ',' || e.key === '.') { press(','); e.preventDefault(); }
      else if (e.key === 'Backspace') { press('del'); e.preventDefault(); }
    }
    document.addEventListener('keydown', onKey);
    fmt();
    return {
      el: wrap,
      set: function (v) { value = v == null ? '' : String(v); notify(); },
      get: function () { return U.toMinor(value); },
      reset: function () { value = ''; notify(); },
      destroy: function () { document.removeEventListener('keydown', onKey); }
    };
  }

  function segmented(opts) {
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.className = 'seg';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', opts.ariaLabel || 'Выбор');
    (opts.options || []).forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg-item' + (o.value === opts.value ? ' is-on' : '');
      b.dataset.value = o.value;
      b.setAttribute('aria-pressed', o.value === opts.value ? 'true' : 'false');
      b.textContent = o.label;
      wrap.appendChild(b);
    });
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('.seg-item');
      if (!b) return;
      wrap.querySelectorAll('.seg-item').forEach(function (x) {
        x.classList.toggle('is-on', x === b);
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      if (opts.onChange) opts.onChange(b.dataset.value);
    });
    return wrap;
  }

  function chips(opts) {
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.className = 'chips' + (opts.scroll ? ' scroll' : '');
    var selected = opts.multiple ? new Set(opts.value || []) : new Set(opts.value != null ? [opts.value] : []);
    (opts.options || []).forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (selected.has(o.value) ? ' is-on' : '');
      b.dataset.value = o.value;
      b.setAttribute('aria-pressed', selected.has(o.value) ? 'true' : 'false');
      b.innerHTML = (o.emoji ? '<span class="chip-emoji">' + U.esc(o.emoji) + '</span>' : '') + '<span>' + U.esc(o.label) + '</span>';
      wrap.appendChild(b);
    });
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      var v = b.dataset.value;
      if (opts.multiple) {
        if (selected.has(v)) selected.delete(v); else selected.add(v);
      } else {
        selected.clear();
        selected.add(v);
      }
      wrap.querySelectorAll('.chip').forEach(function (x) {
        var on = selected.has(x.dataset.value);
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (opts.onChange) opts.onChange(opts.multiple ? Array.from(selected) : v);
    });
    return wrap;
  }

  function toggle(opts) {
    opts = opts || {};
    var label = document.createElement('label');
    label.className = 'toggle';
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!opts.checked;
    if (opts.ariaLabel) input.setAttribute('aria-label', opts.ariaLabel);
    var track = document.createElement('span');
    track.className = 'toggle-track';
    label.appendChild(input);
    label.appendChild(track);
    if (opts.label) {
      var text = document.createElement('span');
      text.textContent = opts.label;
      label.appendChild(text);
    }
    input.addEventListener('change', function () { if (opts.onChange) opts.onChange(input.checked); });
    return label;
  }

  function empty(opts) {
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.className = 'empty';
    wrap.innerHTML =
      '<svg class="empty-art" viewBox="0 0 160 130" fill="none" aria-hidden="true">' +
      '<ellipse cx="80" cy="112" rx="52" ry="9" fill="var(--card-2)"/>' +
      '<path d="M34 63c0-20 16-33 38-33h14l17 12h12v25l-9 5v13h-14v-8H57v8H42v-14c-5-3-8-5-8-8z" fill="var(--card)" stroke="var(--line-2)" stroke-width="2"/>' +
      '<circle cx="55" cy="58" r="3" fill="var(--accent)"/>' +
      '<path d="M73 30h20" stroke="var(--accent)" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="118" cy="45" r="12" fill="var(--accent-soft)"/>' +
      '<path d="M118 39v12M112 45h12" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M34 96c10 6 24 9 46 9s38-3 48-9" stroke="var(--line-2)" stroke-width="2" stroke-linecap="round"/>' +
      '</svg>' +
      '<h3></h3><p></p>';
    wrap.querySelector('h3').textContent = opts.title || 'Пока пусто';
    wrap.querySelector('p').textContent = opts.text || '';
    if (opts.actionLabel) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-primary btn-sm';
      b.textContent = opts.actionLabel;
      if (opts.onAction) b.addEventListener('click', opts.onAction);
      wrap.appendChild(b);
    }
    return wrap;
  }

  function applyTheme(settings) {
    document.documentElement.dataset.theme = settings.theme || 'dark';
    document.documentElement.dataset.accent = settings.accent || 'yellow';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', settings.theme === 'light' ? '#F4F4F6' : settings.theme === 'amoled' ? '#000000' : '#0F0F10');
    }
  }

  function init() {
    document.addEventListener('pointerdown', function (e) {
      var host = e.target.closest('.btn, .chip, .quick-btn, .numpad-key, .list-row, .goal-row, .tab, .icon-btn');
      if (!host || U.prefersReduced()) return;
      var rect = host.getBoundingClientRect();
      if (!rect.width) return;
      host.classList.add('ripple-host');
      var ink = document.createElement('span');
      ink.className = 'ripple-ink';
      var size = Math.max(rect.width, rect.height);
      ink.style.width = size + 'px';
      ink.style.height = size + 'px';
      ink.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ink.style.top = (e.clientY - rect.top - size / 2) + 'px';
      host.appendChild(ink);
      setTimeout(function () { if (ink.parentNode) ink.parentNode.removeChild(ink); }, 560);
    }, { passive: true });
  }

  KP.ui = {
    icon: icon,
    sheet: sheet,
    confirm: confirm,
    snackbar: snackbar,
    numpad: numpad,
    segmented: segmented,
    chips: chips,
    toggle: toggle,
    empty: empty,
    applyTheme: applyTheme,
    init: init
  };
})(window.KP);
