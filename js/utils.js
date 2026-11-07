/* Утилиты: деньги, даты, строки, анимации */
window.KP = window.KP || {};
(function (KP) {
  'use strict';
  var U = {};

  /* Валюты */
  U.CURRENCIES = {
    RUB: { code: 'RUB', symbol: '₽', name: 'Российский рубль' },
    USD: { code: 'USD', symbol: '$', name: 'Доллар США' },
    EUR: { code: 'EUR', symbol: '€', name: 'Евро' },
    KZT: { code: 'KZT', symbol: '₸', name: 'Казахстанский тенге' },
    BYN: { code: 'BYN', symbol: 'Br', name: 'Белорусский рубль' },
    UAH: { code: 'UAH', symbol: '₴', name: 'Украинская гривна' },
    GEL: { code: 'GEL', symbol: '₾', name: 'Грузинский лари' }
  };
  U.currency = function (code) { return U.CURRENCIES[code] || U.CURRENCIES.RUB; };

  /* Градиенты обложек целей */
  U.GRADIENTS = ['sunset', 'ocean', 'violet', 'lime', 'rose', 'midnight', 'gold', 'sky'];

  /* Эмодзи для выбора */
  U.EMOJIS = ['🎯', '🏖️', '💻', '🚗', '🏠', '🎓', '💍', '🎁', '✈️', '📱', '🎸', '🚲',
    '🛡️', '🏋️', '🐶', '🍼', '🌱', '🎨', '⌚', '🎮', '📷', '🧳', '🏔️', '💎'];

  /* Идентификаторы */
  U.uid = function () {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    } catch (e) { /* игнорируем */ }
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  };

  /* Базовое */
  U.clamp = function (n, min, max) { return Math.min(max, Math.max(min, n)); };

  U.debounce = function (fn, wait) {
    var t = null;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait || 200);
    };
  };

  U.esc = function (value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  U.plural = function (n, forms) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  };

  U.prefersReduced = function () {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  };

  U.haptic = function (pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern || 8); } catch (e) { /* нет вибро */ }
  };

  /* Деньги: суммы храним в минимальных единицах (копейки) */
  U.money = function (minor, code, opts) {
    opts = opts || {};
    var n = Math.round(Number(minor) || 0);
    var abs = Math.abs(n);
    var hasFraction = abs % 100 !== 0;
    var dec = opts.decimals != null ? opts.decimals : (hasFraction ? 2 : 0);
    var value = abs / 100;
    var num;
    try {
      num = new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec
      }).format(value);
    } catch (e) {
      num = value.toFixed(dec).replace('.', ',');
    }
    var sign = n < 0 ? '−' : (opts.sign && n > 0 ? '+' : '');
    var suffix = opts.symbol === false ? '' : ' ' + U.currency(code).symbol;
    return sign + num + suffix;
  };

  U.number = function (value, dec) {
    try {
      return new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: dec || 0,
        maximumFractionDigits: dec || 0
      }).format(Number(value) || 0);
    } catch (e) { return String(value); }
  };

  /* Парсит "1 234,56" или "1234.56" в копейки */
  U.toMinor = function (input) {
    if (typeof input === 'number') return Math.round(input * 100);
    if (input == null) return 0;
    var s = String(input).trim().replace(/\s+/g, '')
      .replace(/[₽$€₸₴₾]/g, '').replace(/[^\d,.\-]/g, '');
    if (!s) return 0;
    s = s.replace(',', '.');
    var neg = s.charAt(0) === '-';
    s = s.replace(/-/g, '');
    var parts = s.split('.');
    var rub = parseInt(parts[0] || '0', 10) || 0;
    var kopRaw = parts[1] ? (parts[1] + '00').slice(0, 2) : '00';
    var total = rub * 100 + (parseInt(kopRaw, 10) || 0);
    return neg ? -total : total;
  };

  U.minorToInput = function (minor) {
    var v = (Math.round(Number(minor) || 0) / 100).toFixed(2);
    if (v.slice(-3) === '.00') v = v.slice(0, -3);
    return v.replace('.', ',');
  };

  /* Даты */
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var MONTHS_NOM = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  var MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  var WEEKDAYS = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
  var WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  U.MONTHS = MONTHS;
  U.MONTHS_NOM = MONTHS_NOM;
  U.MONTHS_SHORT = MONTHS_SHORT;
  U.WEEKDAYS = WEEKDAYS;
  U.WEEKDAYS_SHORT = WEEKDAYS_SHORT;

  U.date = function (value) {
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };
  U.nowISO = function () { return new Date().toISOString(); };
  U.pad = function (n) { return (n < 10 ? '0' : '') + n; };
  U.dayKey = function (value) {
    var d = U.date(value);
    if (!d) return '';
    return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate());
  };
  U.monthKey = function (value) {
    var d = U.date(value);
    if (!d) return '';
    return d.getFullYear() + '-' + U.pad(d.getMonth() + 1);
  };
  U.startOfDay = function (value) {
    var d = U.date(value) || new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };
  U.startOfMonth = function (value) {
    var d = U.date(value) || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  };
  U.startOfWeek = function (value) {
    var d = U.startOfDay(value);
    var day = (d.getDay() + 6) % 7;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  };
  U.addDays = function (value, days) {
    var d = U.date(value) || new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, d.getHours(), d.getMinutes());
  };
  U.addMonths = function (value, months) {
    var d = U.date(value) || new Date();
    var day = d.getDate();
    var res = new Date(d.getFullYear(), d.getMonth() + months, 1, d.getHours(), d.getMinutes());
    var last = new Date(res.getFullYear(), res.getMonth() + 1, 0).getDate();
    res.setDate(Math.min(day, last));
    return res;
  };
  U.daysBetween = function (a, b) {
    var da = U.startOfDay(a), db = U.startOfDay(b);
    return Math.round((db - da) / 86400000);
  };
  U.formatDate = function (value, format) {
    var d = U.date(value);
    if (!d) return '';
    var fmt = format || 'dd.mm.yyyy';
    return fmt.replace(/yyyy|yy|MMMM|MM|mm|dd|d|HH|ii|nn/g, function (token) {
      if (token === 'yyyy') return String(d.getFullYear());
      if (token === 'yy') return String(d.getFullYear()).slice(2);
      if (token === 'MMMM') return MONTHS[d.getMonth()];
      if (token === 'MM' || token === 'mm') return U.pad(d.getMonth() + 1);
      if (token === 'dd') return U.pad(d.getDate());
      if (token === 'd') return String(d.getDate());
      if (token === 'HH') return U.pad(d.getHours());
      if (token === 'ii' || token === 'nn') return U.pad(d.getMinutes());
      return token;
    });
  };
  U.time = function (value) {
    var d = U.date(value);
    if (!d) return '';
    return U.pad(d.getHours()) + ':' + U.pad(d.getMinutes());
  };
  U.relativeDay = function (value) {
    var d = U.date(value);
    if (!d) return '';
    var diff = U.daysBetween(d, new Date());
    if (diff === 0) return 'Сегодня';
    if (diff === 1) return 'Вчера';
    var sameYear = d.getFullYear() === new Date().getFullYear();
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + (sameYear ? '' : ' ' + d.getFullYear());
  };
  U.monthLabel = function (value) {
    var d = U.date(value) || new Date();
    return MONTHS_NOM[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '');
  };
  U.datetimeLocal = function (value) {
    var d = U.date(value) || new Date();
    return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate()) +
      'T' + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes());
  };
  U.fromDatetimeLocal = function (value) {
    if (!value) return null;
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };
  U.dateInput = function (value) {
    var d = U.date(value);
    return d ? d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate()) : '';
  };

  /* Плавный счётчик */
  U.countUp = function (el, from, to, duration, render) {
    if (!el) return;
    var reduce = U.prefersReduced();
    if (reduce) { el.textContent = render(to); return; }
    var start = null;
    function frame(t) {
      if (start == null) start = t;
      var p = Math.min(1, (t - start) / (duration || 700));
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = render(Math.round(from + (to - from) * eased));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  /* Файлы */
  U.download = function (filename, content, mime) {
    try {
      var blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'application/octet-stream' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      return true;
    } catch (e) { return false; }
  };

  U.readFile = function (file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(reader.error || new Error('Не удалось прочитать файл')); };
      reader.readAsText(file);
    });
  };

  U.percent = function (part, total) {
    if (!total) return 0;
    return U.clamp((part / total) * 100, 0, 100);
  };

  KP.utils = U;
})(window.KP);
