/* Список целей: CRUD, закрепление, архив */
window.KP = window.KP || {};
KP.screens = KP.screens || {};
(function (KP) {
  'use strict';
  var U = KP.utils;
  var ui = KP.ui;
  var store = KP.store;
  var common = KP.screens.common;
  var showArchived = false;

  function goalRow(goal, archived) {
    var stats = store.goalStats(goal.id);
    var row = document.createElement('div');
    row.className = 'goal-row' + (archived ? ' is-archived' : '');
    row.dataset.goalId = goal.id;
    row.innerHTML =
      '<span class="goal-row-emoji grad-' + U.esc(goal.gradient) + '">' + U.esc(goal.emoji) + '</span>' +
      '<button type="button" class="goal-row-body" data-open aria-label="Открыть цель ' + U.esc(goal.title) + '">' +
      '<span class="goal-row-title">' + U.esc(goal.title) + (goal.pinned ? '<span class="pin">' + ui.icon('pin', 14) + '</span>' : '') + '</span>' +
      '<span class="goal-row-meta"><span>' + U.esc(common.money(stats.saved, { decimals: 0 })) + '</span><span>' + Math.round(stats.percent) + '%</span></span>' +
      '<span class="progress goal-row-bar"><span class="progress-fill" style="width:' + stats.percent.toFixed(1) + '%"></span></span>' +
      '</button>' +
      '<button type="button" class="icon-btn dots" data-menu="' + U.esc(goal.id) + '" aria-label="Действия с целью">' + ui.icon('dots', 20) + '</button>';
    return row;
  }

  function render() {
    var screen = document.createElement('div');
    screen.className = 'screen goals';
    var active = store.activeGoals();
    var archived = store.archivedGoals();
    var total = active.reduce(function (sum, g) { return sum + store.goalBalance(g.id); }, 0);

    screen.appendChild(common.head('Цели', {
      subtitle: active.length + ' ' + U.plural(active.length, ['активная цель', 'активные цели', 'активных целей']),
      actions: '<button type="button" class="icon-btn accent" data-act="new" aria-label="Новая цель">' + ui.icon('plus') + '</button>'
    }));

    var summary = document.createElement('div');
    summary.className = 'goals-summary';
    summary.innerHTML =
      '<div><div class="label">Накоплено в целях</div><div class="sum-value">' + U.esc(common.money(total, { decimals: 0 })) + '</div></div>' +
      '<span class="pill accent">' + active.length + ' ' + U.plural(active.length, ['цель', 'цели', 'целей']) + '</span>';
    screen.appendChild(summary);

    var rows = document.createElement('div');
    rows.className = 'goal-rows';
    if (!active.length) {
      rows.appendChild(ui.empty({
        title: 'Целей пока нет',
        text: 'Создайте цель: отпуск, техника, подушка безопасности — что угодно.',
        actionLabel: 'Создать цель',
        onAction: function () { KP.screens.goalForm.open(null); }
      }));
    } else {
      active.forEach(function (g) { rows.appendChild(goalRow(g, false)); });
    }
    screen.appendChild(rows);

    if (archived.length) {
      var block = document.createElement('div');
      block.className = 'archived-block';
      block.innerHTML =
        '<button type="button" class="archived-toggle' + (showArchived ? ' is-open' : '') + '" data-act="archive-toggle" aria-expanded="' + (showArchived ? 'true' : 'false') + '">' +
        ui.icon('archive', 18) + '<span class="grow" style="text-align:left">Архив · ' + archived.length + '</span>' + ui.icon('chevronDown', 18) + '</button>' +
        '<div class="archived-rows' + (showArchived ? '' : ' hidden') + '"></div>';
      var archivedRows = block.querySelector('.archived-rows');
      archived.forEach(function (g) { archivedRows.appendChild(goalRow(g, true)); });
      screen.appendChild(block);
    }

    screen.addEventListener('click', function (e) {
      var act = e.target.closest('[data-act]');
      if (act && act.dataset.act === 'new') {
        KP.screens.goalForm.open(null);
        return;
      }
      if (act && act.dataset.act === 'archive-toggle') {
        showArchived = !showArchived;
        var block = screen.querySelector('.archived-block');
        var list = block.querySelector('.archived-rows');
        list.classList.toggle('hidden', !showArchived);
        act.classList.toggle('is-open', showArchived);
        act.setAttribute('aria-expanded', showArchived ? 'true' : 'false');
        return;
      }
      var menu = e.target.closest('[data-menu]');
      if (menu) {
        var g = store.goal(menu.dataset.menu);
        if (g) common.openGoalMenu(g);
        return;
      }
      var open = e.target.closest('[data-open], [data-goal-id]');
      if (open) {
        var id = open.dataset.goalId || (open.closest('[data-goal-id]') && open.closest('[data-goal-id]').dataset.goalId);
        if (id) KP.router.go('/goal/' + id);
      }
    });

    return screen;
  }

  KP.screens.goals = { render: render };
})(window.KP);
