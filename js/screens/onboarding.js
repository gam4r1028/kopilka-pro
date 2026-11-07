/* Онбординг: имя, валюта, первая цель, стартовая сумма */
window.KP = window.KP || {};
KP.screens = KP.screens || {};
(function (KP) {
  'use strict';
  var U = KP.utils;
  var ui = KP.ui;
  var store = KP.store;

  var root = null;
  var step = 0;
  var name = '';
  var currency = 'RUB';
  var goalTitle = '';
  var goalEmoji = '🏖️';
  var goalGradient = 'sunset';
  var goalTarget = 5000000;
  var goalDeadline = '';
  var startMinor = 0;

  function show() {
    root = document.getElementById('onboarding-root');
    if (!root) return;
    step = 0;
    name = '';
    currency = store.settings().currency || 'RUB';
    goalTitle = '';
    goalEmoji = '🏖️';
    goalGradient = 'sunset';
    goalTarget = 5000000;
    goalDeadline = '';
    startMinor = 0;
    render();
  }

  function hide() {
    if (root) root.innerHTML = '';
  }

  function finish() {
    store.batch(function () {
      store.updateSettings({
        name: name.trim(),
        currency: currency,
        onboardingDone: true
      });
      var goal = store.addGoal({
        title: goalTitle.trim() || 'Моя первая цель',
        emoji: goalEmoji,
        gradient: goalGradient,
        target: goalTarget,
        deadline: goalDeadline ? new Date(goalDeadline + 'T12:00:00').toISOString() : null
      });
      if (startMinor > 0) {
        store.addTx({
          type: 'deposit',
          goalId: goal.id,
          amount: startMinor,
          note: 'Стартовая сумма'
        });
      }
    });
    hide();
    KP.router.go('/home');
    KP.router.refresh();
    U.haptic([10, 40, 10]);
    ui.snackbar({ text: 'Добро пожаловать в Копилку Pro!' });
  }

  function demo() {
    store.seedDemo();
    hide();
    KP.router.go('/home');
    KP.router.refresh();
    ui.snackbar({ text: 'Демо-данные загружены' });
  }

  function progressHtml() {
    var dots = '';
    for (var i = 1; i <= 4; i++) dots += '<span class="' + (step >= i ? 'is-on' : '') + '"></span>';
    return '<div class="ob-progress" aria-hidden="true">' + dots + '</div>';
  }

  function topHtml() {
    return '<div class="ob-top">' +
      (step > 0 ? '<button type="button" class="icon-btn ob-back" data-act="back" aria-label="Назад">' + ui.icon('arrowLeft') + '</button>' : '<span></span>') +
      '<span class="pill accent">Копилка Pro</span></div>';
  }

  function stepWelcome() {
    return '<div class="ob-step">' +
      '<div class="ob-logo">' + ui.icon('piggy', 42) + '</div>' +
      '<h1 class="ob-title">Копите на мечты красиво</h1>' +
      '<p class="ob-sub">Цели, операции и аналитика — в одном приложении. Без банков, регистрации и лишнего шума.</p>' +
      '<div class="ob-features">' +
      '<span class="chip">🎯 Цели</span><span class="chip">📈 Аналитика</span>' +
      '<span class="chip">🔔 Напоминания</span><span class="chip">📴 Офлайн</span></div>' +
      '<div class="ob-actions">' +
      '<button type="button" class="btn btn-primary btn-lg" data-act="next">Начать</button>' +
      '<button type="button" class="btn btn-ghost" data-act="demo">Посмотреть демо</button>' +
      '</div>' +
      '<p class="hint" style="margin-top:16px;text-align:center">Все данные хранятся только на вашем устройстве.</p>' +
      '</div>';
  }

  function stepName() {
    return progressHtml() + '<div class="ob-step">' +
      '<h1 class="ob-title">Как вас зовут?</h1>' +
      '<p class="ob-sub">Имя нужно только для приветствия на главной.</p>' +
      '<label class="field"><span class="field-label">Ваше имя</span>' +
      '<input class="input" id="ob-name" maxlength="30" placeholder="Например, Алексей" autocomplete="given-name" value="' + U.esc(name) + '"></label>' +
      '<div class="field-error" id="ob-err"></div>' +
      '<div class="ob-actions"><button type="button" class="btn btn-primary btn-lg" data-act="next">Дальше</button>' +
      '<button type="button" class="btn btn-ghost" data-act="skip">Пропустить</button></div>' +
      '</div>';
  }

  function stepCurrency() {
    var html = progressHtml() + '<div class="ob-step">' +
      '<h1 class="ob-title">Валюта</h1>' +
      '<p class="ob-sub">Выберите, в чём удобнее считать. Потом можно поменять в настройках.</p>' +
      '<div class="currency-grid">';
    Object.keys(U.CURRENCIES).forEach(function (code) {
      var c = U.CURRENCIES[code];
      html += '<button type="button" class="currency-btn' + (code === currency ? ' is-on' : '') + '" data-currency="' + code + '">' +
        '<span class="currency-symbol">' + U.esc(c.symbol) + '</span>' +
        '<span><span class="currency-name">' + U.esc(c.name) + '</span><br><span class="currency-code">' + code + '</span></span></button>';
    });
    html += '</div><div class="ob-actions"><button type="button" class="btn btn-primary btn-lg" data-act="next">Дальше</button></div></div>';
    return html;
  }

  function stepGoal() {
    return progressHtml() + '<div class="ob-step">' +
      '<h1 class="ob-title">Первая цель</h1>' +
      '<p class="ob-sub">На что хотите копить? Это можно изменить в любой момент.</p>' +
      '<div class="ob-goal-preview"><div class="goal-card grad-' + U.esc(goalGradient) + '" id="ob-preview" style="width:100%;min-height:150px">' +
      '<div class="goal-card-top"><span class="goal-emoji" id="ob-prev-emoji">' + U.esc(goalEmoji) + '</span></div>' +
      '<div><h3 id="ob-prev-title">' + U.esc(goalTitle || 'Моя первая цель') + '</h3>' +
      '<div class="goal-target" id="ob-prev-target">из ' + U.esc(U.money(goalTarget, currency)) + '</div></div>' +
      '<div class="progress"><div class="progress-fill" style="width:0%"></div></div></div></div>' +
      '<div class="form-grid" style="margin-top:16px">' +
      '<label class="field"><span class="field-label">Название цели</span><input class="input" id="ob-goal-title" maxlength="40" placeholder="Например, Отпуск на море" autocomplete="off" value="' + U.esc(goalTitle) + '"></label>' +
      '<div class="field"><span class="field-label">Эмодзи</span><div class="emoji-grid" id="ob-emojis"></div></div>' +
      '<label class="field"><span class="field-label">Сумма цели</span><div class="input-wrap"><input class="input" id="ob-goal-target" inputmode="decimal" placeholder="50 000" autocomplete="off" value="' + U.esc(U.minorToInput(goalTarget)) + '"><span class="input-suffix">' + U.esc(U.currency(currency).symbol) + '</span></div></label>' +
      '<label class="field"><span class="field-label">Дедлайн (необязательно)</span><input class="input" id="ob-goal-deadline" type="date" value="' + U.esc(goalDeadline) + '"></label>' +
      '<div class="field-error" id="ob-err"></div>' +
      '</div>' +
      '<div class="ob-actions"><button type="button" class="btn btn-primary btn-lg" data-act="next">Дальше</button></div>' +
      '</div>';
  }

  function stepStart() {
    return progressHtml() + '<div class="ob-step">' +
      '<h1 class="ob-title">Сколько уже отложено?</h1>' +
      '<p class="ob-sub">Можно начать с нуля — добавите деньги позже.</p>' +
      '<div class="ob-start-value"><span class="amount" id="ob-start-value">' + U.esc(U.money(startMinor, currency)) + '</span></div>' +
      '<label class="field"><span class="field-label">Стартовая сумма</span><div class="input-wrap"><input class="input" id="ob-start" inputmode="decimal" placeholder="0" autocomplete="off" value="' + U.esc(U.minorToInput(startMinor)) + '"><span class="input-suffix">' + U.esc(U.currency(currency).symbol) + '</span></div></label>' +
      '<div class="chips" style="margin-top:12px" id="ob-quick">' +
      '<button type="button" class="chip" data-rub="0">С нуля</button>' +
      '<button type="button" class="chip" data-rub="1000">1 000</button>' +
      '<button type="button" class="chip" data-rub="5000">5 000</button>' +
      '<button type="button" class="chip" data-rub="10000">10 000</button></div>' +
      '<div class="ob-actions" style="margin-top:auto">' +
      '<button type="button" class="btn btn-primary btn-lg" data-act="finish">Начать копить</button>' +
      '</div></div>';
  }

  function render() {
    if (!root) return;
    var body = step === 0 ? stepWelcome() : step === 1 ? stepName() : step === 2 ? stepCurrency() : step === 3 ? stepGoal() : stepStart();
    root.innerHTML = '<div class="onboarding"><div class="ob-inner">' + topHtml() + body + '</div></div>';
    bind();
  }

  function bind() {
    var el = root.querySelector('.onboarding');
    if (!el) return;
    el.addEventListener('click', function (e) {
      var act = e.target.closest('[data-act]');
      if (act) {
        var a = act.dataset.act;
        if (a === 'back') { if (step > 0) { step--; render(); } }
        else if (a === 'demo') demo();
        else if (a === 'next') next();
        else if (a === 'finish') finish();
        else if (a === 'skip') { name = ''; step++; render(); }
        return;
      }
      var cur = e.target.closest('[data-currency]');
      if (cur) {
        currency = cur.dataset.currency;
        el.querySelectorAll('.currency-btn').forEach(function (b) { b.classList.toggle('is-on', b.dataset.currency === currency); });
      }
      var quick = e.target.closest('[data-rub]');
      if (quick) {
        startMinor = Number(quick.dataset.rub) * 100;
        var input = el.querySelector('#ob-start');
        var display = el.querySelector('#ob-start-value');
        if (input) input.value = U.minorToInput(startMinor);
        if (display) display.textContent = U.money(startMinor, currency);
      }
    });

    if (step === 1) {
      var nameInput = el.querySelector('#ob-name');
      nameInput.addEventListener('input', function () { name = nameInput.value; });
      nameInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') next(); });
      setTimeout(function () { nameInput.focus(); }, 120);
    }

    if (step === 3) {
      var titleInput = el.querySelector('#ob-goal-title');
      var targetInput = el.querySelector('#ob-goal-target');
      var deadlineInput = el.querySelector('#ob-goal-deadline');
      var emojis = el.querySelector('#ob-emojis');
      U.EMOJIS.slice(0, 16).forEach(function (em) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'emoji-btn' + (em === goalEmoji ? ' is-on' : '');
        b.textContent = em;
        b.addEventListener('click', function () {
          goalEmoji = em;
          el.querySelector('#ob-prev-emoji').textContent = em;
          emojis.querySelectorAll('.emoji-btn').forEach(function (x) { x.classList.toggle('is-on', x === b); });
        });
        emojis.appendChild(b);
      });
      titleInput.addEventListener('input', function () {
        goalTitle = titleInput.value;
        el.querySelector('#ob-prev-title').textContent = goalTitle || 'Моя первая цель';
      });
      targetInput.addEventListener('input', function () {
        goalTarget = U.toMinor(targetInput.value);
        el.querySelector('#ob-prev-target').textContent = 'из ' + U.money(goalTarget, currency);
      });
      deadlineInput.addEventListener('change', function () { goalDeadline = deadlineInput.value; });
      setTimeout(function () { titleInput.focus(); }, 120);
    }

    if (step === 4) {
      var startInput = el.querySelector('#ob-start');
      var startDisplay = el.querySelector('#ob-start-value');
      startInput.addEventListener('input', function () {
        startMinor = U.toMinor(startInput.value);
        startDisplay.textContent = U.money(startMinor, currency);
      });
      setTimeout(function () { startInput.focus(); }, 120);
    }
  }

  function next() {
    var el = root.querySelector('.onboarding');
    if (step === 1) {
      name = (el.querySelector('#ob-name').value || '').trim();
      if (!name) { el.querySelector('#ob-err').textContent = 'Введите имя или пропустите шаг'; return; }
    }
    if (step === 3) {
      goalTitle = (el.querySelector('#ob-goal-title').value || '').trim();
      goalTarget = U.toMinor(el.querySelector('#ob-goal-target').value);
      goalDeadline = el.querySelector('#ob-goal-deadline').value;
      if (!goalTitle) { el.querySelector('#ob-err').textContent = 'Введите название цели'; return; }
      if (goalTarget <= 0) { el.querySelector('#ob-err').textContent = 'Укажите сумму больше нуля'; return; }
    }
    step = Math.min(4, step + 1);
    render();
  }

  KP.screens.onboarding = { show: show, hide: hide };
})(window.KP);
