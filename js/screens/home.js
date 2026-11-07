/* Главная: баланс, быстрые действия, цели, стрик, последние операции */
window.KP = window.KP || {};
KP.screens = KP.screens || {};
(function (KP) {
  'use strict';
  var U = KP.utils;
  var ui = KP.ui;
  var store = KP.store;
  var charts = KP.charts;
  var common = KP.screens.common;

  function render() {
    var screen = document.createElement('div');
    screen.className = 'screen home';
    var settings = store.settings();
    var total = store.total();
    var change = store.monthChange();
    var streak = store.streak();
    var goals = store.activeGoals();
    var recent = store.recentTransactions(5);
    var hide = settings.hideAmounts;
    var currency = settings.currency;
    var name = settings.name ? U.esc(settings.name) : '';
    var today = new Date();
    var weekday = U.WEEKDAYS[(today.getDay() + 6) % 7];
    var totalText = hide ? '••••' : U.money(total, currency, { symbol: false });
    var changeText = hide ? '••••' : (change === 0 ? 'Без изменений' : U.money(change, currency, { sign: true }));
    var changeClass = change > 0 ? 'good' : change < 0 ? 'bad' : '';

    screen.innerHTML =
      '<div class="home-top"><div><div class="greeting">Привет' + (name ? ', ' + name : '') + '</div>' +
      '<div class="home-date">' + U.esc(weekday) + ', ' + U.esc(U.formatDate(today, 'd MMMM')) + '</div></div></div>' +
      '<section class="balance-card card" aria-label="Общий баланс">' +
      '<div class="between"><span class="balance-label">Всего накоплено</span>' +
      '<button type="button" class="icon-btn soft" data-act="eye" aria-label="' + (hide ? 'Показать суммы' : 'Скрыть суммы') + '">' + ui.icon(hide ? 'eyeOff' : 'eye', 20) + '</button></div>' +
      '<div class="balance-value"><span id="home-total">' + U.esc(totalText) + '</span><span class="cur">' + U.esc(U.currency(currency).symbol) + '</span></div>' +
      '<div class="balance-meta"><span class="pill ' + changeClass + '">' + U.esc(changeText) + '</span><span class="caption">за ' + U.esc(U.monthLabel(today)) + '</span></div>' +
      '<div class="balance-spark">' + charts.sparkline(store.totalSeries(12), { width: 320, height: 52, stroke: 2.5 }) + '</div>' +
      '</section>' +
      '<div class="quick-wrap"><div class="quick-actions">' +
      '<button type="button" class="quick-btn" data-act="deposit"><span class="quick-ico">' + ui.icon('plus', 22) + '</span>Пополнить</button>' +
      '<button type="button" class="quick-btn" data-act="withdraw"><span class="quick-ico">' + ui.icon('minus', 22) + '</span>Снять</button>' +
      '<button type="button" class="quick-btn" data-act="transfer"><span class="quick-ico">' + ui.icon('transfer', 22) + '</span>Перевод</button>' +
      '<button type="button" class="quick-btn" data-act="new-goal"><span class="quick-ico">' + ui.icon('target', 22) + '</span>Новая цель</button>' +
      '</div></div>' +
      '<section class="section"><div class="section-head"><h2>Цели</h2><button type="button" class="link" data-nav="/goals">Все</button></div>' +
      '<div class="goals-holder"></div></section>' +
      '<section class="section"><div class="streak-holder"></div></section>' +
      '<section class="section"><div class="section-head"><h2>Последние операции</h2>' +
      (recent.length ? '<button type="button" class="link" data-nav="/history">Все</button>' : '') + '</div>' +
      '<div class="recent-holder"></div></section>';

    /* Карусель целей */
    var goalsHolder = screen.querySelector('.goals-holder');
    if (!goals.length) {
      goalsHolder.appendChild(ui.empty({
        title: 'Пора поставить цель',
        text: 'Создайте первую цель и начните откладывать — даже по чуть-чуть.',
        actionLabel: 'Создать цель',
        onAction: function () { KP.screens.goalForm.open(null); }
      }));
    } else {
      var scroller = document.createElement('div');
      scroller.className = 'scroll-x goals-scroller';
      goals.forEach(function (g) {
        var stats = store.goalStats(g.id);
        if (stats) {
          var card = common.goalCard(g, stats);
          card.draggable = true;
          card.dataset.sortGoal = g.id;
          card.setAttribute('aria-label', card.getAttribute('aria-label') + ', перетащите для сортировки');
          scroller.appendChild(card);
        }
      });
      goalsHolder.appendChild(scroller);
    }

    /* Стрик */
    var streakHolder = screen.querySelector('.streak-holder');
    var streakCard = document.createElement('div');
    streakCard.className = 'streak-card';
    streakCard.innerHTML =
      '<div class="streak-flame">' + ui.icon('flame', 26) + '</div>' +
      '<div class="grow"><div class="streak-days">' + (streak.days > 0 ? streak.days + ' ' + U.plural(streak.days, ['день', 'дня', 'дней']) + ' подряд' : 'Серия пока пустая') + '</div>' +
      '<div class="caption">' + (streak.days > 0 ? (streak.today ? 'Сегодня уже пополняли. Так держать!' : 'Пополните сегодня, чтобы продлить серию.') : 'Каждое пополнение продлевает серию.') + '</div></div>' +
      '<button type="button" class="btn btn-soft btn-sm" data-act="deposit">' + (streak.days > 0 ? 'Продлить' : 'Начать') + '</button>';
    streakHolder.appendChild(streakCard);

    /* Последние операции */
    var recentHolder = screen.querySelector('.recent-holder');
    if (!recent.length) {
      recentHolder.appendChild(ui.empty({
        title: 'Операций пока нет',
        text: 'Пополните цель — и здесь появится история.',
        actionLabel: 'Пополнить',
        onAction: function () { KP.screens.operations.open({ type: 'deposit' }); }
      }));
    } else {
      var list = document.createElement('div');
      list.className = 'list recent-card';
      recent.forEach(function (tx) { list.appendChild(common.txRow(tx)); });
      recentHolder.appendChild(list);
    }

    var draggingGoal = null;
    screen.addEventListener('dragstart', function (e) {
      var card = e.target.closest('[data-sort-goal]');
      if (!card) return;
      draggingGoal = card.dataset.sortGoal;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggingGoal);
      card.classList.add('is-dragging');
    });
    screen.addEventListener('dragover', function (e) {
      var card = e.target.closest('[data-sort-goal]');
      if (card && draggingGoal && card.dataset.sortGoal !== draggingGoal) e.preventDefault();
    });
    screen.addEventListener('drop', function (e) {
      var target = e.target.closest('[data-sort-goal]');
      if (!target || !draggingGoal || target.dataset.sortGoal === draggingGoal) return;
      e.preventDefault();
      var cards = Array.prototype.slice.call(screen.querySelectorAll('[data-sort-goal]'));
      var ids = cards.map(function (card) { return card.dataset.sortGoal; });
      var from = ids.indexOf(draggingGoal), to = ids.indexOf(target.dataset.sortGoal);
      ids.splice(to, 0, ids.splice(from, 1)[0]);
      store.reorderGoals(ids);
      var holder = screen.querySelector('.goals-holder .goals-scroller');
      ids.forEach(function (id) {
        var item = holder.querySelector('[data-sort-goal="' + id + '"]');
        if (item) holder.appendChild(item);
      });
    });
    screen.addEventListener('dragend', function () {
      draggingGoal = null;
      screen.querySelectorAll('.is-dragging').forEach(function (card) { card.classList.remove('is-dragging'); });
    });

    screen.addEventListener('click', function (e) {
      var nav = e.target.closest('[data-nav]');
      if (nav) { KP.router.go(nav.dataset.nav); return; }
      var act = e.target.closest('[data-act]');
      if (!act) return;
      var a = act.dataset.act;
      if (a === 'eye') {
        store.updateSettings({ hideAmounts: !hide });
        U.haptic(6);
      } else if (a === 'deposit') {
        KP.screens.operations.open({ type: 'deposit' });
      } else if (a === 'withdraw') {
        KP.screens.operations.open({ type: 'withdraw' });
      } else if (a === 'transfer') {
        KP.screens.operations.open({ type: 'transfer' });
      } else if (a === 'new-goal') {
        KP.screens.goalForm.open(null);
      }
    });

    common.bindGoalCards(screen);
    common.bindTxRows(screen);

    if (!hide) {
      requestAnimationFrame(function () {
        var el = screen.querySelector('#home-total');
        if (el) U.countUp(el, 0, total, 850, function (v) { return U.money(v, currency, { symbol: false }); });
      });
    }

    return screen;
  }

  KP.screens.home = { render: render };
})(window.KP);
