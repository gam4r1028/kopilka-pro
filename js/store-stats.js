/* Расчёты: статистика, прогнозы, серии для графиков */
window.KP = window.KP || {};
(function (KP) {
  'use strict';
  var U = KP.utils;
  var store = KP.store;

  store.goalStats = function (goalId) {
    var g = store.goal(goalId);
    if (!g) return null;
    var saved = store.goalBalance(goalId);
    var target = Math.max(0, g.price || g.target || 0);
    var percent = target > 0 ? U.clamp((saved / target) * 100, 0, 100) : (saved > 0 ? 100 : 0);
    var remaining = Math.max(0, target - saved);
    var txs = store.goalTransactions(goalId);
    var first = new Date(g.createdAt).getTime();
    txs.forEach(function (t) { first = Math.min(first, new Date(t.date).getTime()); });
    var weeks = Math.max(1, (Date.now() - first) / (7 * 86400000));
    var incoming = 0;
    txs.forEach(function (t) {
      if (t.goalId === goalId && t.type === 'deposit') incoming += t.amount;
      if (t.type === 'transfer' && t.toGoalId === goalId) incoming += t.amount;
    });
    var avgWeek = incoming / weeks;
    var avgMonth = avgWeek * 4.345;
    var forecast = null;
    if (remaining <= 0) forecast = new Date();
    else if (avgWeek > 0) forecast = new Date(Date.now() + (remaining / avgWeek) * 7 * 86400000);
    var weeksToDeadline = null, perWeek = null, perMonth = null;
    if (g.deadline) {
      weeksToDeadline = Math.max(0, (new Date(g.deadline).getTime() - Date.now()) / (7 * 86400000));
      if (weeksToDeadline > 0) {
        perWeek = remaining / weeksToDeadline;
        perMonth = perWeek * 4.345;
      }
    }
    return {
      saved: saved, target: target, remaining: remaining, percent: percent,
      avgWeek: avgWeek, avgMonth: avgMonth, forecast: forecast,
      weeksToDeadline: weeksToDeadline, perWeek: perWeek, perMonth: perMonth,
      deposits: txs.filter(function (t) {
        return t.type === 'deposit' || (t.type === 'transfer' && t.toGoalId === goalId);
      }).length
    };
  };

  store.balanceAt = function (goalId, date) {
    var txs = store.get().transactions.filter(function (t) {
      return !t.deletedAt && new Date(t.date).getTime() <= date.getTime();
    });
    return store._calcBalance(txs, goalId);
  };

  store.goalSeries = function (goalId, points) {
    points = points || 8;
    var out = [];
    var end = U.startOfWeek(new Date());
    for (var i = points - 1; i >= 0; i--) {
      var d = U.addDays(end, -7 * i + 6);
      d.setHours(23, 59, 59, 999);
      out.push(store.balanceAt(goalId, d));
    }
    return out;
  };

  store.totalSeries = function (points) {
    points = points || 12;
    var out = [];
    var end = U.startOfWeek(new Date());
    var goals = store.allGoals();
    for (var i = points - 1; i >= 0; i--) {
      var d = U.addDays(end, -7 * i + 6);
      d.setHours(23, 59, 59, 999);
      var sum = 0;
      goals.forEach(function (g) { sum += store.balanceAt(g.id, d); });
      out.push(sum);
    }
    return out;
  };

  store.monthChange = function () {
    var start = U.startOfMonth(new Date()).getTime();
    var change = 0;
    store._aliveTx().forEach(function (t) {
      if (new Date(t.date).getTime() < start) return;
      if (t.type === 'deposit') change += t.amount;
      if (t.type === 'withdraw') change -= t.amount;
    });
    return change;
  };

  store.monthTotals = function () {
    var start = U.startOfMonth(new Date()).getTime();
    var dep = 0, wd = 0;
    store._aliveTx().forEach(function (t) {
      if (new Date(t.date).getTime() < start) return;
      if (t.type === 'deposit') dep += t.amount;
      if (t.type === 'withdraw') wd += t.amount;
    });
    return { deposits: dep, withdrawals: wd };
  };

  store.streak = function () {
    var days = {};
    store._aliveTx().forEach(function (t) {
      if (t.type === 'deposit') days[U.dayKey(t.date)] = true;
    });
    var d = new Date();
    var today = !!days[U.dayKey(d)];
    if (!today) d = U.addDays(d, -1);
    var count = 0;
    while (days[U.dayKey(d)] && count < 10000) {
      count++;
      d = U.addDays(d, -1);
    }
    return { days: count, today: today };
  };

  store.weekDeposits = function () {
    var since = Date.now() - 7 * 86400000;
    var sum = 0;
    store._aliveTx().forEach(function (t) {
      if (t.type === 'deposit' && new Date(t.date).getTime() >= since) sum += t.amount;
    });
    return sum;
  };

  store.monthlySeries = function (months) {
    months = months || 6;
    var out = [];
    var now = new Date();
    for (var i = months - 1; i >= 0; i--) {
      var start = new Date(now.getFullYear(), now.getMonth() - i, 1).getTime();
      var end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();
      var dep = 0, wd = 0;
      store._aliveTx().forEach(function (t) {
        var ts = new Date(t.date).getTime();
        if (ts < start || ts >= end) return;
        if (t.type === 'deposit') dep += t.amount;
        if (t.type === 'withdraw') wd += t.amount;
      });
      var d = new Date(start);
      out.push({ label: U.MONTHS_SHORT[d.getMonth()], deposits: dep, withdrawals: wd });
    }
    return out;
  };

  store.categorySpending = function (days) {
    days = days || 30;
    var since = Date.now() - days * 86400000;
    var map = {};
    store._aliveTx().forEach(function (t) {
      if (t.type !== 'withdraw' || new Date(t.date).getTime() < since) return;
      var c = t.categoryId || 'other';
      map[c] = (map[c] || 0) + t.amount;
    });
    return Object.keys(map).map(function (id) {
      return { category: store.category(id), amount: map[id] };
    }).sort(function (a, b) { return b.amount - a.amount; });
  };

  store.savingsRate = function (days) {
    days = days || 30;
    var since = Date.now() - days * 86400000;
    var dep = 0, wd = 0;
    store._aliveTx().forEach(function (t) {
      if (new Date(t.date).getTime() < since) return;
      if (t.type === 'deposit') dep += t.amount;
      if (t.type === 'withdraw') wd += t.amount;
    });
    if (!dep) return 0;
    return ((dep - wd) / dep) * 100;
  };
})(window.KP);
