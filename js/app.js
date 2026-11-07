/* Точка входа: маршруты, панель навигации, тема, восстановление, selfTest */
window.KP = window.KP || {};
(function (KP) {
  'use strict';
  var U = KP.utils;
  var ui = KP.ui;
  var store = KP.store;
  var router = KP.router;
  var screens = KP.screens;

  var TABS = [
    { id: 'home', label: 'Главная', icon: 'home', path: '/home' },
    { id: 'goals', label: 'Цели', icon: 'target', path: '/goals' },
    { id: 'history', label: 'История', icon: 'history', path: '/history' },
    { id: 'analytics', label: 'Аналитика', icon: 'chart', path: '/analytics' },
    { id: 'more', label: 'Ещё', icon: 'more', path: '/more' }
  ];

  function buildTabbar() {
    var nav = document.getElementById('tabbar');
    nav.innerHTML = TABS.map(function (t) {
      return '<button type="button" class="tab" data-tab="' + t.id + '" data-path="' + t.path + '" aria-label="' + t.label + '">' +
        ui.icon(t.icon, 23) + '<span>' + t.label + '</span></button>';
    }).join('');
    nav.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]');
      if (!b) return;
      U.haptic(6);
      router.go(b.dataset.path);
    });
  }

  function updateTabs(path) {
    var nav = document.getElementById('tabbar');
    if (!nav) return;
    var active = 'home';
    if (path.indexOf('/goals') === 0 || path.indexOf('/goal/') === 0) active = 'goals';
    else if (path.indexOf('/history') === 0) active = 'history';
    else if (path.indexOf('/analytics') === 0) active = 'analytics';
    else if (path.indexOf('/more') === 0) active = 'more';
    nav.querySelectorAll('.tab').forEach(function (b) {
      var on = b.dataset.tab === active;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  }

  function registerRoutes() {
    router.add('/home', function () { return screens.home.render(); }, 'Главная');
    router.add('/goals', function () { return screens.goals.render(); }, 'Цели');
    router.add('/goal/:id', function (p) { return screens.goalDetail.render(p.id); }, 'Цель');
    router.add('/history', function () { return screens.history.render(); }, 'История');
    router.add('/analytics', function () { return screens.analytics.render(); }, 'Аналитика');
    router.add('/more', function () { return screens.more.render(); }, 'Ещё');
    router.notFound(function () { return screens.home.render(); });
    router.setTabUpdater(updateTabs);
  }

  function showRecovery() {
    var info = store.corruptInfo();
    if (!info) return;
    var content = document.createElement('div');
    content.innerHTML =
      '<p class="confirm-text">Не удалось прочитать сохранённые данные: ' + U.esc(info.error) + '. Мы не стали их перезаписывать.</p>' +
      '<div class="action-list" style="margin-top:12px">' +
      '<button type="button" class="action-item" data-act="download">' + ui.icon('download') + 'Скачать повреждённые данные</button>' +
      (store.hasBackup() ? '<button type="button" class="action-item" data-act="backup">' + ui.icon('repeat') + 'Восстановить из резервной копии</button>' : '') +
      '<button type="button" class="action-item danger" data-act="reset">' + ui.icon('trash') + 'Начать заново</button>' +
      '</div>';
    var s = ui.sheet({
      title: 'Данные повреждены',
      content: content,
      dismissible: false,
      showClose: false
    });
    content.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var a = b.dataset.act;
      if (a === 'download') {
        U.download('kopilka-corrupt-' + U.dateInput(new Date()) + '.json', info.raw, 'application/json');
      } else if (a === 'backup') {
        var ok = store.recoverBackup();
        if (ok) {
          s.close();
          ui.snackbar({ text: 'Данные восстановлены из копии' });
          router.refresh();
          if (!store.settings().onboardingDone) screens.onboarding.show();
        } else {
          ui.snackbar({ text: 'Резервная копия тоже повреждена' });
        }
      } else if (a === 'reset') {
        ui.confirm({
          title: 'Начать заново?',
          text: 'Повреждённые данные будут удалены. Если нужно, сначала скачайте их.',
          confirmText: 'Начать заново',
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          store.discardCorrupt();
          s.close();
          router.go('/home');
          router.refresh();
          screens.onboarding.show();
        });
      }
    });
  }

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function () { /* офлайн-режим недоступен */ });
    });
  }

  function init() {
    ui.init();
    store.init();
    ui.applyTheme(store.settings());
    buildTabbar();
    registerRoutes();
    router.start();

    store.subscribe(function () {
      ui.applyTheme(store.settings());
      router.refresh();
      updateTabs(router.current().path);
    });

    if (store.corruptInfo()) showRecovery();
    else if (!store.settings().onboardingDone) screens.onboarding.show();

    try {
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
    } catch (e) { /* хранилище недоступно */ }

    window.addEventListener('beforeunload', function () { store.save(); });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') store.save();
    });
    registerSW();
  }

  KP.selfTest = function () {
    var results = [];
    function check(name, fn) {
      try {
        var ok = fn();
        results.push({ 'Проверка': name, 'Результат': ok ? 'OK' : 'FAIL' });
      } catch (e) {
        results.push({ 'Проверка': name, 'Результат': 'ERROR: ' + (e.message || e) });
      }
    }
    check('toMinor «1 234,56»', function () { return U.toMinor('1 234,56') === 123456; });
    check('toMinor «100»', function () { return U.toMinor('100') === 10000; });
    check('Формат денег', function () {
      return U.money(123456, 'RUB').replace(/\u00a0/g, ' ').indexOf('1 234,56') >= 0;
    });
    check('Баланс: пополнение и снятие', function () {
      return store._calcBalance([
        { type: 'deposit', goalId: 'a', amount: 10000 },
        { type: 'withdraw', goalId: 'a', amount: 3000 }
      ], 'a') === 7000;
    });
    check('Баланс: перевод', function () {
      var txs = [{ type: 'transfer', goalId: 'a', toGoalId: 'b', amount: 2000 }];
      return store._calcBalance(txs, 'a') === -2000 && store._calcBalance(txs, 'b') === 2000;
    });
    check('Миграция v1 → v3', function () {
      var s = {
        schemaVersion: 1, settings: {},
        goals: [{ target: 100 }],
        transactions: [{ amount: 50 }]
      };
      store._migrate(s);
      return s.schemaVersion === 3 && s.goals[0].target === 10000 && s.transactions[0].amount === 5000;
    });
    check('Прогноз: недели до цели', function () { return store._weeksToGoal(100000, 5000) === 20; });
    check('Формат даты', function () { return U.formatDate('2026-11-07T12:00:00', 'dd.mm.yyyy') === '07.11.2026'; });
    check('Процент', function () { return U.percent(50, 200) === 25; });
    try { console.table(results); } catch (e) { console.log(results); }
    var failed = results.filter(function (r) { return r['Результат'] !== 'OK'; });
    console.log(failed.length ? '❌ Копилка Pro: есть ошибки' : '✅ Копилка Pro: все проверки пройдены');
    return failed.length === 0;
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.KP);
