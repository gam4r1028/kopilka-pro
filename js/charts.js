/* Графики на SVG: спарклайны, кольца, линии, донаты, столбцы */
window.KP = window.KP || {};
(function (KP) {
  'use strict';
  var U = KP.utils;
  var uid = 0;

  function sparkline(values, opts) {
    opts = opts || {};
    var w = opts.width || 100, h = opts.height || 30;
    var vals = (values || []).map(function (v) { return Number(v) || 0; });
    if (!vals.length) vals = [0, 0];
    if (vals.length === 1) vals = [vals[0], vals[0]];
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var range = max - min || 1;
    var pad = 2;
    var points = vals.map(function (v, i) {
      var x = pad + (i / (vals.length - 1)) * (w - pad * 2);
      var y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return [x, y];
    });
    var line = points.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = line + ' L' + (w - pad) + ' ' + (h - pad) + ' L' + pad + ' ' + (h - pad) + ' Z';
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" fill="none" aria-hidden="true">' +
      '<path d="' + area + '" fill="currentColor" opacity="0.14"/>' +
      '<path d="' + line + '" stroke="currentColor" stroke-width="' + (opts.stroke || 2) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  }

  function ring(percent, opts) {
    opts = opts || {};
    var size = opts.size || 92;
    var stroke = opts.stroke || 8;
    var r = (size - stroke) / 2;
    var c = 2 * Math.PI * r;
    var p = U.clamp(Number(percent) || 0, 0, 100);
    var off = c - (p / 100) * c;
    var color = opts.color || 'var(--accent)';
    var track = opts.track || 'var(--card-3)';
    var text = opts.text != null ? opts.text : Math.round(p) + '%';
    var label = opts.label ? '<div class="ring-label">' + U.esc(opts.label) + '</div>' : '';
    return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="' + U.esc(opts.ariaLabel || ('Прогресс ' + Math.round(p) + '%')) + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + track + '" stroke-width="' + stroke + '"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' +
      '<text x="' + size / 2 + '" y="' + (size / 2 + (opts.textSize || 7)) + '" text-anchor="middle" fill="' + (opts.textColor || 'currentColor') + '" font-size="' + (opts.textSize || 15) + '" font-weight="800" font-family="inherit">' + U.esc(text) + '</text>' +
      '</svg>' + label;
  }

  function line(values, opts) {
    opts = opts || {};
    var w = opts.width || 320, h = opts.height || 140;
    var padX = 10, padTop = 12, padBottom = 22;
    var vals = (values || []).map(function (v) { return Number(v) || 0; });
    if (vals.length < 2) vals = [0, vals[0] || 0];
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (min === max) { min = Math.max(0, min - 1000); max = max + 1000; }
    var range = max - min;
    var points = vals.map(function (v, i) {
      var x = padX + (i / (vals.length - 1)) * (w - padX * 2);
      var y = padTop + (1 - (v - min) / range) * (h - padTop - padBottom);
      return [x, y];
    });
    var path = points.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = path + ' L' + (w - padX) + ' ' + (h - padBottom) + ' L' + padX + ' ' + (h - padBottom) + ' Z';
    var gid = 'grad-' + (++uid);
    var grid = '';
    for (var i = 0; i < 3; i++) {
      var y = padTop + (i / 2) * (h - padTop - padBottom);
      grid += '<line x1="' + padX + '" y1="' + y.toFixed(1) + '" x2="' + (w - padX) + '" y2="' + y.toFixed(1) + '" stroke="var(--line)" stroke-width="1"/>';
    }
    var dots = points.map(function (p, i) {
      if (i !== points.length - 1) return '';
      return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4" fill="var(--accent)" stroke="var(--card)" stroke-width="2"/>';
    }).join('');
    var labels = '';
    if (opts.labels && opts.labels.length) {
      opts.labels.forEach(function (label, i) {
        var x = padX + (i / (opts.labels.length - 1)) * (w - padX * 2);
        labels += '<text x="' + x.toFixed(1) + '" y="' + (h - 6) + '" text-anchor="middle" fill="var(--text-3)" font-size="9" font-family="inherit">' + U.esc(label) + '</text>';
      });
    }
    return '<svg class="chart-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + U.esc(opts.ariaLabel || 'График динамики') + '">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity="0.28"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>' +
      grid + '<path d="' + area + '" fill="url(#' + gid + ')"/>' +
      '<path d="' + path + '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      dots + labels + '</svg>';
  }

  function donut(segments, opts) {
    opts = opts || {};
    var size = opts.size || 132;
    var stroke = opts.stroke || 16;
    var r = (size - stroke) / 2;
    var c = 2 * Math.PI * r;
    var total = (segments || []).reduce(function (s, x) { return s + (Number(x.value) || 0); }, 0);
    var html = '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="' + U.esc(opts.ariaLabel || 'Структура трат') + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--card-3)" stroke-width="' + stroke + '"/>';
    if (total > 0) {
      var offset = 0;
      (segments || []).forEach(function (seg) {
        var val = Number(seg.value) || 0;
        if (!val) return;
        var len = (val / total) * c;
        html += '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + U.esc(seg.color || 'var(--accent)') + '" stroke-width="' + stroke + '" stroke-dasharray="' + Math.max(0, len - 2).toFixed(1) + ' ' + (c - Math.max(0, len - 2)).toFixed(1) + '" stroke-dashoffset="' + (-offset).toFixed(1) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')" stroke-linecap="butt"/>';
        offset += len;
      });
    }
    var center = opts.center != null ? opts.center : (total ? U.money(total, opts.currency, { decimals: 0 }) : '0');
    html += '<text x="' + size / 2 + '" y="' + (size / 2 - 2) + '" text-anchor="middle" fill="var(--text)" font-size="12" font-weight="800" font-family="inherit">' + U.esc(center) + '</text>';
    if (opts.caption) html += '<text x="' + size / 2 + '" y="' + (size / 2 + 14) + '" text-anchor="middle" fill="var(--text-3)" font-size="9" font-family="inherit">' + U.esc(opts.caption) + '</text>';
    return html + '</svg>';
  }

  function bars(series, opts) {
    opts = opts || {};
    var w = opts.width || 320, h = opts.height || 150;
    var padX = 8, padTop = 12, padBottom = 24;
    var data = series || [];
    var max = 0;
    data.forEach(function (d) { max = Math.max(max, d.deposits || 0, d.withdrawals || 0); });
    max = max || 1;
    var groupW = (w - padX * 2) / Math.max(1, data.length);
    var barW = Math.max(4, Math.min(14, groupW * 0.26));
    var barsHtml = '';
    data.forEach(function (d, i) {
      var cx = padX + groupW * i + groupW / 2;
      var dh = ((d.deposits || 0) / max) * (h - padTop - padBottom);
      var wh = ((d.withdrawals || 0) / max) * (h - padTop - padBottom);
      barsHtml += '<rect x="' + (cx - barW - 1).toFixed(1) + '" y="' + (h - padBottom - dh).toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + Math.max(1, dh).toFixed(1) + '" rx="3" fill="var(--accent)"/>';
      barsHtml += '<rect x="' + (cx + 1).toFixed(1) + '" y="' + (h - padBottom - wh).toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + Math.max(1, wh).toFixed(1) + '" rx="3" fill="var(--card-3)"/>';
      barsHtml += '<text x="' + cx.toFixed(1) + '" y="' + (h - 6) + '" text-anchor="middle" fill="var(--text-3)" font-size="9" font-family="inherit">' + U.esc(d.label || '') + '</text>';
    });
    return '<svg class="chart-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + U.esc(opts.ariaLabel || 'Пополнения и снятия по месяцам') + '">' + barsHtml + '</svg>';
  }

  KP.charts = { sparkline: sparkline, ring: ring, line: line, donut: donut, bars: bars };
})(window.KP);
