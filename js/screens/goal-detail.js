/* Экран цели: карточка, кольцо, прогноз, график, операции */
window.KP = window.KP || {};
KP.screens = KP.screens || {};
(function (KP) {
  'use strict';
  var U = KP.utils;
  var ui = KP.ui;
  var store = KP.store;
  var charts = KP.charts;
  var common = KP.screens.common;

  function safeUrl(url) {
    var s = String(url || '').trim();
    return /^https?:\/\//i.test(s) ? s : '';
  }

  function render(id) {
    var goal = store.goal(id);
    var screen = document.createElement('div');
    screen.className = 'screen goal-detail';

    if (!goal) {
      screen.appendChild(common.head('Цель', { back: true }));
      screen.appendChild(ui.empty({
        title: 'Цель не найдена',
        text: 'Возможно, она была удалена.',
        actionLabel: 'К списку целей',
        onAction: function () { KP.router.go('/goals'); }
      }));
      return screen;
    }

    var stats = store.goalStats(goal.id);
    var settings = store.settings();
    var deadlineText = goal.deadline ? U.formatDate(goal.deadline, 'd MMMM yyyy') : 'Без срока';
    var forecastText = stats.remaining <= 0 ? 'Цель достигнута' : stats.forecast ? U.formatDate(stats.forecast, 'd MMMM yyyy') : 'Мало данных';
    var speedText = stats.avgWeek > 0 ? common.money(stats.avgWeek, { decimals: 0 }) + '/нед' : '—';
    var needText = stats.perWeek != null ? common.money(stats.perWeek, { decimals: 0 }) + '/нед' : '—';
    var tx = store.goalTransactions(goal.id, 10);

    screen.appendChild(common.head('Цель', {
      back: true,
      subtitle: goal.title,
      actions: '<button type="button" class="icon-btn" data-act="menu" aria-label="Действия с целью">' + ui.icon('dots') + '</button>'
    }));

    var hero = document.createElement('section');
    hero.className = 'goal-hero grad-' + U.esc(goal.gradient);
    hero.innerHTML =
      '<div class="goal-hero-top"><span class="goal-emoji">' + U.esc(goal.emoji) + '</span>' +
      '<div class="row" style="gap:6px">' + (goal.pinned ? '<span class="pill" style="background:rgba(255,255,255,.18);color:#fff">' + ui.icon('pin', 14) + ' Закреплена</span>' : '') +
      (goal.archived ? '<span class="pill" style="background:rgba(0,0,0,.2);color:#fff">В архиве</span>' : '') +
      (goal.frozen ? '<span class="pill" style="background:rgba(0,0,0,.2);color:#fff">Заморожена</span>' : '') +
      (goal.completedAt ? '<span class="pill" style="background:rgba(0,0,0,.2);color:#fff">Куплено!</span>' : '') + '</div></div>' +
      '<h1>' + U.esc(goal.title) + '</h1>' +
      '<div class="goal-hero-sub">' + U.esc(deadlineText) + ' · ' + U.esc(goal.priority === 'high' ? 'высокий приоритет' : goal.priority === 'low' ? 'низкий приоритет' : 'средний приоритет') + '</div>' +
      '<div class="goal-hero-main"><div><div class="goal-hero-saved">' + U.esc(common.money(stats.saved, { decimals: 0 })) + '</div>' +
      '<div class="goal-hero-target">из ' + U.esc(common.money(stats.target, { decimals: 0 })) + '</div></div>' +
      '<div class="goal-hero-ring">' + charts.ring(stats.percent, {
        size: 92, stroke: 8, text: Math.round(stats.percent) + '%', textColor: '#fff',
        track: 'rgba(255,255,255,.24)', color: '#fff', ariaLabel: 'Прогресс цели ' + Math.round(stats.percent) + '%'
      }) + '</div></div>' +
      '<div class="progress"><div class="progress-fill" style="width:' + stats.percent.toFixed(1) + '%"></div></div>';
    screen.appendChild(hero);

    var actions = document.createElement('div');
    actions.className = 'goal-actions';
    actions.innerHTML =
      '<button type="button" class="btn btn-primary btn-sm" data-act="deposit">' + ui.icon('plus', 18) + 'Пополнить</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-act="withdraw">' + ui.icon('minus', 18) + 'Снять</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-act="transfer">' + ui.icon('transfer', 18) + 'Перевод</button>';
    screen.appendChild(actions);

    var statsGrid = document.createElement('div');
    statsGrid.className = 'detail-stats';
    statsGrid.innerHTML =
      common.statCard('Осталось накопить', common.money(stats.remaining, { decimals: 0 })) +
      common.statCard('Средняя скорость', speedText) +
      common.statCard('Прогноз достижения', forecastText) +
      common.statCard('Нужно до дедлайна', needText);
    screen.appendChild(statsGrid);

    var milestones = Array.isArray(goal.milestones) ? goal.milestones : [];
    var milestoneSection = document.createElement('section');
    milestoneSection.className = 'section goal-milestones';
    milestoneSection.innerHTML = '<div class="section-head"><h2>Вехи</h2><button type="button" class="link" data-act="milestone-add">Добавить</button></div>';
    if (milestones.length) {
      var milestoneList = document.createElement('div');
      milestoneList.className = 'milestone-list';
      milestones.forEach(function (milestone, index) {
        var item = document.createElement('label');
        item.className = 'milestone-item' + (milestone.done ? ' is-done' : '');
        item.innerHTML = '<input type="checkbox" data-milestone="' + index + '"' + (milestone.done ? ' checked' : '') + '><span class="grow">' + U.esc(milestone.title) + '</span>' + (milestone.amount ? '<span class="caption">' + U.esc(common.money(milestone.amount, { decimals: 0 })) + '</span>' : '');
        milestoneList.appendChild(item);
      });
      milestoneSection.appendChild(milestoneList);
    } else {
      milestoneSection.appendChild(document.createTextNode('Отмечайте промежуточные достижения на пути к цели.'));
    }
    screen.appendChild(milestoneSection);

    var chartCard = document.createElement('section');
    chartCard.className = 'card detail-chart';
    chartCard.innerHTML =
      '<div class="chart-head"><div><h3>Динамика</h3><div class="caption">Накопления за последние 12 недель</div></div>' +
      '<span class="pill">' + Math.round(stats.percent) + '%</span></div>' +
      charts.line(store.goalSeries(goal.id, 12), { width: 320, height: 150, ariaLabel: 'Динамика накоплений по цели' });
    screen.appendChild(chartCard);

    if (goal.note || goal.link) {
      var note = document.createElement('div');
      note.className = 'detail-note';
      var noteHtml = '';
      if (goal.price) noteHtml += '<div><strong>Цена товара:</strong> ' + U.esc(common.money(goal.price, { decimals: 0 })) + '</div>';
      if (goal.note) noteHtml += '<div' + (goal.price ? ' style="margin-top:8px"' : '') + '>' + U.esc(goal.note) + '</div>';
      var url = safeUrl(goal.link);
      if (url) noteHtml += '<div style="margin-top:8px"><a class="link" href="' + U.esc(url) + '" target="_blank" rel="noopener noreferrer">' + ui.icon('link', 16) + ' Ссылка на товар</a></div>';
      note.innerHTML = noteHtml;
      screen.appendChild(note);
    }

    var txSection = document.createElement('section');
    txSection.className = 'goal-tx';
    txSection.innerHTML = '<div class="section-head"><h2>Операции цели</h2>' +
      (tx.length ? '<button type="button" class="link" data-nav="/history">Вся история</button>' : '') + '</div>';
    if (tx.length) {
      var list = document.createElement('div');
      list.className = 'list';
      tx.forEach(function (t) { list.appendChild(common.txRow(t)); });
      txSection.appendChild(list);
    } else {
      txSection.appendChild(ui.empty({
        title: 'Операций пока нет',
        text: 'Пополните цель, чтобы увидеть прогресс и прогноз.',
        actionLabel: 'Пополнить',
        onAction: function () { KP.screens.operations.open({ type: 'deposit', goalId: goal.id }); }
      }));
    }
    screen.appendChild(txSection);

    screen.addEventListener('click', function (e) {
      var nav = e.target.closest('[data-nav]');
      if (nav) { KP.router.go(nav.dataset.nav); return; }
      var milestone = e.target.closest('[data-milestone]');
      if (milestone) {
        var updatedMilestones = (goal.milestones || []).map(function (item) { return Object.assign({}, item); });
        var milestoneIndex = Number(milestone.dataset.milestone);
        if (updatedMilestones[milestoneIndex]) updatedMilestones[milestoneIndex].done = milestone.checked;
        store.updateGoal(goal.id, { milestones: updatedMilestones });
        return;
      }
      var act = e.target.closest('[data-act]');
      if (!act) return;
      var a = act.dataset.act;
      if (a === 'milestone-add') {
        var title = window.prompt('Название вехи');
        if (title && title.trim()) {
          var list = (goal.milestones || []).slice();
          list.push({ id: U.uid(), title: title.trim().slice(0, 60), amount: 0, done: false });
          store.updateGoal(goal.id, { milestones: list });
        }
      } else if (a === 'menu') common.openGoalMenu(goal);
      else if (a === 'deposit') KP.screens.operations.open({ type: 'deposit', goalId: goal.id });
      else if (a === 'withdraw') KP.screens.operations.open({ type: 'withdraw', goalId: goal.id });
      else if (a === 'transfer') KP.screens.operations.open({ type: 'transfer', goalId: goal.id });
    });

    common.bindTxRows(screen);
    return screen;
  }

  KP.screens.goalDetail = { render: render };
})(window.KP);
