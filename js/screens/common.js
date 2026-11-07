/* Общие фрагменты экранов */
window.KP = window.KP || {};
KP.screens = KP.screens || {};
(function (KP) {
  'use strict';
  var U = KP.utils;
  var ui = KP.ui;
  var store = KP.store;
  var charts = KP.charts;

  function money(minor, opts) {
    opts = opts || {};
    if (store.settings().hideAmounts && !opts.force) {
      return opts.symbol === false ? '••••' : '•••• ' + U.currency(store.settings().currency).symbol;
    }
    return U.money(minor, store.settings().currency, opts);
  }

  function head(title, opts) {
    opts = opts || {};
    var el = document.createElement('header');
    el.className = 'screen-head';
    var actions = opts.actions || '';
    el.innerHTML =
      (opts.back ? '<button type="button" class="icon-btn" data-back aria-label="Назад">' + ui.icon('arrowLeft') + '</button>' : '') +
      '<div class="grow"><h1>' + U.esc(title) + '</h1>' +
      (opts.subtitle ? '<span class="head-sub">' + U.esc(opts.subtitle) + '</span>' : '') + '</div>' +
      '<div class="head-actions">' + actions + '</div>';
    var back = el.querySelector('[data-back]');
    if (back) back.addEventListener('click', function () { KP.router.back(); });
    return el;
  }

  function sectionHead(title, actionHtml) {
    var el = document.createElement('div');
    el.className = 'section-head';
    el.innerHTML = '<h2>' + U.esc(title) + '</h2>' + (actionHtml || '');
    return el;
  }

  function goalCard(goal, stats, opts) {
    opts = opts || {};
    var el = document.createElement('button');
    el.type = 'button';
    var gradient = U.GRADIENTS.indexOf(goal.gradient) >= 0 ? goal.gradient : 'sunset';
    el.className = 'goal-card grad-' + gradient;
    el.dataset.goalId = goal.id;
    el.setAttribute('aria-label', 'Цель ' + goal.title + ', ' + Math.round(stats.percent) + ' процентов');
    var saved = money(stats.saved, { decimals: 0 });
    var target = money(stats.target, { decimals: 0 });
    el.innerHTML =
      '<div class="goal-card-top"><span class="goal-emoji">' + U.esc(goal.emoji || '🎯') + '</span>' +
      (goal.pinned ? '<span class="pill" style="background:rgba(255,255,255,.18);color:#fff">' + ui.icon('pin', 14) + '</span>' : '') + '</div>' +
      '<div><h3>' + U.esc(goal.title) + '</h3><div class="goal-target">из ' + U.esc(target) + '</div></div>' +
      '<div><div class="goal-bottom"><div class="goal-saved">' + U.esc(saved) + '</div>' +
      '<div class="goal-spark">' + charts.sparkline(store.goalSeries(goal.id, 10), { width: 64, height: 24 }) + '</div></div>' +
      '<div class="progress"><div class="progress-fill" style="width:' + stats.percent.toFixed(1) + '%"></div></div>' +
      '<div class="goal-foot"><span>' + Math.round(stats.percent) + '%</span><span>' + U.esc(goal.deadline ? 'до ' + U.formatDate(goal.deadline, 'd MMMM') : 'без срока') + '</span></div></div>';
    return el;
  }

  function txMeta(tx) {
    var goal = store.goal(tx.goalId);
    var to = tx.toGoalId ? store.goal(tx.toGoalId) : null;
    var cat = tx.categoryId ? store.category(tx.categoryId) : null;
    var title = '', sub = '', icon = 'wallet', cls = '';
    if (tx.type === 'deposit') {
      title = goal ? goal.title : 'Пополнение';
      sub = 'Пополнение' + (tx.note ? ' · ' + tx.note : '');
      icon = goal ? goal.emoji : 'arrowDown';
      cls = 'good';
    } else if (tx.type === 'withdraw') {
      title = cat ? cat.name : 'Снятие';
      sub = 'Снятие с «' + (goal ? goal.title : 'цели') + '»' + (tx.note ? ' · ' + tx.note : '');
      icon = cat ? cat.emoji : 'arrowUp';
      cls = 'bad';
    } else {
      title = 'Перевод';
      sub = 'Из «' + (goal ? goal.title : '?') + '» в «' + (to ? to.title : '?') + '»' + (tx.note ? ' · ' + tx.note : '');
      icon = 'transfer';
      cls = 'accent';
    }
    return { title: title, sub: sub, icon: icon, cls: cls, goal: goal, to: to, cat: cat };
  }

  function txRow(tx, opts) {
    opts = opts || {};
    var meta = txMeta(tx);
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'list-row tx-row';
    el.dataset.txId = tx.id;
    var amountClass = tx.type === 'deposit' ? 'good' : tx.type === 'withdraw' ? 'bad' : '';
    var sign = tx.type === 'deposit' ? '+' : tx.type === 'withdraw' ? '−' : '';
    var amount = sign + money(tx.amount, { decimals: 0 });
    var iconNames = { arrowDown: 1, arrowUp: 1, transfer: 1, wallet: 1 };
    var iconHtml = iconNames[meta.icon] ? ui.icon(meta.icon, 20) : '<span>' + U.esc(meta.icon || '•') + '</span>';
    el.innerHTML =
      '<span class="list-icon ' + meta.cls + '">' + iconHtml + '</span>' +
      '<span class="list-main"><span class="list-title">' + U.esc(meta.title) + '</span><span class="list-sub">' + U.esc(meta.sub) + '</span></span>' +
      '<span class="list-amount ' + amountClass + '">' + U.esc(amount) +
      '<span class="list-time">' + U.time(tx.date) + '</span></span>';
    return el;
  }

  function openTxActions(tx) {
    var meta = txMeta(tx);
    var content = document.createElement('div');
    var sign = tx.type === 'deposit' ? '+' : tx.type === 'withdraw' ? '−' : '';
    content.innerHTML =
      '<div class="op-amount"><div class="op-amount-value ' + (tx.type === 'deposit' ? 'good' : tx.type === 'withdraw' ? 'bad' : '') + '">' + U.esc(sign + money(tx.amount)) + '</div>' +
      '<div class="op-balance">' + U.esc(meta.title) + ' · ' + U.esc(U.formatDate(tx.date, store.settings().dateFormat) + ' ' + U.time(tx.date)) + '</div></div>' +
      (meta.sub ? '<p class="confirm-text">' + U.esc(meta.sub) + '</p>' : '') +
      (tx.tags && tx.tags.length ? '<div class="chips" style="margin-top:8px">' + tx.tags.map(function (t) { return '<span class="chip">#' + U.esc(t) + '</span>'; }).join('') + '</div>' : '') +
      '<div class="action-list" style="margin-top:12px">' +
      '<button type="button" class="action-item" data-act="edit">' + ui.icon('edit') + 'Изменить</button>' +
      '<button type="button" class="action-item" data-act="dup">' + ui.icon('copy') + 'Дублировать</button>' +
      '<button type="button" class="action-item danger" data-act="del">' + ui.icon('trash') + 'Удалить</button>' +
      '</div>';
    var s = ui.sheet({ title: 'Операция', content: content });
    content.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var act = b.dataset.act;
      s.close();
      if (act === 'edit') {
        KP.screens.operations.open({ tx: tx });
      } else if (act === 'dup') {
        KP.screens.operations.open({
          type: tx.type, goalId: tx.goalId, toGoalId: tx.toGoalId, amount: tx.amount,
          categoryId: tx.categoryId, note: tx.note, tags: tx.tags, duplicate: true
        });
      } else if (act === 'del') {
        store.deleteTx(tx.id);
        U.haptic(18);
        ui.snackbar({
          text: 'Операция удалена',
          actionText: 'Отменить',
          onAction: function () { store.restoreTx(tx.id); }
        });
      }
    });
  }

  function openGoalMenu(goal) {
    var stats = store.goalStats(goal.id);
    var content = document.createElement('div');
    content.innerHTML =
      '<div class="row" style="margin-bottom:12px"><span class="goal-emoji grad-' + U.esc(goal.gradient) + '" style="color:#fff">' + U.esc(goal.emoji) + '</span>' +
      '<div class="grow"><div class="list-title">' + U.esc(goal.title) + '</div><div class="list-sub">' + U.esc(money(stats.saved, { decimals: 0 })) + ' из ' + U.esc(money(stats.target, { decimals: 0 })) + '</div></div></div>' +
      '<div class="action-list">' +
      '<button type="button" class="action-item" data-act="add">' + ui.icon('plus') + 'Пополнить</button>' +
      '<button type="button" class="action-item" data-act="edit">' + ui.icon('edit') + 'Редактировать</button>' +
      '<button type="button" class="action-item" data-act="pin">' + ui.icon('pin') + (goal.pinned ? 'Открепить' : 'Закрепить') + '</button>' +
      '<button type="button" class="action-item" data-act="freeze">' + ui.icon('pause') + (goal.frozen ? 'Возобновить цель' : 'Заморозить цель') + '</button>' +
      (goal.completedAt ? '' : '<button type="button" class="action-item" data-act="complete">' + ui.icon('check') + 'Куплено!</button>') +
      '<button type="button" class="action-item" data-act="archive">' + ui.icon('archive') + (goal.archived ? 'Вернуть из архива' : 'В архив') + '</button>' +
      '<button type="button" class="action-item danger" data-act="del">' + ui.icon('trash') + 'Удалить цель</button>' +
      '</div>';
    var s = ui.sheet({ title: 'Цель', content: content });
    content.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var act = b.dataset.act;
      if (act === 'add') {
        s.close();
        KP.screens.operations.open({ type: 'deposit', goalId: goal.id });
      } else if (act === 'edit') {
        s.close();
        KP.screens.goalForm.open(goal);
      } else if (act === 'pin') {
        store.togglePin(goal.id);
        s.close();
        ui.snackbar({ text: goal.pinned ? 'Цель закреплена' : 'Цель откреплена' });
      } else if (act === 'freeze') {
        store.updateGoal(goal.id, { frozen: !goal.frozen });
        s.close();
        ui.snackbar({ text: goal.frozen ? 'Цель разморожена' : 'Цель заморожена' });
      } else if (act === 'complete') {
        s.close();
        ui.confirm({ title: 'Куплено!', text: 'Завершить цель «' + goal.title + '»?', confirmText: 'Куплено!' }).then(function (ok) {
          if (!ok) return;
          store.updateGoal(goal.id, { completedAt: U.nowISO() });
          ui.snackbar({ text: 'Цель отмечена как купленная!' });
        });
      } else if (act === 'archive') {
        var wasArchived = !!goal.archived;
        store.setArchived(goal.id, !wasArchived);
        s.close();
        ui.snackbar({
          text: wasArchived ? 'Цель возвращена' : 'Цель в архиве',
          actionText: 'Отменить',
          onAction: function () { store.setArchived(goal.id, wasArchived); }
        });
      } else if (act === 'del') {
        s.close();
        ui.confirm({
          title: 'Удалить цель?',
          text: '«' + goal.title + '» и её операции скроются. Действие можно отменить сразу после удаления.',
          confirmText: 'Удалить',
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          store.deleteGoal(goal.id);
          U.haptic(20);
          if (KP.router.current().path.indexOf('/goal/') === 0) KP.router.go('/goals');
          ui.snackbar({
            text: 'Цель удалена',
            actionText: 'Отменить',
            onAction: function () { store.restoreGoal(goal.id); }
          });
        });
      }
    });
  }

  function openGoal(goalId) {
    KP.router.go('/goal/' + goalId);
  }

  function bindGoalCards(root) {
    root.addEventListener('click', function (e) {
      var card = e.target.closest('[data-goal-id]');
      if (!card) return;
      openGoal(card.dataset.goalId);
    });
  }

  function bindTxRows(root) {
    root.addEventListener('click', function (e) {
      var row = e.target.closest('[data-tx-id]');
      if (!row) return;
      var tx = store.tx(row.dataset.txId);
      if (tx) openTxActions(tx);
    });
  }

  function statCard(label, value, cls) {
    return '<div class="stat-card"><span class="stat-label">' + U.esc(label) + '</span><span class="stat-value ' + (cls || '') + '">' + U.esc(value) + '</span></div>';
  }

  KP.screens.common = {
    money: money,
    head: head,
    sectionHead: sectionHead,
    goalCard: goalCard,
    txMeta: txMeta,
    txRow: txRow,
    openTxActions: openTxActions,
    openGoalMenu: openGoalMenu,
    openGoal: openGoal,
    bindGoalCards: bindGoalCards,
    bindTxRows: bindTxRows,
    statCard: statCard
  };
})(window.KP);
