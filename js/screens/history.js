/* История операций: группировка по дням, поиск, фильтры */
window.KP = window.KP || {};
KP.screens = KP.screens || {};
(function (KP) {
  'use strict';
  var U = KP.utils;
  var ui = KP.ui;
  var store = KP.store;
  var common = KP.screens.common;

  var state = { filter: 'all', query: '', limit: 40, goal: 'all', category: 'all', tag: '', from: '', to: '', sort: 'newest', selected: {} };

  function matches(tx) {
    if (state.filter !== 'all' && tx.type !== state.filter) return false;
    if (state.goal !== 'all' && tx.goalId !== state.goal && tx.toGoalId !== state.goal) return false;
    if (state.category !== 'all' && tx.categoryId !== state.category) return false;
    if (state.tag && !(tx.tags || []).some(function (tag) { return tag.toLowerCase().indexOf(state.tag.toLowerCase()) >= 0; })) return false;
    var time = new Date(tx.date).getTime();
    if (state.from && time < new Date(state.from + 'T00:00:00').getTime()) return false;
    if (state.to && time > new Date(state.to + 'T23:59:59').getTime()) return false;
    var q = state.query.trim().toLowerCase();
    if (!q) return true;
    var meta = common.txMeta(tx);
    var hay = [meta.title, meta.sub, tx.note, (tx.tags || []).join(' '),
      U.money(tx.amount, store.settings().currency), U.formatDate(tx.date, store.settings().dateFormat)]
      .join(' ').toLowerCase();
    return hay.indexOf(q) >= 0;
  }

  function render() {
    var screen = document.createElement('div');
    screen.className = 'screen history';
    var all = store.transactions();

    screen.appendChild(common.head('История', {
      subtitle: all.length + ' ' + U.plural(all.length, ['операция', 'операции', 'операций'])
    }));

    var tools = document.createElement('div');
    tools.className = 'history-tools';
    tools.innerHTML = '<div class="search-row"><span class="search-ico">' + ui.icon('search', 20) + '</span><input class="input" id="hist-search" type="search" placeholder="Поиск по операциям" autocomplete="off" value="' + U.esc(state.query) + '" aria-label="Поиск по операциям"></div>';
    tools.appendChild(ui.segmented({
      value: state.filter,
      ariaLabel: 'Фильтр по типу операции',
      options: [
        { value: 'all', label: 'Все' },
        { value: 'deposit', label: 'Пополнения' },
        { value: 'withdraw', label: 'Снятия' },
        { value: 'transfer', label: 'Переводы' }
      ],
      onChange: function (v) { state.filter = v; state.limit = 40; renderList(); }
    }));
    var filters = document.createElement('div');
    filters.className = 'form-row';
    filters.innerHTML = '<select class="input" id="hist-goal"><option value="all">Все цели</option></select><select class="input" id="hist-category"><option value="all">Все категории</option></select>' +
      '<input class="input" id="hist-tag" placeholder="Тег" aria-label="Фильтр по тегу"><input class="input" id="hist-from" type="date" aria-label="С даты"><input class="input" id="hist-to" type="date" aria-label="По дату">' +
      '<select class="input" id="hist-sort" aria-label="Сортировка"><option value="newest">Сначала новые</option><option value="oldest">Сначала старые</option><option value="amount-desc">Сумма: по убыванию</option><option value="amount-asc">Сумма: по возрастанию</option></select>';
    store.allGoals().forEach(function (goal) {
      var option = document.createElement('option'); option.value = goal.id; option.textContent = goal.title; filters.querySelector('#hist-goal').appendChild(option);
    });
    store.categories().forEach(function (cat) {
      var option = document.createElement('option'); option.value = cat.id; option.textContent = cat.name; filters.querySelector('#hist-category').appendChild(option);
    });
    tools.appendChild(filters);
    var bulk = document.createElement('div');
    bulk.className = 'row';
    bulk.innerHTML = '<button type="button" class="btn btn-ghost btn-sm" data-bulk="delete">Удалить выбранные</button><button type="button" class="btn btn-ghost btn-sm" data-bulk="export">Экспорт CSV</button>';
    tools.appendChild(bulk);
    screen.appendChild(tools);

    var listWrap = document.createElement('div');
    screen.appendChild(listWrap);

    function renderList() {
      listWrap.innerHTML = '';
      var filtered = all.filter(matches);
      filtered.sort(function (a, b) {
        if (state.sort === 'oldest') return new Date(a.date) - new Date(b.date);
        if (state.sort === 'amount-desc') return b.amount - a.amount;
        if (state.sort === 'amount-asc') return a.amount - b.amount;
        return new Date(b.date) - new Date(a.date);
      });
      if (!filtered.length) {
        listWrap.appendChild(ui.empty({
          title: 'Ничего не найдено',
          text: state.query || state.filter !== 'all' ? 'Попробуйте изменить запрос или фильтр.' : 'Операции появятся здесь после первого пополнения.',
          actionLabel: (state.query || state.filter !== 'all') ? 'Сбросить фильтры' : 'Пополнить',
          onAction: function () {
            if (state.query || state.filter !== 'all') {
              state.query = '';
              state.filter = 'all';
              var input = screen.querySelector('#hist-search');
              if (input) input.value = '';
              screen.querySelectorAll('.seg-item').forEach(function (b) { b.classList.toggle('is-on', b.dataset.value === 'all'); });
              renderList();
            } else {
              KP.screens.operations.open({ type: 'deposit' });
            }
          }
        }));
        return;
      }

      var visible = filtered.slice(0, state.limit);
      var groups = {};
      var order = [];
      visible.forEach(function (tx) {
        var key = U.dayKey(tx.date);
        if (!groups[key]) { groups[key] = []; order.push(key); }
        groups[key].push(tx);
      });

      order.forEach(function (key) {
        var items = groups[key];
        var total = 0;
        items.forEach(function (t) {
          if (t.type === 'deposit') total += t.amount;
          if (t.type === 'withdraw') total -= t.amount;
        });
        var group = document.createElement('section');
        group.className = 'day-group';
        var head = document.createElement('div');
        head.className = 'day-head';
        head.innerHTML = '<span class="day-date">' + U.esc(U.relativeDay(items[0].date)) + '</span>' +
          '<span class="day-total ' + (total > 0 ? 'good' : total < 0 ? 'bad' : 'dim') + '">' +
          U.esc(total === 0 ? '0 ' + U.currency(store.settings().currency).symbol : common.money(total, { sign: true })) + '</span>';
        group.appendChild(head);
        var list = document.createElement('div');
        list.className = 'list';
        items.forEach(function (tx) {
          var row = document.createElement('div');
          row.className = 'row';
          row.style.gap = '8px';
          row.innerHTML = '<input type="checkbox" data-select-tx="' + U.esc(tx.id) + '" aria-label="Выбрать операцию">';
          row.appendChild(common.txRow(tx));
          list.appendChild(row);
        });
        group.appendChild(list);
        listWrap.appendChild(group);
      });

      if (filtered.length > visible.length) {
        var more = document.createElement('button');
        more.type = 'button';
        more.className = 'btn btn-ghost btn-block load-more';
        more.textContent = 'Показать ещё ' + Math.min(40, filtered.length - visible.length);
        more.addEventListener('click', function () {
          state.limit += 40;
          renderList();
        });
        listWrap.appendChild(more);
      }
    }

    ['goal', 'category', 'tag', 'from', 'to', 'sort'].forEach(function (key) {
      var control = screen.querySelector('#hist-' + key);
      control.value = state[key] || (key === 'goal' || key === 'category' ? 'all' : key === 'sort' ? 'newest' : '');
      control.addEventListener('change', function () { state[key] = control.value; state.limit = 40; renderList(); });
      if (key === 'tag') control.addEventListener('input', function () { state.tag = control.value; renderList(); });
    });
    screen.addEventListener('change', function (e) {
      var box = e.target.closest('[data-select-tx]');
      if (box) state.selected[box.dataset.selectTx] = box.checked;
    });
    screen.addEventListener('click', function (e) {
      var button = e.target.closest('[data-bulk]');
      if (!button) return;
      var selected = Object.keys(state.selected).filter(function (id) { return state.selected[id]; });
      if (button.dataset.bulk === 'delete') {
        selected.forEach(function (id) { store.deleteTx(id); delete state.selected[id]; });
        renderList();
      } else {
        var rows = selected.length ? all.filter(function (tx) { return selected.indexOf(tx.id) >= 0; }) : all.filter(matches);
        var csv = ['Дата,Тип,Цель,Категория,Сумма,Теги,Комментарий'].concat(rows.map(function (tx) {
          var meta = common.txMeta(tx);
          return [tx.date, tx.type, meta.title, meta.cat ? meta.cat.name : '', U.minorToInput(tx.amount), (tx.tags || []).join('; '), tx.note || ''].map(function (value) { return '"' + String(value).replace(/"/g, '""') + '"'; }).join(',');
        })).join('\\r\\n');
        var blob = new Blob(['\\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a'); link.href = url; link.download = 'kopilka-history.csv'; link.click();
        URL.revokeObjectURL(url);
      }
    });
    var search = screen.querySelector('#hist-search');
    search.addEventListener('input', function () {
      state.query = search.value;
      state.limit = 40;
      renderList();
    });

    renderList();
    common.bindTxRows(screen);
    return screen;
  }

  KP.screens.history = { render: render };
})(window.KP);
