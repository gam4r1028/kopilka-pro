/* Операции: пополнение, снятие, перевод */
window.KP = window.KP || {};
KP.screens = KP.screens || {};
(function (KP) {
  'use strict';
  var U = KP.utils;
  var ui = KP.ui;
  var store = KP.store;

  function money(minor) { return U.money(minor, store.settings().currency); }
  function cur() { return U.currency(store.settings().currency).symbol; }

  function parseTags(value) {
    var seen = {};
    return String(value || '').split(',').map(function (s) { return s.trim().replace(/^#/, ''); })
      .filter(function (s) { return s && !seen[s.toLowerCase()] && (seen[s.toLowerCase()] = true); })
      .slice(0, 6);
  }

  function open(opts) {
    opts = opts || {};
    var editing = opts.tx || null;
    var type = editing ? editing.type : (opts.type || 'deposit');
    var goals = store.allGoals().filter(function (g) {
      if (!g.archived) return true;
      return editing && (g.id === editing.goalId || g.id === editing.toGoalId);
    });

    if (!goals.length) {
      var emptyContent = ui.empty({
        title: 'Сначала создайте цель',
        text: 'Операции привязаны к целям. Создайте первую цель — и можно копить.',
        actionLabel: 'Создать цель',
        onAction: function () { s.close(); KP.screens.goalForm.open(null); }
      });
      var s = ui.sheet({ title: 'Новая операция', content: emptyContent });
      return;
    }

    var goalId = editing ? editing.goalId : (opts.goalId || goals[0].id);
    if (!store.goal(goalId)) goalId = goals[0].id;
    var toGoalId = editing ? editing.toGoalId : (opts.toGoalId || (goals[1] ? goals[1].id : goals[0].id));
    if (!store.goal(toGoalId)) toGoalId = goals[1] ? goals[1].id : goals[0].id;
    var categoryId = editing ? editing.categoryId : (opts.categoryId || null);
    var note = editing ? (editing.note || '') : (opts.note || '');
    var tags = editing ? (editing.tags || []) : (opts.tags || []);
    var date = editing ? editing.date : U.nowISO();
    var amount = editing ? editing.amount : (opts.amount || 0);

    var title = editing ? 'Изменить операцию' : type === 'deposit' ? 'Пополнить' : type === 'withdraw' ? 'Снять' : 'Перевод';
    var content = document.createElement('div');
    content.className = 'op-form';
    content.innerHTML =
      '<div class="op-goals"></div>' +
      '<div class="op-amount-holder"></div>' +
      '<div class="op-quick"></div>' +
      '<div class="op-balance" id="op-balance"></div>' +
      '<div class="op-error" id="op-error" role="alert"></div>' +
      '<div class="op-section op-cat-section"></div>' +
      '<div class="op-details">' +
      '<label class="field"><span class="field-label">Комментарий</span><input class="input" id="op-note" maxlength="100" placeholder="Необязательно" autocomplete="off"></label>' +
      '<div class="form-row">' +
      '<label class="field"><span class="field-label">Дата и время</span><input class="input" id="op-date" type="datetime-local"></label>' +
      '<label class="field"><span class="field-label">Теги</span><input class="input" id="op-tags" list="op-tag-options" maxlength="80" placeholder="через запятую" autocomplete="off"><datalist id="op-tag-options"></datalist></label>' +
      '</div></div>';

    var footer = document.createElement('div');
    footer.style.width = '100%';
    var submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'btn btn-primary btn-block';
    footer.appendChild(submit);

    var sheet = ui.sheet({
      title: title,
      content: content,
      footer: footer,
      onClose: function () { if (numpad) numpad.destroy(); }
    });

    var goalsWrap = content.querySelector('.op-goals');
    var amountHolder = content.querySelector('.op-amount-holder');
    var quickWrap = content.querySelector('.op-quick');
    var balanceEl = content.querySelector('#op-balance');
    var errorEl = content.querySelector('#op-error');
    var catSection = content.querySelector('.op-cat-section');
    var noteInput = content.querySelector('#op-note');
    var dateInput = content.querySelector('#op-date');
    var tagsInput = content.querySelector('#op-tags');
    noteInput.value = note;
    dateInput.value = U.datetimeLocal(date);
    tagsInput.value = (tags || []).join(', ');
    var knownTags = {};
    store.transactions().forEach(function (tx) { (tx.tags || []).forEach(function (tag) { knownTags[tag] = true; }); });
    var tagOptions = content.querySelector('#op-tag-options');
    Object.keys(knownTags).sort().forEach(function (tag) {
      var option = document.createElement('option');
      option.value = tag;
      tagOptions.appendChild(option);
    });

    var numpad = ui.numpad({
      currency: store.settings().currency,
      value: amount ? U.minorToInput(amount) : '',
      onChange: function (minor) {
        amount = minor;
        errorEl.textContent = '';
        updateSubmit();
      }
    });
    amountHolder.appendChild(numpad.el);

    function availableFor(goal) {
      var balance = store.goalBalance(goal);
      if (editing && editing.goalId === goal && (editing.type === 'withdraw' || editing.type === 'transfer')) balance += editing.amount;
      return balance;
    }

    function updateBalance() {
      var g = store.goal(goalId);
      if (!g) { balanceEl.textContent = ''; return; }
      var bal = availableFor(goalId);
      var text = type === 'deposit' ? 'Накоплено: ' + money(bal) : 'Доступно: ' + money(bal);
      if (type === 'deposit' && g.target > 0) {
        text += ' · до цели ' + money(Math.max(0, g.target - bal));
      }
      balanceEl.textContent = text;
    }

    function updateSubmit() {
      var label = type === 'deposit' ? 'Пополнить' : type === 'withdraw' ? 'Снять' : 'Перевести';
      if (amount > 0) label += ' ' + money(amount);
      submit.textContent = editing ? 'Сохранить' : label;
      submit.disabled = amount <= 0;
    }

    function renderGoals() {
      goalsWrap.innerHTML = '';
      if (type === 'transfer') {
        var l1 = document.createElement('span'); l1.className = 'label'; l1.textContent = 'Откуда';
        goalsWrap.appendChild(l1);
        var c1 = ui.chips({
          scroll: true,
          options: goals.map(function (g) { return { value: g.id, label: g.title, emoji: g.emoji }; }),
          value: goalId,
          onChange: function (v) { goalId = v; updateBalance(); }
        });
        goalsWrap.appendChild(c1);
        var l2 = document.createElement('span'); l2.className = 'label'; l2.style.marginTop = '10px'; l2.textContent = 'Куда';
        goalsWrap.appendChild(l2);
        var c2 = ui.chips({
          scroll: true,
          options: goals.map(function (g) { return { value: g.id, label: g.title, emoji: g.emoji }; }),
          value: toGoalId,
          onChange: function (v) { toGoalId = v; }
        });
        goalsWrap.appendChild(c2);
      } else {
        var l = document.createElement('span'); l.className = 'label'; l.textContent = type === 'deposit' ? 'Куда копим' : 'С какой цели';
        goalsWrap.appendChild(l);
        var c = ui.chips({
          scroll: true,
          options: goals.map(function (g) { return { value: g.id, label: g.title, emoji: g.emoji }; }),
          value: goalId,
          onChange: function (v) { goalId = v; updateBalance(); }
        });
        goalsWrap.appendChild(c);
      }
    }

    function renderQuick() {
      quickWrap.innerHTML = '';
      var items = [];
      if (type === 'deposit') {
        items = [
          { label: '500', rub: 500 }, { label: '1 000', rub: 1000 }, { label: '5 000', rub: 5000 },
          { label: 'До цели', act: 'goal' }
        ];
      } else {
        items = [
          { label: '500', rub: 500 }, { label: '1 000', rub: 1000 }, { label: 'Всё', act: 'max' }
        ];
      }
      items.forEach(function (item) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip';
        b.textContent = item.label;
        b.addEventListener('click', function () {
          if (item.act === 'max') {
            numpad.set(U.minorToInput(Math.max(0, availableFor(goalId))));
          } else if (item.act === 'goal') {
            var g = store.goal(goalId);
            var rem = g ? Math.max(0, g.target - store.goalBalance(goalId)) : 0;
            numpad.set(U.minorToInput(rem));
          } else {
            numpad.set(U.minorToInput(item.rub * 100));
          }
        });
        quickWrap.appendChild(b);
      });
    }

    function renderCategories() {
      if (type !== 'withdraw') { catSection.innerHTML = ''; return; }
      catSection.innerHTML = '<span class="label">На что потрачено</span><div class="category-grid"></div>';
      var grid = catSection.querySelector('.category-grid');
      store.categories().forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'category-chip' + (categoryId === c.id ? ' is-on' : '');
        b.dataset.cat = c.id;
        b.innerHTML = '<span class="cat-emoji">' + U.esc(c.emoji) + '</span><span>' + U.esc(c.name) + '</span>';
        grid.appendChild(b);
      });
      var add = document.createElement('button');
      add.type = 'button';
      add.className = 'category-chip';
      add.dataset.catAdd = '1';
      add.innerHTML = '<span class="cat-emoji">＋</span><span>Своя</span>';
      grid.appendChild(add);
    }

    function showError(text) {
      errorEl.textContent = text;
      U.haptic(20);
    }

    function addCategory() {
      var box = document.createElement('div');
      box.innerHTML =
        '<label class="field"><span class="field-label">Название</span><input class="input" id="new-cat-name" maxlength="30" placeholder="Например, Питомец" autocomplete="off"></label>' +
        '<div class="field" style="margin-top:12px"><span class="field-label">Эмодзи</span><div class="emoji-grid" id="new-cat-emojis"></div></div>' +
        '<div class="field-error" id="new-cat-err"></div>';
      var emojis = ['🏷️', '🐱', '🎵', '⚽', '📚', '🧸', '🌿', '☕', '💅', '🧰', '🚀', '💡'];
      var chosen = '🏷️';
      var grid = box.querySelector('#new-cat-emojis');
      emojis.forEach(function (e) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'emoji-btn' + (e === chosen ? ' is-on' : '');
        b.textContent = e;
        b.addEventListener('click', function () {
          chosen = e;
          grid.querySelectorAll('.emoji-btn').forEach(function (x) { x.classList.toggle('is-on', x === b); });
        });
        grid.appendChild(b);
      });
      var foot = document.createElement('div');
      foot.className = 'confirm-actions';
      var cancel = document.createElement('button');
      cancel.type = 'button'; cancel.className = 'btn btn-ghost'; cancel.textContent = 'Отмена';
      var save = document.createElement('button');
      save.type = 'button'; save.className = 'btn btn-primary'; save.textContent = 'Добавить';
      foot.appendChild(cancel); foot.appendChild(save);
      var s2 = ui.sheet({ title: 'Своя категория', content: box, footer: foot });
      cancel.addEventListener('click', function () { s2.close(); });
      save.addEventListener('click', function () {
        var name = box.querySelector('#new-cat-name').value.trim();
        if (!name) { box.querySelector('#new-cat-err').textContent = 'Введите название'; return; }
        var cat = store.addCategory(name, chosen);
        categoryId = cat.id;
        s2.close();
        renderCategories();
      });
    }

    catSection.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat], [data-cat-add]');
      if (!b) return;
      if (b.dataset.catAdd) { addCategory(); return; }
      categoryId = b.dataset.cat;
      renderCategories();
    });

    submit.addEventListener('click', function () {
      var value = numpad.get();
      if (value <= 0) { showError('Введите сумму больше нуля'); return; }
      if (type === 'withdraw') {
        if (!categoryId) { showError('Выберите, на что потрачено'); return; }
        if (value > availableFor(goalId)) { showError('Недостаточно средств на цели'); return; }
      }
      if (type === 'transfer') {
        if (goalId === toGoalId) { showError('Выберите разные цели'); return; }
        if (value > availableFor(goalId)) { showError('Недостаточно средств на цели-источнике'); return; }
      }
      var isoDate = U.fromDatetimeLocal(dateInput.value) || U.nowISO();
      var data = {
        type: type,
        goalId: goalId,
        toGoalId: type === 'transfer' ? toGoalId : null,
        amount: value,
        categoryId: type === 'withdraw' ? categoryId : null,
        tags: parseTags(tagsInput.value),
        note: noteInput.value.trim().slice(0, 100),
        date: isoDate
      };
      if (editing) {
        store.updateTx(editing.id, data);
        sheet.close();
        U.haptic([8, 24, 8]);
        ui.snackbar({ text: 'Операция обновлена' });
      } else {
        var created = store.addTx(data);
        sheet.close();
        U.haptic([8, 24, 8]);
        var verb = type === 'deposit' ? 'Пополнено на ' : type === 'withdraw' ? 'Снято ' : 'Переведено ';
        ui.snackbar({
          text: verb + money(value),
          actionText: 'Отменить',
          onAction: function () { store.deleteTx(created.id); }
        });
      }
    });

    renderGoals();
    renderQuick();
    renderCategories();
    updateBalance();
    updateSubmit();
    U.haptic(6);
  }

  KP.screens.operations = { open: open };
})(window.KP);
