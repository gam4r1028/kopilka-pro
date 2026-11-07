/* Аналитика: динамика, категории, сравнение целей, инсайты */
window.KP = window.KP || {};
KP.screens = KP.screens || {};
(function (KP) {
  'use strict';
  var U = KP.utils;
  var ui = KP.ui;
  var store = KP.store;
  var charts = KP.charts;
  var common = KP.screens.common;

  /* Безопасный цвет: только hex или CSS-переменная из темы */
  function safeColor(value) {
    var c = String(value || '');
    if (/^#[0-9a-f]{3,8}$/i.test(c)) return c;
    if (/^var\(--[a-z0-9-]+\)$/i.test(c)) return c;
    return 'var(--card-3)';
  }

  function render() {
    var screen = document.createElement('div');
    screen.className = 'screen analytics';
    var total = store.total();
    var month = store.monthTotals();
    var rate = store.savingsRate(30);
    var monthly = store.monthlySeries(6);
    var cats = store.categorySpending(30);
    var goals = store.activeGoals();
    var txCount = store.transactions().length;

    screen.appendChild(common.head('Аналитика', { subtitle: 'Ваши деньги в цифрах' }));

    if (!txCount && !goals.length) {
      screen.appendChild(ui.empty({
        title: 'Данных пока нет',
        text: 'Добавьте первую операцию или цель — аналитика появится автоматически.',
        actionLabel: 'Пополнить',
        onAction: function () { KP.screens.operations.open({ type: 'deposit' }); }
      }));
      return screen;
    }

    var summary = document.createElement('div');
    summary.className = 'analytics-grid';
    summary.innerHTML =
      common.statCard('Всего накоплено', common.money(total, { decimals: 0 })) +
      common.statCard('Пополнения за месяц', common.money(month.deposits, { decimals: 0 }), 'good') +
      common.statCard('Снятия за месяц', common.money(month.withdrawals, { decimals: 0 }), month.withdrawals ? 'bad' : '') +
      common.statCard('Норма сбережений', rate.toFixed(0) + '%', rate >= 0 ? 'good' : 'bad');
    screen.appendChild(summary);

    var balanceCard = document.createElement('section');
    balanceCard.className = 'card chart-card';
    balanceCard.innerHTML =
      '<div class="between"><div><h3>Динамика баланса</h3><div class="chart-sub">Последние 12 недель</div></div>' +
      '<span class="pill accent">' + U.esc(common.money(total, { decimals: 0 })) + '</span></div>' +
      charts.line(store.totalSeries(12), { width: 320, height: 150, ariaLabel: 'Динамика общего баланса' });
    screen.appendChild(balanceCard);

    var barsCard = document.createElement('section');
    barsCard.className = 'card chart-card';
    barsCard.innerHTML =
      '<h3>Пополнения и снятия</h3><div class="chart-sub">По месяцам</div>' +
      charts.bars(monthly, { width: 320, height: 160 }) +
      '<div class="legend" style="flex-direction:row;gap:16px;margin-top:10px">' +
      '<span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Пополнения</span>' +
      '<span class="legend-item"><span class="legend-dot" style="background:var(--card-3)"></span>Снятия</span></div>';
    screen.appendChild(barsCard);

    var catCard = document.createElement('section');
    catCard.className = 'card chart-card';
    var top = cats.slice(0, 4);
    var rest = cats.slice(4).reduce(function (s, x) { return s + x.amount; }, 0);
    var segments = top.map(function (x) { return { value: x.amount, color: safeColor(x.category.color), label: x.category.name }; });
    if (rest > 0) segments.push({ value: rest, color: 'var(--card-3)', label: 'Остальное' });
    var catTotal = cats.reduce(function (s, x) { return s + x.amount; }, 0);
    var legend = '';
    (segments.length ? segments : [{ value: 0, color: 'var(--card-3)', label: 'Пока нет трат' }]).forEach(function (s) {
      legend += '<div class="legend-item"><span class="legend-dot" style="background:' + safeColor(s.color) + '"></span>' +
        '<span class="legend-name">' + U.esc(s.label) + '</span>' +
        '<span class="legend-value">' + U.esc(common.money(s.value, { decimals: 0 })) + '</span></div>';
    });
    catCard.innerHTML =
      '<h3>Категории трат</h3><div class="chart-sub">За последние 30 дней</div>' +
      '<div class="donut-wrap">' +
      charts.donut(segments, {
        size: 126, stroke: 15, currency: store.settings().currency,
        center: catTotal ? common.money(catTotal, { decimals: 0 }) : '0',
        caption: 'траты', ariaLabel: 'Структура трат по категориям'
      }) +
      '<div class="legend grow">' + legend + '</div></div>';
    screen.appendChild(catCard);

    var compareCard = document.createElement('section');
    compareCard.className = 'card chart-card';
    compareCard.innerHTML = '<h3>Сравнение целей</h3><div class="chart-sub">Прогресс по активным целям</div><div class="compare-list"></div>';
    var compareList = compareCard.querySelector('.compare-list');
    if (!goals.length) {
      compareList.innerHTML = '<p class="caption">Активных целей пока нет.</p>';
    } else {
      goals.map(function (g) { return { goal: g, stats: store.goalStats(g.id) }; })
        .sort(function (a, b) { return b.stats.percent - a.stats.percent; })
        .slice(0, 8)
        .forEach(function (item) {
          var row = document.createElement('div');
          row.className = 'compare-row';
          row.innerHTML = '<div class="compare-head"><span>' + U.esc(item.goal.emoji + ' ' + item.goal.title) + '</span>' +
            '<b>' + Math.round(item.stats.percent) + '%</b></div>' +
            '<div class="progress"><div class="progress-fill" style="width:' + item.stats.percent.toFixed(1) + '%"></div></div>';
          compareList.appendChild(row);
        });
    }
    screen.appendChild(compareCard);

    var insight = document.createElement('div');
    insight.className = 'insight';
    var insightText = '';
    if (cats.length) {
      insightText += 'Больше всего за 30 дней ушло на «' + cats[0].category.name + '» — ' + common.money(cats[0].amount, { decimals: 0 }) + '. ';
    } else {
      insightText += 'Снятий за последние 30 дней не было — отличный темп. ';
    }
    var best = goals.map(function (g) { return { goal: g, stats: store.goalStats(g.id) }; })
      .sort(function (a, b) { return b.stats.percent - a.stats.percent; })[0];
    if (best) insightText += 'Ближе всех к цели «' + best.goal.title + '»: ' + Math.round(best.stats.percent) + '%.';
    insight.innerHTML = ui.icon('sparkles', 22) + '<span>' + U.esc(insightText) + '</span>';
    screen.appendChild(insight);

    return screen;
  }

  KP.screens.analytics = { render: render };
})(window.KP);
