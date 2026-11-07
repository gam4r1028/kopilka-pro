/* Создание и редактирование цели */
window.KP = window.KP || {};
KP.screens = KP.screens || {};
(function (KP) {
  'use strict';
  var U = KP.utils;
  var ui = KP.ui;
  var store = KP.store;

  function open(goal) {
    var editing = !!goal;
    var emoji = goal ? goal.emoji : '🎯';
    var gradient = goal ? goal.gradient : 'sunset';
    var priority = goal ? goal.priority : 'medium';
    var pinned = goal ? !!goal.pinned : false;
    var targetMinor = goal ? goal.target : 0;

    var content = document.createElement('div');
    content.className = 'goal-form';
    content.innerHTML =
      '<div class="goal-preview-mini grad-' + U.esc(gradient) + '" id="gf-preview">' +
      '<span class="emoji" id="gf-preview-emoji">' + U.esc(emoji) + '</span>' +
      '<div class="grow"><div class="title" id="gf-preview-title">' + U.esc(goal ? goal.title : 'Новая цель') + '</div>' +
      '<div class="target" id="gf-preview-target">' + U.esc(U.money(targetMinor, store.settings().currency)) + '</div></div></div>' +
      '<div class="form-grid" style="margin-top:16px">' +
      '<div class="field"><span class="field-label">Эмодзи</span><div class="emoji-grid" id="gf-emojis"></div></div>' +
      '<label class="field"><span class="field-label">Название цели</span><input class="input" id="gf-title" maxlength="40" placeholder="Например, Отпуск на море" autocomplete="off" value="' + U.esc(goal ? goal.title : '') + '"></label>' +
      '<label class="field"><span class="field-label">Сколько нужно накопить</span><div class="input-wrap"><input class="input" id="gf-target" inputmode="decimal" placeholder="100 000" autocomplete="off" value="' + U.esc(goal && goal.target ? U.minorToInput(goal.target) : '') + '"><span class="input-suffix">' + U.esc(U.currency(store.settings().currency).symbol) + '</span></div></label>' +
      '<label class="field"><span class="field-label">Цена товара (необязательно)</span><div class="input-wrap"><input class="input" id="gf-price" inputmode="decimal" placeholder="Цена из вишлиста" autocomplete="off" value="' + U.esc(goal && goal.price ? U.minorToInput(goal.price) : '') + '"><span class="input-suffix">' + U.esc(U.currency(store.settings().currency).symbol) + '</span></div></label>' +
      '<div class="form-row">' +
      '<label class="field"><span class="field-label">Дедлайн</span><input class="input" id="gf-deadline" type="date" value="' + U.esc(goal && goal.deadline ? U.dateInput(goal.deadline) : '') + '"></label>' +
      '<div class="field"><span class="field-label">Приоритет</span><div id="gf-priority"></div></div>' +
      '</div>' +
      '<div class="field"><span class="field-label">Обложка</span><div class="gradient-grid" id="gf-gradients"></div></div>' +
      '<label class="field"><span class="field-label">Заметка</span><textarea class="textarea" id="gf-note" maxlength="300" placeholder="Зачем эта цель и что поможет её достичь">' + U.esc(goal ? goal.note : '') + '</textarea></label>' +
      '<label class="field"><span class="field-label">Ссылка на товар</span><input class="input" id="gf-link" maxlength="500" inputmode="url" placeholder="https://" autocomplete="off" value="' + U.esc(goal ? goal.link : '') + '"></label>' +
      '<div class="between"><span class="settings-title">Закрепить на главной</span><span id="gf-pin"></span></div>' +
      '<div class="field-error" id="gf-error"></div>' +
      '</div>';

    var footer = document.createElement('div');
    footer.style.width = '100%';
    var save = document.createElement('button');
    save.type = 'button';
    save.className = 'btn btn-primary btn-block';
    save.textContent = editing ? 'Сохранить' : 'Создать цель';
    footer.appendChild(save);

    var sheet = ui.sheet({
      title: editing ? 'Редактировать цель' : 'Новая цель',
      content: content,
      footer: footer
    });

    var emojiGrid = content.querySelector('#gf-emojis');
    U.EMOJIS.forEach(function (e) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'emoji-btn' + (e === emoji ? ' is-on' : '');
      b.textContent = e;
      b.addEventListener('click', function () {
        emoji = e;
        content.querySelector('#gf-preview-emoji').textContent = e;
        emojiGrid.querySelectorAll('.emoji-btn').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      });
      emojiGrid.appendChild(b);
    });

    var gradGrid = content.querySelector('#gf-gradients');
    U.GRADIENTS.forEach(function (g) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'grad-btn grad-' + g + (g === gradient ? ' is-on' : '');
      b.setAttribute('aria-label', 'Обложка ' + g);
      b.addEventListener('click', function () {
        gradient = g;
        var preview = content.querySelector('#gf-preview');
        preview.className = 'goal-preview-mini grad-' + g;
        gradGrid.querySelectorAll('.grad-btn').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      });
      gradGrid.appendChild(b);
    });

    var priorityWrap = content.querySelector('#gf-priority');
    priorityWrap.appendChild(ui.segmented({
      value: priority,
      ariaLabel: 'Приоритет цели',
      options: [
        { value: 'low', label: 'Низкий' },
        { value: 'medium', label: 'Средний' },
        { value: 'high', label: 'Высокий' }
      ],
      onChange: function (v) { priority = v; }
    }));

    var pinWrap = content.querySelector('#gf-pin');
    pinWrap.appendChild(ui.toggle({
      checked: pinned,
      ariaLabel: 'Закрепить цель',
      onChange: function (v) { pinned = v; }
    }));

    var titleInput = content.querySelector('#gf-title');
    var targetInput = content.querySelector('#gf-target');
    var priceInput = content.querySelector('#gf-price');
    var noteInput = content.querySelector('#gf-note');
    var linkInput = content.querySelector('#gf-link');
    var deadlineInput = content.querySelector('#gf-deadline');
    var errorEl = content.querySelector('#gf-error');

    function refreshPreview() {
      var t = titleInput.value.trim() || 'Новая цель';
      content.querySelector('#gf-preview-title').textContent = t;
      var minor = U.toMinor(targetInput.value);
      content.querySelector('#gf-preview-target').textContent = U.money(minor, store.settings().currency);
    }
    titleInput.addEventListener('input', refreshPreview);
    targetInput.addEventListener('input', refreshPreview);

    save.addEventListener('click', function () {
      var title = titleInput.value.trim();
      var target = U.toMinor(targetInput.value);
      if (!title) { errorEl.textContent = 'Введите название цели'; titleInput.classList.add('has-error'); titleInput.focus(); return; }
      if (target <= 0) { errorEl.textContent = 'Укажите сумму больше нуля'; targetInput.classList.add('has-error'); targetInput.focus(); return; }
      titleInput.classList.remove('has-error');
      targetInput.classList.remove('has-error');
      var deadline = deadlineInput.value ? new Date(deadlineInput.value + 'T12:00:00').toISOString() : null;
      var data = {
        title: title,
        emoji: emoji,
        gradient: gradient,
        target: target,
        price: priceInput.value.trim() ? U.toMinor(priceInput.value) : null,
        priority: priority,
        pinned: pinned,
        note: noteInput.value.trim().slice(0, 300),
        link: linkInput.value.trim().slice(0, 500),
        deadline: deadline
      };
      if (editing) {
        store.updateGoal(goal.id, data);
        sheet.close();
        U.haptic([8, 20, 8]);
        ui.snackbar({ text: 'Цель обновлена' });
      } else {
        var created = store.addGoal(data);
        sheet.close();
        U.haptic([8, 20, 8]);
        ui.snackbar({ text: 'Цель создана' });
        KP.router.go('/goal/' + created.id);
      }
    });
  }

  KP.screens.goalForm = { open: open };
})(window.KP);
