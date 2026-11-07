/* Демонстрационные данные */
window.KP = window.KP || {};
(function (KP) {
  'use strict';
  var U = KP.utils;
  var store = KP.store;

  store.seedDemo = function () {
    var now = new Date();
    function iso(daysAgo, hour, minute) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hour || 12, minute || 0).toISOString();
    }
    var demo = store._defaultState();
    demo.settings.name = 'Алексей';
    demo.settings.onboardingDone = true;
    demo.settings.currency = 'RUB';
    demo.settings.theme = 'dark';
    demo.settings.accent = 'yellow';
    demo.meta.demo = true;

    var defs = [
      { title: 'Отпуск на море', emoji: '🏖️', gradient: 'sunset', target: 18000000, deadline: U.addMonths(now, 5).toISOString(), priority: 'high', pinned: true, createdAt: iso(120, 10) },
      { title: 'Новый ноутбук', emoji: '💻', gradient: 'ocean', target: 12000000, deadline: U.addMonths(now, 3).toISOString(), priority: 'medium', createdAt: iso(95, 11) },
      { title: 'Подушка безопасности', emoji: '🛡️', gradient: 'violet', target: 30000000, deadline: null, priority: 'high', createdAt: iso(200, 9) },
      { title: 'Подарок маме', emoji: '🎁', gradient: 'rose', target: 3000000, deadline: U.addMonths(now, 1).toISOString(), priority: 'medium', createdAt: iso(40, 14) }
    ];
    demo.goals = defs.map(function (g, i) {
      return Object.assign({
        id: 'demo-goal-' + (i + 1), milestones: [], archived: false, frozen: false,
        note: '', link: '', price: null, completedAt: null, deletedAt: null,
        deletedTxIds: [], order: i
      }, g);
    });

    var txs = [];
    function add(goalIndex, type, rub, daysAgo, hour, categoryId, note, toIndex) {
      txs.push({
        id: 'demo-tx-' + txs.length, type: type,
        goalId: demo.goals[goalIndex].id,
        toGoalId: toIndex != null ? demo.goals[toIndex].id : null,
        amount: Math.round(rub * 100), categoryId: categoryId || null,
        tags: [], note: note || '', date: iso(daysAgo, hour, 30),
        createdAt: iso(daysAgo, hour, 30), deletedAt: null
      });
    }

    add(0, 'deposit', 12000, 100, 10, null, 'Первая сумма');
    add(0, 'deposit', 10000, 80, 19, null, '');
    add(0, 'deposit', 15000, 55, 12, null, 'Премия');
    add(0, 'deposit', 8000, 30, 18, null, '');
    add(0, 'withdraw', 5000, 20, 21, 'fun', 'Кино и ужин');
    add(0, 'deposit', 12000, 12, 11, null, '');
    add(0, 'deposit', 7000, 4, 9, null, '');

    add(1, 'deposit', 15000, 90, 10, null, '');
    add(1, 'deposit', 10000, 65, 20, null, '');
    add(1, 'deposit', 8000, 40, 15, null, '');
    add(1, 'withdraw', 3000, 25, 13, 'shopping', 'Аксессуары');
    add(1, 'deposit', 12000, 18, 12, null, '');
    add(1, 'deposit', 5000, 6, 17, null, '');

    add(2, 'deposit', 20000, 190, 9, null, '');
    add(2, 'deposit', 15000, 150, 11, null, '');
    add(2, 'deposit', 20000, 110, 10, null, '');
    add(2, 'deposit', 10000, 70, 16, null, '');
    add(2, 'deposit', 15000, 35, 14, null, '');
    add(2, 'deposit', 10000, 10, 12, null, '');

    add(3, 'deposit', 3000, 35, 18, null, '');
    add(3, 'deposit', 2000, 20, 19, null, '');
    add(3, 'deposit', 3000, 7, 13, null, '');
    add(3, 'deposit', 500, 4, 20, null, 'Каждый день по чуть-чуть');
    add(3, 'deposit', 500, 3, 20, null, '');
    add(3, 'deposit', 500, 2, 20, null, '');
    add(3, 'deposit', 500, 1, 20, null, '');
    add(3, 'deposit', 500, 0, 9, null, 'Утренний перевод');

    add(2, 'transfer', 10000, 15, 12, null, 'Перекинул на отпуск', 0);

    demo.transactions = txs;
    store.importJSON(JSON.stringify(demo));
    return store.get();
  };
})(window.KP);
