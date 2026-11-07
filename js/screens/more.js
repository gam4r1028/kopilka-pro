/* Ещё: профиль, темы, валюта, данные, о приложении */
window.KP = window.KP || {};
KP.screens = KP.screens || {};
(function (KP) {
  'use strict';
  var U = KP.utils;
  var ui = KP.ui;
  var store = KP.store;
  var common = KP.screens.common;

  var ACCENTS = [
    { id: 'yellow', color: '#FFDD2D', name: 'Жёлтый' },
    { id: 'blue', color: '#5B8CFF', name: 'Синий' },
    { id: 'green', color: '#3DDC97', name: 'Зелёный' },
    { id: 'purple', color: '#A78BFA', name: 'Фиолетовый' },
    { id: 'pink', color: '#FF6FAE', name: 'Розовый' },
    { id: 'orange', color: '#FF9F43', name: 'Оранжевый' }
  ];

  function render() {
    var screen = document.createElement('div');
    screen.className = 'screen more';
    var s = store.settings();
    var goals = store.allGoals();
    var total = store.total();
    var initials = (s.name || 'К').trim().charAt(0).toUpperCase() || 'К';

    screen.appendChild(common.head('Ещё', { subtitle: 'Настройки и данные' }));

    var profile = document.createElement('section');
    profile.className = 'profile-card';
    profile.innerHTML =
      '<span class="avatar">' + U.esc(initials) + '</span>' +
      '<div class="grow"><div class="profile-name">' + U.esc(s.name || 'Без имени') + '</div>' +
      '<div class="caption">' + goals.length + ' ' + U.plural(goals.length, ['цель', 'цели', 'целей']) + ' · ' +
      U.esc(common.money(total, { decimals: 0 })) + '</div></div>' +
      '<span class="pill accent">' + U.esc(s.currency) + '</span>';
    screen.appendChild(profile);

    /* Внешний вид */
    var look = document.createElement('section');
    look.className = 'settings-group';
    look.innerHTML = '<span class="label">Внешний вид</span><div class="theme-options">' +
      '<button type="button" class="theme-opt' + (s.theme === 'dark' ? ' is-on' : '') + '" data-theme-choice="dark">Тёмная</button>' +
      '<button type="button" class="theme-opt' + (s.theme === 'light' ? ' is-on' : '') + '" data-theme-choice="light">Светлая</button>' +
      '<button type="button" class="theme-opt' + (s.theme === 'amoled' ? ' is-on' : '') + '" data-theme-choice="amoled">AMOLED</button>' +
      '</div><div class="settings-row"><div class="settings-main"><div class="settings-title">Акцент</div>' +
      '<div class="settings-sub">Цвет кнопок и выделений</div></div><div class="accent-grid">';
    ACCENTS.forEach(function (a) {
      look.innerHTML += '<button type="button" class="accent-swatch' + (s.accent === a.id ? ' is-on' : '') + '" data-accent-choice="' + a.id + '" style="background:' + a.color + '" aria-label="' + a.name + '"></button>';
    });
    look.innerHTML += '</div></div>';
    screen.appendChild(look);

    /* Основное */
    var main = document.createElement('section');
    main.className = 'settings-group';
    var currencyOptions = Object.keys(U.CURRENCIES).map(function (code) {
      return '<option value="' + code + '"' + (s.currency === code ? ' selected' : '') + '>' + U.esc(U.CURRENCIES[code].symbol + ' ' + U.CURRENCIES[code].name) + '</option>';
    }).join('');
    main.innerHTML = '<span class="label">Основное</span>' +
      '<div class="settings-row"><div class="settings-main"><div class="settings-title">Валюта</div>' +
      '<div class="settings-sub">Суммы не конвертируются</div></div>' +
      '<select class="select" data-setting="currency" aria-label="Валюта" style="width:auto;min-height:40px;padding:8px 30px 8px 12px;font-size:14px">' + currencyOptions + '</select></div>' +
      '<div class="settings-row"><div class="settings-main"><div class="settings-title">Формат даты</div>' +
      '<div class="settings-sub">Как показывать даты</div></div>' +
      '<select class="select" data-setting="dateFormat" aria-label="Формат даты" style="width:auto;min-height:40px;padding:8px 30px 8px 12px;font-size:14px">' +
      '<option value="dd.mm.yyyy"' + (s.dateFormat === 'dd.mm.yyyy' ? ' selected' : '') + '>31.12.2026</option>' +
      '<option value="d MMMM yyyy"' + (s.dateFormat === 'd MMMM yyyy' ? ' selected' : '') + '>31 декабря 2026</option>' +
      '<option value="yyyy-mm-dd"' + (s.dateFormat === 'yyyy-mm-dd' ? ' selected' : '') + '>2026-12-31</option>' +
      '</select></div>' +
      '<div class="settings-row"><div class="settings-main"><div class="settings-title">Скрывать суммы</div>' +
      '<div class="settings-sub">Прятать баланс на главной</div></div><span class="toggle-holder"></span></div>';
    screen.appendChild(main);
    main.querySelector('.toggle-holder').appendChild(ui.toggle({
      checked: !!s.hideAmounts,
      ariaLabel: 'Скрывать суммы',
      onChange: function (v) { store.updateSettings({ hideAmounts: v }); }
    }));

    /* Данные */
    var data = document.createElement('section');
    data.className = 'settings-group';
    data.innerHTML = '<span class="label">Данные</span>' +
      '<button type="button" class="settings-row" data-act="demo"><span class="icon">' + ui.icon('sparkles') + '</span>' +
      '<span class="settings-main"><span class="settings-title">Демо-данные</span><span class="settings-sub">Загрузить пример целей и операций</span></span>' +
      '<span class="icon">' + ui.icon('chevronRight') + '</span></button>' +
      '<button type="button" class="settings-row" data-act="export"><span class="icon">' + ui.icon('download') + '</span>' +
      '<span class="settings-main"><span class="settings-title">Экспорт JSON</span><span class="settings-sub">Резервная копия всех данных</span></span>' +
      '<span class="icon">' + ui.icon('chevronRight') + '</span></button>' +
      '<button type="button" class="settings-row" data-act="import"><span class="icon">' + ui.icon('upload') + '</span>' +
      '<span class="settings-main"><span class="settings-title">Импорт JSON</span><span class="settings-sub">Восстановить из резервной копии</span></span>' +
      '<span class="icon">' + ui.icon('chevronRight') + '</span></button>' +
      '<button type="button" class="settings-row danger" data-act="reset"><span class="icon">' + ui.icon('trash') + '</span>' +
      '<span class="settings-main"><span class="settings-title">Сбросить всё</span><span class="settings-sub">Удалить цели, операции и настройки</span></span>' +
      '<span class="icon">' + ui.icon('chevronRight') + '</span></button>' +
      '<input type="file" id="import-file" accept="application/json,.json" hidden>';
    screen.appendChild(data);

    /* О приложении */
    var about = document.createElement('section');
    about.className = 'settings-group';
    about.innerHTML = '<span class="label">О приложении</span>' +
      '<button type="button" class="settings-row" data-act="selftest"><span class="icon">' + ui.icon('check') + '</span>' +
      '<span class="settings-main"><span class="settings-title">Проверить расчёты</span><span class="settings-sub">Деньги, прогнозы и миграции</span></span>' +
      '<span class="icon">' + ui.icon('chevronRight') + '</span></button>' +
      '<div class="settings-row"><div class="settings-main"><div class="settings-title">Версия</div>' +
      '<div class="settings-sub">Копилка Pro · этап 1</div></div><span class="settings-value">1.0.0</span></div>';
    screen.appendChild(about);

    var footer = document.createElement('div');
    footer.className = 'about-card';
    footer.innerHTML = '<span class="about-logo">' + ui.icon('piggy', 28) + '</span><br>' +
      'Копилка Pro — личная копилка без банков и регистрации.<br>Данные хранятся только на этом устройстве.';
    screen.appendChild(footer);

    screen.addEventListener('click', function (e) {
      var theme = e.target.closest('[data-theme-choice]');
      if (theme) {
        store.updateSettings({ theme: theme.dataset.themeChoice });
        U.haptic(6);
        return;
      }
      var accent = e.target.closest('[data-accent-choice]');
      if (accent) {
        store.updateSettings({ accent: accent.dataset.accentChoice });
        U.haptic(6);
        return;
      }
      var act = e.target.closest('[data-act]');
      if (!act) return;
      var a = act.dataset.act;
      if (a === 'demo') demo();
      else if (a === 'export') exportData();
      else if (a === 'import') screen.querySelector('#import-file').click();
      else if (a === 'reset') reset();
      else if (a === 'selftest') selfTest();
    });

    var currencySelect = screen.querySelector('[data-setting="currency"]');
    currencySelect.addEventListener('change', function () {
      store.updateSettings({ currency: currencySelect.value });
      ui.snackbar({ text: 'Валюта изменена. Суммы не конвертировались.' });
    });
    var dateSelect = screen.querySelector('[data-setting="dateFormat"]');
    dateSelect.addEventListener('change', function () {
      store.updateSettings({ dateFormat: dateSelect.value });
    });

    var fileInput = screen.querySelector('#import-file');
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      U.readFile(file).then(function (text) {
        return ui.confirm({
          title: 'Импортировать данные?',
          text: 'Текущие цели и операции будут заменены содержимым файла «' + file.name + '».',
          confirmText: 'Импортировать',
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          try {
            store.importJSON(text);
            ui.snackbar({ text: 'Данные импортированы' });
            if (!store.settings().onboardingDone) KP.screens.onboarding.show();
          } catch (err) {
            ui.snackbar({ text: 'Не удалось импортировать: ' + (err.message || 'неверный файл') });
          }
        });
      }).catch(function () {
        ui.snackbar({ text: 'Не удалось прочитать файл' });
      });
      fileInput.value = '';
    });

    return screen;
  }

  function demo() {
    var hasData = store.transactions().length > 0 || store.allGoals().length > 0;
    var ask = hasData ? ui.confirm({
      title: 'Загрузить демо?',
      text: 'Текущие цели и операции будут заменены демонстрационными данными.',
      confirmText: 'Загрузить',
      danger: true
    }) : Promise.resolve(true);
    ask.then(function (ok) {
      if (!ok) return;
      store.seedDemo();
      ui.snackbar({ text: 'Демо-данные загружены' });
    });
  }

  function exportData() {
    var date = U.dateInput(new Date());
    var ok = U.download('kopilka-pro-' + date + '.json', store.exportJSON(), 'application/json');
    if (ok) {
      store.updateSettings({ lastBackupAt: U.nowISO() });
      ui.snackbar({ text: 'Резервная копия скачана' });
    } else {
      ui.snackbar({ text: 'Не удалось создать файл' });
    }
  }

  function reset() {
    ui.confirm({
      title: 'Сбросить всё?',
      text: 'Все цели, операции и настройки будут удалены. Это действие нельзя отменить.',
      confirmText: 'Сбросить',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      store.reset();
      KP.router.go('/home');
      KP.screens.onboarding.show();
      ui.snackbar({ text: 'Данные сброшены' });
    });
  }

  function selfTest() {
    if (typeof KP.selfTest !== 'function') {
      ui.snackbar({ text: 'Проверка доступна в консоли: KP.selfTest()' });
      return;
    }
    var ok = KP.selfTest();
    ui.snackbar({ text: ok ? 'Все проверки пройдены' : 'Есть ошибки — подробности в консоли' });
  }

  KP.screens.more = { render: render };
})(window.KP);
